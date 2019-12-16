# Author: Tobias Bergkvist
# Purpose: Create a well geometry consisting of pathSegments and casingShoes (along with the centre and time domain)

from scipy.spatial.transform import Rotation as R
import pandas as pd
import numpy as np


def well_geometry(path_segments: pd.DataFrame, geometry_types: list, simulation_data: pd.DataFrame) -> dict:
    final_path_properties = ['posx', 'posy', 'posz', 'rotx', 'roty', 'rotz', 'length', 'radius', 'imageRow']
    assert set(final_path_properties + ['vecx', 'vecy', 'vecz']).issubset(path_segments.columns)
    visible_path_segments = path_segments[(path_segments.radius > 0.0) & (path_segments.length > 0.0)]
    return {
        # This "time" part is a bit out of place as part of the well geometry. 
        # It would probably make more sense to have this included with the image data somehow
        'time': time_domain(simulation_data),
        'centre': find_centre(visible_path_segments),
        'casingShoes': casing_shoes(path_segments, geometry_types),
        'pathSegments': visible_path_segments[final_path_properties].to_dict(orient='records'),
    }


def time_domain(simulation_data: pd.DataFrame):
    time_index = list(simulation_data.index)
    return {
        'min': time_index[0],
        'max': time_index[-1],
        'step': time_index[1] - time_index[0],
    }

def find_centre(path_segments: pd.DataFrame):
    position = path_segments[['posx', 'posy', 'posz']]
    vector = path_segments[['vecx', 'vecy', 'vecz']]
    v = vector.rename(columns={ 'vecx': 'posx', 'vecy': 'posy', 'vecz': 'posz' })
    cylinder_ends = pd.concat([position - v, position + v])
    centre = 0.5 * (cylinder_ends.max() + cylinder_ends.min())
    return {
        'posx': centre.posx, 
        'posy': centre.posy,
        'posz': centre.posz
    }

def casing_shoes(path_segments: pd.DataFrame, geometry_types: list) -> list:
    def casing_shoe(geometry_type: dict):
        last_segment = path_segments[path_segments.md <= geometry_type['md_stop']].iloc[-1]
        rotz, roty, rotx = (R.from_euler('xzy', np.array([ np.pi/2, last_segment.rotz, last_segment.roty ]))).as_euler('zyx')
        return {
            'label': f"end of {geometry_type['name']}",
            'posx': last_segment.posx + last_segment.vecx / 2,
            'posy': last_segment.posy + last_segment.vecy / 2,
            'posz': last_segment.posz + last_segment.vecz / 2,
            'rotx': rotx,
            'roty': roty,
            'rotz': rotz,
            'radius': last_segment.radius
        }
    return [ casing_shoe(geoemtry_type) for geoemtry_type in geometry_types ]
