from starlette.responses import FileResponse
from starlette.status import HTTP_403_FORBIDDEN
from fastapi.security.api_key import APIKeyQuery, APIKeyCookie, APIKeyHeader, APIKey
from fastapi import Security, Depends, FastAPI, HTTPException
from fastapi import FastAPI
import tempfile
import os

from scipy import interpolate
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from app.parsers import *
from app.utils import *

API_KEY = "fs0c13ty"
API_KEY_NAME = "api_key"
COOKIE_DOMAIN = "localhost"

api_key_query = APIKeyQuery(name=API_KEY_NAME, auto_error=False)
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)
api_key_cookie = APIKeyCookie(name=API_KEY_NAME, auto_error=False)
app = FastAPI()

simulation_dir = './data/HeaveSim simulations'

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


@app.get('/api')
def get(api_key: APIKey = Depends(get_api_key)):
    """Can be used to check the availability of the API."""
    return "Hello from the specialization project API of Tobias Bergkvist"

@app.get('/api/simulations')
def get_wells_and_connections(api_key: APIKey = Depends(get_api_key)):
    """This is documentation?
    
    Example
    """
    wells = sorted(os.listdir(simulation_dir))
    dirs = { 
        well: sorted(os.listdir(f'{simulation_dir}/{well}'))
        for well in wells 
    }
    return dirs

@app.get('/api/simulations/{well}')
def get_connections(well: str, api_key: APIKey = Depends(get_api_key)):
    """Get available connections for a specific well as a list
    """
    return sorted(os.listdir(f'{simulation_dir}/{well}'))


@app.get('/api/simulations/{well}/{connection}')
def get_simulation(well: str, connection: str, api_key: APIKey = Depends(get_api_key)):
    pipestuff = get_pipe_stuff(f'{simulation_dir}/{well}/{connection}')
    pipestuff['pipeSegments'] = pipestuff['pipeSegments']\
        .drop(['vx', 'vy', 'vz', 'md', 'tvd'], axis='columns')\
        .to_dict(orient='records')
    return pipestuff

@app.get('/api/simulations/{well}/{connection}/pipepressure.png')
def get_image(well: str, connection: str, cmap: str = 'inferno', vmin: float = -4, vmax: float = 4, api_key: APIKey = Depends(get_api_key)):
    data = get_image_data(f'{simulation_dir}/{well}/{connection}')

    with tempfile.NamedTemporaryFile(mode='w+b', suffix='.png', delete=False) as image:
        plt.imsave(image.name, data, cmap=cmap, vmin=vmin, vmax=vmax)
        return FileResponse(image.name, media_type='image/png', headers={ 'Cache-Control': 'max-age=120' })


# Well_1 -> vmin=700, vmax=950
# Well_2 -> vmin=160, vmax=170
#@app.get('/api/simulations/{well}/{connection}/pipestress.png')
#def get_image(well: str, connection: str, cmap: str = 'inferno', vmin: float = 700, vmax: float = 950):
#    pipestress = parse_pipestress(f'{simulation_dir}/{well}/{connection}')
#    data = pipestress.transpose()
#    with tempfile.NamedTemporaryFile(mode='w+b', suffix='.png', delete=False) as image:
#        plt.imsave(image.name, data, cmap=cmap, vmin=vmin, vmax=vmax)
#        return FileResponse(image.name, media_type='image/png', headers={ 'Cache-Control': 'max-age=120' })