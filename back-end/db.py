from requests import HTTPError
from sqlalchemy import create_engine, insert, select, table, column, delete, func, Column, Integer, String
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

        with engine.connect() as db:
            entries = []
            for row in payload:
                item_type, bld, unit, name, location, note = tuple(row)
                now = int(time.time())
                log = json.dumps(
                    [{"by": staff_id, "to": location, "ts": now}])
                entries.append([
                    item_type, bld, unit, name, log, note, 'w', staff_id, func.now()])
            query = inventory_table.insert().values(entries)

            db.execute(query)
            db.commit()
        return 'good', 200
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


def new_resident(query_json: Optional[NewResidentPayload]) -> str:
    required_fields = ['name', 'bld', 'unit']
    if query_json == None or not has_all_fields(dict(query_json), required_fields):
        raise ValueError('Query JSON cannot be None')

    query_json['role'] = 'res'

    with engine.connect() as db:
        query = insert(id_table) \
            .values(bld=query_json['bld'], unit=query_json['unit'], name=query_json['name'], role='res') \
            .returning(id_table.c.id)
        res = db.execute(query).fetchone()

        if res == None:
            raise ValueError('DB query did not return an ID')
        id = str(res[0])

        email, phone = query_json.get('email'), query_json.get('phone')
        if phone: 
            phone = e164_phone(phone)

        if email or phone:
            knock = Knock(api_key=environ['KNOCK_SECRET_KEY'])
            knock.users.identify(
                id=id,
                data={
                    "name": query_json.get('name'),
                    "email": email,
                    "phone_number": phone
                })

        db.commit()
        return id


def query_resident(query_json: Optional[dict[str, str]]):
    if query_json == None:
        raise ValueError('Query JSON cannot be None')
    with engine.connect() as db:
        query = select(id_table)
        for k, v in query_json.items():
            # TODO: Add multiple parameter query capability, [v1, v2]
            query = query.where(func.lower(column(k)) == v.lower())
        print(query)
        df = read_sql_query(query, db)

        print(df['id'].to_list())
        return df.to_json(orient='split')


def delete_resident(id: int):
    with engine.connect() as db:
        query = delete(id_table).where(id_table.c.id == id)
        db.execute(query)
        db.commit()
    
    try: 
        knock = Knock(environ['KNOCK_SECRET_KEY'])
        knock.users.delete(id)
    except HTTPError as e: 
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
    knockResp: dict = knock.users.get(id)
    return {
        'email': knockResp.get('email'),
        'phone': knockResp.get('phone'),
        'id': knockResp.get('id')
    }


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
