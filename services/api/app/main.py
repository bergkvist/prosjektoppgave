# Author: Tobias Bergkvist
# Purpose: Connect modules together, and serve API routes

from starlette.responses import FileResponse
from fastapi.security.api_key import APIKey
from fastapi import Depends, FastAPI
import tempfile
import os
import matplotlib.pyplot as plt
import numpy as np

import app.turbo_colormap_data
from app.get_api_key import get_api_key
from app.SimulationLoader import SimulationLoader
from app.relative_simulation_data import relative_simulation_data
from app.path_segments  import path_segments  as create_path_segments
from app.geometry_types import geometry_types as create_geometry_types
from app.well_geometry  import well_geometry  as create_well_geometry

app = FastAPI()
simulation_dir = './data/HeaveSim simulations'


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
def get_well_geometry(well: str, connection: str, radius_scaling: float = 100, api_key: APIKey = Depends(get_api_key)):
    sl = SimulationLoader(f'{simulation_dir}/{well}/{connection}')
    simulation_data = sl.pipepressure()
    geometry_types = create_geometry_types(sl.geometrydef())
    path_segments = create_path_segments(sl.well_path(), geometry_types, np.array(simulation_data.columns), radius_scaling)
    return create_well_geometry(path_segments, geometry_types, simulation_data)

@app.get('/api/simulations/{well}/{connection}/pipepressure.png')
def get_pipepressure_image(well: str, connection: str, cmap: str = 'inferno', vmin: float = None, vmax: float = None, api_key: APIKey = Depends(get_api_key)):
    sl = SimulationLoader(f'{simulation_dir}/{well}/{connection}')
    pressure_per_meter = sl.fluiddef().iloc[0][0] * 9.81 * 1e-5
    data = relative_simulation_data(sl.well_path(), sl.pipepressure().transpose(), pressure_per_meter)

    with tempfile.NamedTemporaryFile(mode='w+b', suffix='.png', delete=False) as image:
        plt.imsave(image.name, data, cmap=cmap, vmin=vmin, vmax=vmax)
        return FileResponse(image.name, media_type='image/png', headers={ 'Cache-Control': 'max-age=120' })

@app.get('/api/simulations/{well}/{connection}/annuluspressure.png')
def get_annuluspressure_image(well: str, connection: str, cmap: str = 'inferno', vmin: float = None, vmax: float = None, api_key: APIKey = Depends(get_api_key)):
    sl = SimulationLoader(f'{simulation_dir}/{well}/{connection}')
    pressure_per_meter = sl.fluiddef().iloc[0][0] * 9.81 * 1e-5
    data = relative_simulation_data(sl.well_path(), sl.annuluspressure().transpose(), pressure_per_meter)

    with tempfile.NamedTemporaryFile(mode='w+b', suffix='.png', delete=False) as image:
        plt.imsave(image.name, data, cmap=cmap, vmin=vmin, vmax=vmax)
        return FileResponse(image.name, media_type='image/png', headers={ 'Cache-Control': 'max-age=120' })

@app.get('/api/simulations/{well}/{connection}/pipestress.png')
def get_pipestress_image(well: str, connection: str, cmap: str = 'inferno', vmin: float = None, vmax: float = None, api_key: APIKey = Depends(get_api_key)):
    sl = SimulationLoader(f'{simulation_dir}/{well}/{connection}')
    data = relative_simulation_data(sl.well_path(), sl.pipestress().transpose(), -0.75)

    with tempfile.NamedTemporaryFile(mode='w+b', suffix='.png', delete=False) as image:
        plt.imsave(image.name, data, cmap=cmap, vmin=vmin, vmax=vmax)
        return FileResponse(image.name, media_type='image/png', headers={ 'Cache-Control': 'max-age=120' })