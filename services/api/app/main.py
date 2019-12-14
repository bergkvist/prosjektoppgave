from starlette.responses import FileResponse
from starlette.status import HTTP_403_FORBIDDEN
from fastapi.security.api_key import APIKeyQuery, APIKeyCookie, APIKeyHeader, APIKey
from fastapi import Security, Depends, FastAPI, HTTPException
from fastapi import FastAPI
import tempfile
import os

import matplotlib.pyplot as plt
import numpy as np
from dotenv import load_dotenv
from app.SimulationLoader import SimulationLoader
import app.path_segment as path_segment

load_dotenv(verbose=True)

API_KEY = os.environ['API_KEY']
api_key_query = APIKeyQuery(name='api_key', auto_error=False)
api_key_header = APIKeyHeader(name='api_key', auto_error=False)
api_key_cookie = APIKeyCookie(name='api_key', auto_error=False)
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
def get():
    return "Hello from the specialization project API of Tobias Bergkvist."

@app.get('/api/simulations')
def get_wells_and_connections(api_key: APIKey = Depends(get_api_key)):
    wells = sorted(os.listdir(simulation_dir))
    dirs = { 
        well: sorted(os.listdir(f'{simulation_dir}/{well}'))
        for well in wells 
    }
    return dirs

@app.get('/api/simulations/{well}')
def get_connections(well: str, api_key: APIKey = Depends(get_api_key)):
    return sorted(os.listdir(f'{simulation_dir}/{well}'))

@app.get('/api/simulations/{well}/{connection}')
def get_simulation(well: str, connection: str, radius_scaling: float = 100, api_key: APIKey = Depends(get_api_key)):
    sl = SimulationLoader(simulation_dir, well, connection)
    simulation_data = sl.pipepressure()
    geometry_types = path_segment.geometry_types(sl.geometrydef())
    path_segments = path_segment.path_segments(sl.well_path(), geometry_types, np.array(simulation_data.columns), radius_scaling)
    casing_shoes = path_segment.casing_shoes(path_segments, geometry_types)
    return path_segment.get_geometry_response(path_segments, casing_shoes, simulation_data)

@app.get('/api/simulations/{well}/{connection}/pipepressure.png')
def get_image(well: str, connection: str, cmap: str = 'inferno', vmin: float = None, vmax: float = None, api_key: APIKey = Depends(get_api_key)):
    sl = SimulationLoader(simulation_dir, well, connection)
    pressure_per_meter = sl.fluiddef().iloc[0][0] * 9.81 * 1e-5
    data = path_segment.get_image_data(sl.well_path(), sl.pipepressure(), pressure_per_meter)

    with tempfile.NamedTemporaryFile(mode='w+b', suffix='.png', delete=False) as image:
        plt.imsave(image.name, data, cmap=cmap, vmin=vmin, vmax=vmax)
        return FileResponse(image.name, media_type='image/png', headers={ 'Cache-Control': 'max-age=120' })

@app.get('/api/simulations/{well}/{connection}/annuluspressure.png')
def get_image(well: str, connection: str, cmap: str = 'inferno', vmin: float = None, vmax: float = None, api_key: APIKey = Depends(get_api_key)):
    sl = SimulationLoader(simulation_dir, well, connection)
    pressure_per_meter = sl.fluiddef().iloc[0][0] * 9.81 * 1e-5
    data = path_segment.get_image_data(sl.well_path(), sl.annuluspressure(), pressure_per_meter)

    with tempfile.NamedTemporaryFile(mode='w+b', suffix='.png', delete=False) as image:
        plt.imsave(image.name, data, cmap=cmap, vmin=vmin, vmax=vmax)
        return FileResponse(image.name, media_type='image/png', headers={ 'Cache-Control': 'max-age=120' })

@app.get('/api/simulations/{well}/{connection}/pipestress.png')
def get_image(well: str, connection: str, cmap: str = 'inferno', vmin: float = None, vmax: float = None, api_key: APIKey = Depends(get_api_key)):
    sl = SimulationLoader(simulation_dir, well, connection)
    data = path_segment.get_image_data(sl.well_path(), sl.pipestress(), -0.75)

    with tempfile.NamedTemporaryFile(mode='w+b', suffix='.png', delete=False) as image:
        plt.imsave(image.name, data, cmap=cmap, vmin=vmin, vmax=vmax)
        return FileResponse(image.name, media_type='image/png', headers={ 'Cache-Control': 'max-age=120' })