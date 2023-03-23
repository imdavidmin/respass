from sqlalchemy import create_engine, text
from datetime import datetime, timedelta
from pandas import DataFrame, read_sql_query, Series
from flask import request
from os import environ
from typing import TypedDict

from dotenv import load_dotenv
from pathlib import Path
load_dotenv(dotenv_path=Path('.') / '.env')

engine = create_engine(environ['DB_CONNECTION_STRING'], pool_pre_ping=True)
max_records = 100

QueryPayload = TypedDict('QueryPayload', {'sub': list[str]})


def make_query(query_json: QueryPayload):
    owner_filter = ','.join(map(str, query_json['sub']))
    with engine.connect() as db:
        query = f'''SELECT * FROM inventory WHERE owner IN ({owner_filter}) LIMIT {max_records}'''

        print('Submitting query to database with the SQL statement:\n', query)

        df: DataFrame = read_sql_query(text(query), db)

        df['received'] = \
            df.index.to_series().astype(int).floordiv(1000000).astype(int)

        return df.to_dict(orient='split'), 200
