from starlette.responses import FileResponse
from fastapi import FastAPI
import tempfile
import os

from scipy import interpolate
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from app.parsers import *
from app.utils import *

app = FastAPI()

simulation_dir = './data/HeaveSim simulations'

@app.get('/api')
def get():
    """Can be used to check the availability of the API."""
    return "Hello from the specialization project API of Tobias Bergkvist"

@app.get('/api/simulations')
def get_wells_and_connections():
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
def get_connections(well: str):
    """Get available connections for a specific well as a list
    """
    return sorted(os.listdir(f'{simulation_dir}/{well}'))


@app.get('/api/simulations/{well}/{connection}')
def get_simulation(well: str, connection: str):
    pipestuff = get_pipe_stuff(f'{simulation_dir}/{well}/{connection}')
    pipestuff['pipeSegments'] = pipestuff['pipeSegments']\
        .drop(['vx', 'vy', 'vz', 'md', 'tvd'], axis='columns')\
        .to_dict(orient='records')
    return pipestuff

@app.get('/api/simulations/{well}/{connection}/pipepressure.png')
def get_image(well: str, connection: str, cmap: str = 'inferno', vmin: float = -4, vmax: float = 4):
    data = get_image_data(f'{simulation_dir}/{well}/{connection}')

    with tempfile.NamedTemporaryFile(mode='w+b', suffix='.png', delete=False) as image:
        plt.imsave(image.name, data, cmap=cmap, vmin=vmin, vmax=vmax)
        return FileResponse(image.name, media_type='image/png', headers={ 'Cache-Control': 'max-age=120' })


# Well_1 -> vmin=700, vmax=950
# Well_2 -> vmin=160, vmax=170
@app.get('/api/simulations/{well}/{connection}/pipestress.png')
def get_image(well: str, connection: str, cmap: str = 'inferno', vmin: float = 700, vmax: float = 950):
    pipestress = parse_pipestress(f'{simulation_dir}/{well}/{connection}')
    data = pipestress.transpose()
    with tempfile.NamedTemporaryFile(mode='w+b', suffix='.png', delete=False) as image:
        plt.imsave(image.name, data, cmap=cmap, vmin=vmin, vmax=vmax)
        return FileResponse(image.name, media_type='image/png', headers={ 'Cache-Control': 'max-age=120' })