from typing import Optional
from db import make_query, new_resident
from utils import verify_jwt_token
from flask import Flask, request, Request
from os import environ

app = Flask(__name__)
cors = {'Access-Control-Allow-Origin': "*"}
preflight = '', 200, {
    'Access-Control-Allow-Headers': 'authorization,content-type',
    'Access-Control-Request-Method': 'POST, OPTIONS'
} | cors


@app.route('/api/jwt/get_secret_pem',  methods=['GET', 'OPTIONS'])
def get_secret_key():
    if request.method == 'OPTIONS':
        return preflight

    is_verified, error_msg = verify_jwt_token(
        get_bearer_token(request.headers.get('Authorization')))
    if not is_verified:
        body, code = f'''Failed to authenticate JWT: {error_msg}''', 400

    return environ['JWT_PRIVATE_KEY']


@app.route('api/db/addResident', methods=['POST', 'OPTIONS'])
def add_resident():
    auth_result = check_authenticated(request)
    if auth_result == None:
        id =  new_resident(request.json)
        return id, cors
    else:
        return auth_result

@app.route('/api/db/queryInventory', methods=['POST', 'OPTIONS'])
def inventory_query():
    auth_result = check_authenticated(request)
    if auth_result == None:
        body, code = make_query(request.json)
        return body, code, cors
    else:
        return auth_result

def is_post_json(req: Request):
    return req.is_json and req.method == 'POST'


def get_bearer_token(auth: Optional[str]):
    if not auth or not auth.startswith('Bearer '):
        return None
    return auth.replace('Bearer ', '')


def check_authenticated(request):
    if request.method == 'OPTIONS':
        return preflight
    if not is_post_json(request):
        return 'Expecting JSON POST', 400, cors

    is_verified, error_msg = verify_jwt_token(
        get_bearer_token(request.headers.get('Authorization')))

    if not is_verified:
        body, code = f'''Failed to authenticate JWT: {error_msg}''', 400
    elif request.json == None:
        body, code = 'No JSON payload', 400
    else:
        return None
