from typing import Optional
from db import add_inventory, delete_resident, get_all_residents, get_resident_contact, query_inventory, new_resident, query_resident, submit_inventory_collection, update_resident
from utils import get_bearer_token, get_jwt_id, get_signed_jwt, verify_jwt_token
from flask import Flask, request, Request
from flask_cors import CORS
from os import environ

app = Flask(__name__)
CORS(app)

not_handled_response = 'No service on this path', 404
valid_routes = {
    'db': ['addInventory',
           'addResident',
           'deleteResident',
           'updateResident',
           'getAllResidents',
           'getResidentContact',
           'inventoryQuery',
           'queryResident',
           'submitInventoryCollection'],
    'jwt': ['getSignedJWT']
}

not_json_post_paths = [
    ('db', 'getAllResidents'),
    ('db', 'deleteResident'),
    ('db', 'getResidentContact')
]

staff_role_auth_exempt_paths = [('db', 'queryInventory')]


@app.before_request
def return_preflight():
    if (request.method == 'OPTIONS'):
        return ''


@app.route('/api/<interface>/<path:path>', methods=['GET', 'POST'])
def route_request(interface, path):
    # Validate the API URL path
    paths = valid_routes.get(interface)
    if paths == None or not path.split('?')[0] in paths:
        return not_handled_response

    # Check JWT authentication and for JSON payload if POST
    is_auth_exempt = (interface, path) in staff_role_auth_exempt_paths
    is_not_json_post = (interface, path) in not_json_post_paths

    if not is_auth_exempt:
        auth_result = check_request(request, not is_not_json_post)
        if auth_result != None:
            return auth_result

    # Authorised and valid requests are routed by interface
    try:
        if interface == 'jwt':
            return jwt_routing(path)
        elif interface == 'db':
            return db_routing(path)
    except Exception as e:
        print(e)
        return '', 500

    return not_handled_response


def db_routing(path):
    if path == 'addInventory':
        staff_id = get_jwt_id(request)
        if staff_id == None:
            return 'Cannot read staff ID from JWT'
        else: 
            return add_inventory(request.json, staff_id)
    elif path == 'addResident':
        return new_resident(request.json)
    elif path == 'deleteResident':
        id = request.args.get('id')
        if id == None or not id.isdigit():
            return 'Invalid ID', 400
        else:
            return delete_resident(int(id))
    elif path == 'getAllResidents':
        return get_all_residents(), {'content-type': 'application/json'}
    elif path == 'getResidentContact':
        id = request.args.get('id')
        if id == None:
            return 'No ID in search params', 400
        else:
            return get_resident_contact(id)
    elif path == 'inventoryQuery':
        return query_inventory(request.json)
    elif path == 'queryResident':
        return query_resident(request.json), {'content-type': 'application/json'}
    elif path == 'submitInventoryCollection':
        staff_id = get_jwt_id(request)
        if staff_id == None:
            return 'Cannot read staff ID from JWT'
        else: 
            return submit_inventory_collection(request.json, int(staff_id))
    elif path == 'updateResident': 
        id = request.args.get('id')
        if id == None:
            return 'No ID in search params', 400
        else:
            return update_resident(request.json, id)

    return not_handled_response


def jwt_routing(path):
    if path == 'getSignedJWT':
        succeeded, res = get_signed_jwt(
            'ES256', request.json, request.args.get('sendToEmail') == 'true')
        if succeeded:
            return res
        else:
            return res, 400
    return not_handled_response


def is_post_json(req: Request):
    return req.is_json and req.method == 'POST'


def check_request(request, is_post=False):
    if is_post and not is_post_json(request):
        return 'Expecting JSON POST', 400

    is_verified, error_msg = verify_jwt_token(
        get_bearer_token(request.headers.get('Authorization')))

    if not is_verified:
        body, code = f'''Failed to authenticate JWT: {error_msg}''', 401
    elif is_post and request.json == None:
        body, code = 'No JSON payload', 400
    else:
        return None
