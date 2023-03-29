from sqlalchemy import create_engine, insert, text, select, table, column, func
from pandas import DataFrame, read_sql_query
from utils import debug_print, has_all_fields
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
ResidentQueryPayload = TypedDict('ResidentQueryPayload', {
    'name': str,
    'bld': str,
    'unit': str,
    'role': NotRequired[str]
})

AddInventoryPayload = list[list[str]]

id_table = table("identity", column("name"), column("bld"),
                 column("unit"), column("id"), column('role'))
inventory_table = table('inventory', column("type"), column('owner_bld'), column('owner_unit'), column(
    'owner_name'), column("log"), column("note"), column("status"), column("receiver"),  column(
    "received"))


def add_inventory(payload: Optional[AddInventoryPayload], receiver_id: int):
    try:
        if payload == None:
            raise Exception('No Payload')
        
        with engine.connect() as db:
            entries = []
            for row in payload:
                item_type, bld, unit, name, location, note = tuple(row)
                now = int(time.time())
                log = json.dumps(
                    {"by": receiver_id, "to": location, "ts": now})
                entries.append([
                    item_type, bld, unit, name, log, note, 'w', receiver_id, func.now()])
            query = inventory_table.insert().values(entries)

            db.execute(query)
            db.commit()
        return 'good', 200
    except Exception as e:
        return str(e), 400


def query_inventory(query_json: Optional[InventoryQueryPayload]):
    if query_json == None:
        raise ValueError('Query JSON cannot be None')

    owner_filter = ','.join(map(str, query_json['sub']))
    with engine.connect() as db:
        query = f'''SELECT * FROM inventory WHERE owner IN ({owner_filter}) LIMIT {max_records}'''

        debug_print(
            'Submitting query to database with the SQL statement:\n', query)

        df: DataFrame = read_sql_query(text(query), db)

        df['received'] = \
            df.index.to_series().astype(int).floordiv(1000000).astype(int)

        return df.to_dict(orient='split'), 200


def new_resident(query_json: Optional[ResidentQueryPayload]) -> str:
    required_fields = ['name', 'bld', 'unit']
    if query_json == None or not has_all_fields(dict(query_json), required_fields):
        raise ValueError('Query JSON cannot be None')

    query_json['role'] = 'res'

    with engine.connect() as db:
        query = insert(id_table).values(**query_json).returning(id_table.c.id)
        res = db.execute(query).fetchone()

        if res == None:
            raise ValueError('DB query did not return an ID')

        db.commit()
        return str(res[0])


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
        return df.to_json(orient='split')

def get_all_residents():
    with engine.connect() as db:
        id_results = table("identity", column("name"), column("bld"),
                           column("unit"), column("id"))
        df = read_sql_query(select(id_results), db)

        return df.to_json(orient='split')