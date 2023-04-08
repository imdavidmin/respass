from requests import HTTPError, JSONDecodeError
from sqlalchemy import create_engine, insert, update, select, table, column, delete, func, Column, Integer, String, tuple_
from sqlalchemy.orm import Session, declarative_base
from sqlalchemy.dialects.postgresql import JSONB
from pandas import DataFrame, read_sql_query

from knockapi import Knock
from utils import debug_print, e164_phone, has_all_fields, verify_jwt_token
import time
import json

from typing import Optional, TypedDict
from typing_extensions import NotRequired

from os import environ
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(dotenv_path=Path('.') / '.env')

engine = create_engine(environ['DB_CONNECTION_STRING'], pool_pre_ping=True)
max_records = 100

InventoryQueryPayload = TypedDict('InventoryQueryPayload', {
    'bld': list[str],
    'unit': list[str],
    'name': Optional[list[str]],
    'id': Optional[list[str]]
})
NewResidentPayload = TypedDict('NewResidentPayload', {
    'name': str,
    'bld': str,
    'unit': str,
    'role': NotRequired[str],
    'email': NotRequired[str],
    'phone': NotRequired[str]
})
ResidentQueryPayload = TypedDict('ResidentQueryPayload', {
    'bld': NotRequired[str],
    'unit': NotRequired[str]
})

AddInventoryPayload = list[list[str]]

id_table = table("identity", column("name"), column("bld"),
                 column("unit"), column("id"), column('role'))
inventory_table = table('inventory', column("type"), column('owner_bld'), column('owner_unit'), column(
    'owner_name'), column("log"), column("note"), column("status"), column("receiver"),  column(
    "received"))


def add_inventory(payload: Optional[AddInventoryPayload], staff_id: int):
    try:
        if payload == None:
            raise Exception('No Payload')

        notify_list = []
        with engine.connect() as db:
            # Add each item received into the inventory table
            entries = []
            for row in payload:
                item_type, bld, unit, name, location, note = tuple(row)
                notify_list.append((name, bld, unit))
                now = int(time.time())
                log = json.dumps(
                    [{"by": staff_id, "to": location, "ts": now}])
                entries.append([
                    item_type, bld, unit, name, log, note, 'w', staff_id, func.now()])

            query = inventory_table.insert().values(entries)
            db.execute(query)
            db.commit()

            # Find all registered IDs
            id_match_query = select(id_table).where(
                tuple_(id_table.c.name, id_table.c.bld,
                       id_table.c.unit)
                .in_(notify_list)
            )
            res = db.execute(id_match_query).fetchall()

            # Notify those recorded in the system that match the recipient details
            notify_ids = [str(id) for (n, b, u, id, r) in res]
            knock = Knock(environ['KNOCK_SECRET_KEY'])
            knock.workflows.trigger(
                key=environ['KNOCK_WORKFLOW_PARCEL_NOTIFICATION'],
                recipients=notify_ids
            )

            # Notify primary contact of a unit if the package name is not matched to a registered resident
            no_match: list[tuple[str, str, str]] = [entry for entry in notify_list
                                                    if entry not in [(n, b, u) for (n, b, u, id, r) in res]]
            no_match_query = select(id_table.c.id) \
                .where(tuple_(id_table.c.bld, id_table.c.unit)
                       .in_([(b, u) for (n, b, u) in no_match])) \
                .distinct(id_table.c.bld, id_table.c.unit)
            alt_notify_ids = [str(row[0])
                              for row in db.execute(no_match_query).fetchall()]
            for i in range(len(alt_notify_ids)):
                knock.workflows.trigger(
                    key=environ['KNOCK_WORKFLOW_PARCEL_NO_MATCH'],
                    recipients=[alt_notify_ids[i]],
                    data={"parcelRecipient": no_match[i][0]}
                )

        return {"notified": notify_ids, "notMatched": alt_notify_ids}, 200
    except Exception as e:
        return str(e), 400


def query_inventory(query_json: Optional[InventoryQueryPayload]):
    if query_json == None:
        raise ValueError('Query JSON cannot be None')

    with engine.connect() as db:
        inventory_result = table('inventory', column('type'),  column('owner_bld'), column('owner_unit'), column(
            'owner_name'), column("note"), column("status"), column("status"), column('log'), column('id'))
        query = select(inventory_result).where(
            (func.lower(column('owner_bld')) == func.lower(query_json['bld'])) &
            (func.lower(column('owner_unit'))
             == func.lower(query_json['unit']))
        )

        debug_print(
            'Submitting query to database with the SQL statement:\n', query)

        df: DataFrame = read_sql_query(query, db)

        return df.to_dict(orient='split'), 200


def query_resident(query_json: Optional[dict[str, str]]):
    if query_json == None:
        raise ValueError('Query JSON cannot be None')
    with engine.connect() as db:
        query = select(id_table)
        for k, v in query_json.items():
            # TODO: Add multiple parameter query capability, [v1, v2]
            query = query.where(func.lower(column(k)) == v.lower())
        df = read_sql_query(query, db)

        return df.to_json(orient='split')


def delete_resident(id: int):
    with engine.connect() as db:
        query = delete(id_table).where(id_table.c.id == id)
        db.execute(query)
        db.commit()

    knock = Knock(environ['KNOCK_SECRET_KEY'])
    try:
        knock.users.delete(id)
    except (HTTPError, JSONDecodeError) as e:
        pass

    return ''


def get_all_residents():
    with engine.connect() as db:
        id_results = table("identity", column("name"), column("bld"),
                           column("unit"), column("id"))
        df = read_sql_query(select(id_results), db)

        return df.to_json(orient='split')


def get_resident_contact(id: str):
    knock = Knock(environ['KNOCK_SECRET_KEY'])
    try:
        knockResp: dict = knock.users.get(id)
        return {
            'email': knockResp.get('email'),
            'phone': knockResp.get('phone_number'),
            'id': knockResp.get('id')
        }
    except HTTPError as e:
        return '', 404


def submit_inventory_collection(payload: Optional[dict], staff_id: int):
    if payload == None:
        return 'No payload', 400
    base = declarative_base()

    class Inventory(base):
        __tablename__ = "inventory"
        id = Column(Integer, primary_key=True)
        status = Column(String)
        log = Column(JSONB)

    verified, data = verify_jwt_token(payload.get('recipientJWT'))
    if not verified:
        collected_by = 'Unverified collection'
    else:
        collected_by = 'Verfied collection: ' + data.get('sub')  # type: ignore

    new_log_entry = {
        "by": staff_id,
        "to": f"{collected_by}",
        "ts": int(time.time())
    }

    with Session(engine) as session:
        matching_inventory_rows = session.query(
            Inventory).filter(Inventory.id.in_(payload['collected'])).all()

        # Update each inventory row with log entry and "c" status
        for row in matching_inventory_rows:
            row.status = 'c'  # type: ignore
            row.log = [new_log_entry] + row.log  # type: ignore

        session.commit()

        if len(matching_inventory_rows) != 0:
            return f"{len(matching_inventory_rows)} items marked as collected", 200
        else:
            return "No items updated", 400


def new_resident(payload: Optional[NewResidentPayload]):
    validation = check_payload(payload)
    if validation != None or payload == None:
        return validation

    payload['role'] = 'res'

    with engine.connect() as db:
        query = insert(id_table) \
            .values(bld=payload['bld'], unit=payload['unit'], name=payload['name'], role='res') \
            .returning(id_table.c.id)
        res = db.execute(query).fetchone()

        if res == None:
            raise ValueError('DB query did not return an ID')
        id = str(res[0])

        update_user_in_knock(
            id, payload.get('name'), payload.get('email'), payload.get('phone')
        )

        db.commit()
        return id


def update_resident(payload: Optional[NewResidentPayload], id: str):
    validation = check_payload(payload)
    if validation != None or payload == None:
        return validation

    with engine.connect() as db:
        id_matches = db.execute(select(id_table).where(column('id') == id))
        if id_matches.rowcount == 0:
            return 'No resident with this ID', 400
        query = update(id_table) \
            .values(bld=payload['bld'], unit=payload['unit'], name=payload['name']) \
            .where(column('id') == id)
        db.execute(query)
        db.commit()

    update_user_in_knock(
        id, payload['name'],  payload.get('email'), payload.get('phone')
    )

    return ''


def check_payload(payload):
    required_fields = ['name', 'bld', 'unit']
    if payload == None or not has_all_fields(dict(payload), required_fields):
        return 'Missing at least one required field: name, bld, unit', 400


def update_user_in_knock(id: str, name: str, email: Optional[str], phone: Optional[str]):
    if phone:
        phone = e164_phone(phone)

    knock = Knock(api_key=environ['KNOCK_SECRET_KEY'])
    knock.users.identify(
        id=id,
        data={
            "name": name,
            "email": email,
            "phone_number": phone
        })
