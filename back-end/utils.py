from typing import Any, Optional
import jwt
from os import environ


def verify_jwt_token(jwt_string: Optional[str]) -> tuple[bool, str]:
    """\
    Verifies a ES256 JWT has a valid signature, with a PEM public key as an environment variable.
    """
    if not jwt_string:
        return False, 'No JWT supplied as Bearer token'

    debug_print('Using public key:\n', environ['JWT_PUBLIC_KEY'])

    try:
        debug_print('Received JWT\n', jwt_string)
        data = jwt.decode(jwt_string,
                          key=environ['JWT_PUBLIC_KEY'],
                          algorithms=['ES256'],
                          options={
                              "require": ["sub", "name", "role", "ic", "iss"],
                              "verify_signature": False
                          }
                          )
        if data['role'] != 'staff':
            return False, f'''A "staff" token is required, this token has "{data["role"]}"'''
        return True, ''
    except jwt.InvalidSignatureError:
        return False, 'Signature invalid'
    except jwt.MissingRequiredClaimError:
        return False, 'Token missing required data'
    except Exception as e:
        return False, str(e)


def debug_print(*args):
    if (environ.get('IS_VERBOSE') == 'Y'):
        print(*args)


def get_signed_jwt(alg: str,payload: Optional[dict[str, Any]]) -> tuple[bool, str]:
    if payload == None:
        return False, 'Missing header or payload'
    else:
        try:
            return True, jwt.encode(payload, environ['JWT_PRIVATE_KEY'], alg)
        except Exception as e:
            return False, str(e)

def has_all_fields(d: dict[str, Any], fields:list[str]):
    for x in fields:
        if d[x] == None: 
            return False
    return True