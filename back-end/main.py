from typing import Optional
from db import get_all_residents, query_inventory, new_resident, query_resident
from utils import get_signed_jwt, verify_jwt_token
from flask import Flask, request, Request
from os import environ

app = Flask(__name__)
cors = {'Access-Control-Allow-Origin': "*"}
preflight = '', 200, {
    'Access-Control-Allow-Headers': 'authorization,content-type',
    'Access-Control-Request-Method': 'POST, OPTIONS'
} | cors


@app.before_request
def return_preflight():
    if (request.method == 'OPTIONS'):
        return preflight

@app.route('/api/jwt/getSignedJWT',  methods=['POST'])
def sign_jwt():
    auth_result = check_authenticated(request, True)
    if auth_result == None:
        succeeded, res = get_signed_jwt('ES256', request.json)
        if succeeded:
            return res, cors
        else:
            return res, 400, cors
    else:
        return auth_result


@app.route('/api/db/addResident', methods=['POST'])
def add_resident():
    auth_result = check_authenticated(request, True)
    if auth_result == None:
        id = new_resident(request.json)
        return id, cors
    else:
        return auth_result


@app.route('/api/db/getAllResidents', methods=['GET'])
def all_residents():
    auth_result = check_authenticated(request)
    if auth_result == None:
        data = get_all_residents()
        return data, cors
    else:
        return auth_result


@app.route('/api/db/queryResident', methods=['POST'])
def find_resident():
    auth_result = check_authenticated(request, True)
    if auth_result == None:
        res = query_resident(request.json)
        return res, {'content-type': 'application/json'} | cors
    else:
        return auth_result


@app.route('/api/db/queryInventory', methods=['POST'])
def inventory_query():
    auth_result = check_authenticated(request, True)
    if auth_result == None:
        body, code = query_inventory(request.json)
        return body, code, cors
    else:
        return auth_result


def is_post_json(req: Request):
    return req.is_json and req.method == 'POST'


def get_bearer_token(auth: Optional[str]):
    if not auth or not auth.startswith('Bearer '):
        return None
    return auth.replace('Bearer ', '')


def check_authenticated(request, is_post=False):
    if is_post and not is_post_json(request):
        return 'Expecting JSON POST', 400, cors

    is_verified, error_msg = verify_jwt_token(
        get_bearer_token(request.headers.get('Authorization')))

    if not is_verified:
        body, code = f'''Failed to authenticate JWT: {error_msg}''', 400
    elif request.json == None:
        body, code = 'No JSON payload', 400
    else:
        return None
