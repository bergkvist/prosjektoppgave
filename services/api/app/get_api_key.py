# Inspired by: https://gist.github.com/nilsdebruin/a78c5e200e7df014a92580b4fc51c53f
# Purpose: Restrict access to the API with an API key.
# To chose an API key, put a file called ".env" in this folder, and write "API_KEY=something" to make "something" the key/password.

from fastapi.security.api_key import APIKeyQuery, APIKeyCookie, APIKeyHeader
from fastapi import Security, HTTPException
from starlette.status import HTTP_403_FORBIDDEN
import os

API_KEY = os.environ['API_KEY']
if not API_KEY:
    print('API_KEY is not set! Exiting...')
    exit(1)
api_key_query = APIKeyQuery(name='api_key', auto_error=False)
api_key_header = APIKeyHeader(name='api_key', auto_error=False)
api_key_cookie = APIKeyCookie(name='api_key', auto_error=False)

async def get_api_key(
    api_key_query: str = Security(api_key_query),
    api_key_header: str = Security(api_key_header),
    api_key_cookie: str = Security(api_key_cookie),
):
    if api_key_query == API_KEY:
        return api_key_query
    elif api_key_header == API_KEY:
        return api_key_header
    elif api_key_cookie == API_KEY:
        return api_key_cookie
    else:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Could not validate credentials")