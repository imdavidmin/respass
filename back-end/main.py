from typing import Optional
from db import make_query
from utils import verify_jwt_token
from flask import Flask, request, Request

app = Flask(__name__)
cors = {'Access-Control-Allow-Origin': "*"}


@app.route('/api/db/queryInventory', methods=['POST'])
def inventory_query():
    if not is_post_json(request):
        return 'Expecting JSON POST', 400, cors

    is_verified, error_msg = verify_jwt_token(
        get_bearer_token(request.headers.get('Authorization')))

    if not is_verified:
        body, code = f'''Failed to authenticate JWT: {error_msg}''', 400
    elif request.json == None:
        body, code = 'No JSON payload', 400
    else:
        body, code = make_query(request.json)

    return body, code, cors


def is_post_json(req: Request):
    return req.is_json and req.method == 'POST'


def get_bearer_token(auth: Optional[str]):
    if not auth or not auth.startswith('Bearer '):
        return None
    return auth.replace('Bearer ', '')
