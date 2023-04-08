import base64
import io
from typing import Any, Optional
import jwt
from os import environ

from flask import Request
from knockapi import Knock

import qrcode
from qrcode.image.pure import PyPNGImage


def extract_jwt_payload(jwt_string: str):
    return jwt.decode(jwt_string,
                      key=environ['JWT_PUBLIC_KEY'],
                      algorithms=['ES256'],
                      options={
                          "require": ["sub", "name", "role", "ic", "iss"],
                      })


def get_jwt_id(req: Request):
    token = get_bearer_token(req.headers.get('Authorization'))
    if token == None:
        return None
    return extract_jwt_payload(token).get('sub')


def get_bearer_token(auth: Optional[str]):
    if not auth or not auth.startswith('Bearer '):
        return None
    return auth.replace('Bearer ', '')


def verify_jwt_token(jwt_string: Optional[str]):
    """\
    Verifies a ES256 JWT has a valid signature, with a PEM public key as an environment variable.
    """
    if not jwt_string:
        return False, 'No JWT supplied as Bearer token'

    debug_print('Using public key:\n', environ['JWT_PUBLIC_KEY'])

    try:
        debug_print('Received JWT\n', jwt_string)
        data = extract_jwt_payload(jwt_string)
        if data['role'] != 'staff':
            return False, f'''A "staff" token is required, this token has "{data["role"]}"'''
        return True, data
    except jwt.InvalidSignatureError:
        return False, 'Signature invalid'
    except jwt.MissingRequiredClaimError:
        return False, 'Token missing required data'
    except Exception as e:
        return False, str(e)


def debug_print(*args):
    if (environ.get('IS_VERBOSE') == 'Y'):
        print(*args)


def get_signed_jwt(alg: str, payload: Optional[dict[str, Any]], send_qr_to_email: Optional[bool]) -> tuple[bool, str]:
    if payload == None:
        return False, 'Missing header or payload'
    else:
        try:
            token = jwt.encode(payload, environ['JWT_PRIVATE_KEY'], alg)
            if send_qr_to_email:
                buf = io.BytesIO()
                png = qrcode.QRCode(
                    version=1,
                    box_size=3,
                    border=1,
                )
                png.add_data(token)
                png.make()
                png.make_image().save(buf)
                png = base64.b64encode(buf.getvalue()).decode("utf-8")

                knock = Knock(environ['KNOCK_SECRET_KEY'])
                knock.notify(
                    key=environ['KNOCK_WORKFLOW_NEW_QR'],
                    recipients=[payload['sub']],
                    data={
                        "qrPNG": png,
                        "attachments": [
                            {"name": "QR Code.png",
                             "content_type": "image/png",
                             "content": png},
                            {"name": 'Your Personal Code.txt',
                             "content_type": "text/plain",
                             "content": base64.b64encode(token.encode()).decode("utf-8")}
                        ]
                    }
                )

            return True, token
        except Exception as e:
            return False, str(e)


def has_all_fields(d: dict[str, Any], fields: list[str]):
    for x in fields:
        if d[x] == None:
            return False
    return True


def e164_phone(phone: str):
    if phone.startswith('00'):
        return '+' + phone[2:]
    elif phone.startswith('0'):
        return '+44' + phone[1:]
    else:
        return phone
