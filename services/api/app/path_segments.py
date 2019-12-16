# Author: Tobias Bergkvist
# Purpose: Generate the cylinders/path segments so that they are ready for the client to draw them
# Path segment properties: posx, posy, posz, rotx, roty, rotz, radius, length, imageRow (and vecx, vecy, vecz), 

from scipy.spatial.transform import Rotation as R
import scipy.interpolate
import pandas as pd
import numpy as np


def path_segments(well_path: pd.DataFrame, geometry_types: list, simulation_mds: np.array, radius_scaling: float):
    segment_length = length(well_path)
    segment_rotation = rotation(well_path)
    segment_vector = vector(segment_length, segment_rotation)
    segment_position = position(segment_vector)
    segment_radius = radius(well_path, geometry_types) * radius_scaling
    segment_image_row = image_row(well_path, simulation_mds)
    return pd.concat([ well_path, segment_length, segment_rotation, segment_vector, segment_position, segment_radius, segment_image_row ], axis=1)


def length(well_path: pd.DataFrame) -> pd.Series:
    assert set(['md']).issubset(well_path.columns)
    return pd.Series(
        well_path.md - well_path.md.shift(1, fill_value=0.0),
        name='length'
    )

def rotation(well_path: pd.DataFrame) -> pd.DataFrame:
    assert set(['azi', 'inc']).issubset(well_path.columns)
    return pd.DataFrame({
        # rotx here is never actually used, but is included for completeness 
        'rotx': 0.0,
        'roty': np.radians(well_path.azi), 
        'rotz': np.radians(well_path.inc),
    })

def vector(length: pd.Series, rotation: pd.DataFrame) -> pd.DataFrame:
    assert len(length) == len(rotation)
    assert set(['roty', 'rotz']).issubset(rotation.columns)
    return pd.DataFrame({
        #      Ry(roty)              Rz(rotz)        vector before rotation
        # [  cos   0   sin ]   [ cos  -sin    0  ]   [    0    ]
        # [   0    1    0  ] . [ sin   cos    0  ] . [ -length ] 
        # [ -sin   0   cos ]   [  0     0     1  ]   [    0    ]

        # The matrices above have been pre-multiplied out on paper to yield the expressions below:
        'vecx': length * np.cos(rotation.roty) * np.sin(rotation.rotz),
        'vecy': - length * np.cos(rotation.rotz),
        'vecz': - length * np.sin(rotation.roty) * np.sin(rotation.rotz)
    })

def position(vector: pd.DataFrame) -> pd.DataFrame:
    assert set(['vecx', 'vecy', 'vecz']).issubset(vector.columns)
    position_vectors = vector.cumsum() - 0.5 * vector
    return pd.DataFrame({
        'posx': position_vectors.vecx,
        'posy': position_vectors.vecy,
        'posz': position_vectors.vecz
    })

def radius(well_path: pd.DataFrame, geometry_types: list) -> pd.Series:
    assert set(['md']).issubset(well_path.columns)
    radius = sum([
        geometry_type['radius'] * ((well_path.md > geometry_type['md_start']) & (well_path.md <= geometry_type['md_stop']))
        for geometry_type in geometry_types
    ])
    return pd.Series(radius, name='radius')

def image_row(well_path: pd.DataFrame, simulation_mds: np.array) -> pd.Series:
    # Interpolation to find out what the measure depth pixels should be...
    # Basically, this is connecting an image/texture row to each of the pipe segments
    assert set(['md']).issubset(well_path.columns)
    interpolation = scipy.interpolate.interp1d(
        simulation_mds, 
        np.linspace(0, 1, len(simulation_mds)),
        fill_value='extrapolate'
    )
    return pd.Series(
        interpolation(well_path.md),
        name='imageRow'
    )

