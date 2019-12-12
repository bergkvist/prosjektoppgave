from scipy.spatial.transform import Rotation as R
import scipy.interpolate
import pandas as pd
import numpy as np

"""
The functions in this module are all pure functions, and completely decoupled from each other.
They do not modify their arguments, or have side-effects.
"""

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
        #      Ry(roty)              Rz(rotz)        unrotated vector
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
    position_vectors = 0.5 * (vector + vector.shift(1, fill_value=0.0)).cumsum()
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

def md_texture_map(well_path: pd.DataFrame, simulation_mds: np.array) -> pd.Series:
    # Interpolation to find out what the measure depth pixels should be...
    # Basically, this is connecting texture location to pipe segments
    assert set(['md']).issubset(well_path.columns)
    interpolation = scipy.interpolate.interp1d(
        simulation_mds, 
        np.linspace(0, 1, len(simulation_mds)),
        fill_value='extrapolate'
    )
    return pd.Series(
        interpolation(well_path.md),
        name='mdTextureMap'
    )

def geometry_types(geometrydef: pd.DataFrame, max_measure_depth: float):
    meters_per_inch = 0.0254
    radii = 0.5 * meters_per_inch * np.array([ 
        geometrydef.iloc[1][0], # Riser inner diameter in inches
        geometrydef.iloc[3][0], # Cased section inner diameter in inches
        geometrydef.iloc[5][0], # Liner diameter inner in inches
        geometrydef.iloc[0][0]  # Open hole diameter in inches
    ])
    mds = np.array([
        0,                                               # Measure depth: start of riser
        geometrydef.iloc[2][0],                          # Measure depth: end of riser
        geometrydef.iloc[4][0],                          # Measure depth: end of cased section
        geometrydef.iloc[4][0] + geometrydef.iloc[6][0], # Measure depth: end of liner
        max_measure_depth                                # Measure depth: end of open hole
    ])
    return list(filter(lambda x: x['length'] > 0, [
        { 'name': 'riser',         'radius': radii[0], 'md_start': mds[0], 'md_stop': mds[1], 'length': mds[1] - mds[0] },
        { 'name': 'cased section', 'radius': radii[1], 'md_start': mds[1], 'md_stop': mds[2], 'length': mds[2] - mds[1] },
        { 'name': 'liner',         'radius': radii[2], 'md_start': mds[2], 'md_stop': mds[3], 'length': mds[3] - mds[2] },
        { 'name': 'open hole',     'radius': radii[3], 'md_start': mds[3], 'md_stop': mds[4], 'length': mds[4] - mds[3] }
    ]))

# TODO: Consider moving out of this file
def path_segments(well_path: pd.DataFrame, geometry_types: list, simulation_mds: np.array):
    length_scaling = 1 / 100
    segment_length = length(well_path) * length_scaling
    segment_rotation = rotation(well_path)
    segment_vector = vector(segment_length, segment_rotation)
    segment_position = position(segment_vector)
    segment_radius = radius(well_path, geometry_types)
    segment_md_texture_map = md_texture_map(well_path, simulation_mds)
    return pd.concat([ well_path, segment_length, segment_rotation, segment_vector, segment_position, segment_radius, segment_md_texture_map ], axis=1)


# TODO: Refactor
def find_centre(path_segments: pd.DataFrame):
    position = path_segments[['posx', 'posy', 'posz']]
    vector = path_segments[['vecx', 'vecy', 'vecz']]
    v = vector.rename(columns={ 'vecx': 'posx', 'vecy': 'posy', 'vecz': 'posz' })
    p = pd.concat([position - v, position + v])
    return 0.5 * (p.max() + p.min())

def casing_shoe(path_segments: pd.DataFrame, geometry_type: dict):
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

def casing_shoes(path_segments: pd.DataFrame, geometry_types: list):
    return pd.DataFrame.from_records([
        casing_shoe(path_segments, geoemtry_type)
        for geoemtry_type in geometry_types
    ])

def get_time(simulation_data: pd.DataFrame):
    time_index = list(simulation_data.index)
    return {
        'min': time_index[0],
        'max': time_index[-1],
        'step': time_index[1] - time_index[0],
    }

def get_geometry_response(path_segments: pd.DataFrame, casing_shoes: pd.DataFrame, simulation_data: pd.DataFrame) -> dict:
    final_path_properties = ['posx', 'posy', 'posz', 'rotx', 'roty', 'rotz', 'length', 'radius', 'mdTextureMap']
    assert set(final_path_properties + ['vecx', 'vecy', 'vecz']).issubset(path_segments.columns)
    visible = path_segments[(path_segments.radius > 0.0) & (path_segments.length > 0.0)]

    centered_casing_shoes = casing_shoes.copy()
    centered_path_segments = visible.copy()
    centre = find_centre(visible)

    centered_path_segments.posx -= centre.posx
    centered_path_segments.posy -= centre.posy
    centered_path_segments.posz -= centre.posz

    centered_casing_shoes.posx -= centre.posx
    centered_casing_shoes.posy -= centre.posy
    centered_casing_shoes.posz -= centre.posz
    
    return {
        'time': get_time(simulation_data),
        'casingShoes': centered_casing_shoes.to_dict(orient='records'),
        'pathSegments': centered_path_segments[final_path_properties].to_dict(orient='records'),
    }


def get_image_data(well_path, simulation_data, pressure_per_meter):
    height = scipy.interpolate.interp1d(well_path.md, well_path.tvd)
    p = simulation_data.transpose()
    s = pd.Series(pressure_per_meter * height(p.index.astype(float)), p.index)
    return p.subtract(s, axis='rows')
