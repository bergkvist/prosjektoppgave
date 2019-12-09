from app.parsers import parse_well_path, parse_geometrydef, parse_pipepressure, parse_mud_density
from scipy.spatial.transform import Rotation as R
from scipy import interpolate
from math import pi
import numpy as np
import pandas as pd

def get_pipe_stuff(path: str):
    well_path = parse_well_path(path)
    geometrydef = parse_geometrydef(path)
    pipepressure = parse_pipepressure(path)

    well_path['length'] = well_path.md.diff()
    well_path = well_path.iloc[1:]
    well_path['rotx'] = 0.0 # Included for completeness
    well_path.roty = (pi / 180) * well_path.roty
    well_path.rotz = (pi / 180) * well_path.rotz

    # Euler angles YZ (formulas are from manually multiplying out the rotation matrices Ry*Rz)
    # We assume that the "base/default direction" is [0, -1, 0].
    vx = well_path.length * np.cos(well_path.roty) * np.sin(well_path.rotz)
    vy = -1 * well_path.length * np.cos(well_path.rotz)
    vz = -1 * well_path.length * np.sin(well_path.roty) * np.sin(well_path.rotz)

    # These are the vectors pointing to the central points of each pipe segment (the way THREE.js wants them)
    well_path['posx'] = 0.5 * (vx + vx.shift(1, fill_value=0.0)).cumsum()
    well_path['posy'] = 0.5 * (vy + vy.shift(1, fill_value=0.0)).cumsum()
    well_path['posz'] = 0.5 * (vz + vz.shift(1, fill_value=0.0)).cumsum()
    well_path['vx'] = vx
    well_path['vy'] = vy
    well_path['vz'] = vz


    casing_shoes = []
    well_path['radius'] = 0.0
    for x in geometrydef:
        well_path.loc[(well_path.md > x['md_start']) & (well_path.md <= x['md_stop']), 'radius'] = x['radius']
        last_segment = well_path[well_path.md <= x['md_stop']].iloc[-1]
        # Trial and error... (combining 3d-rotations in different orders is confusing)
        rotz, roty, rotx = (R.from_euler('xzy', np.array([ pi/2, last_segment.rotz, last_segment.roty ]))).as_euler('zyx')
        casing_shoes.append({
            'label': f"end of {x['name']}",
            'posx': last_segment.posx + last_segment.vx / 2, 
            'posy': last_segment.posy + last_segment.vy / 2,
            'posz': last_segment.posz + last_segment.vz / 2,
            'rotx': rotx,
            'roty': roty,
            'rotz': rotz,
            'radius': last_segment.radius
        })

    # No need to send stuff we can't render!
    well_path = well_path[well_path.radius > 0.0]

    # Interpolation to find out what the measure depth pixels should be...
    well_path['imageHeightPortion'] = interpolate.interp1d(
        np.array(pipepressure.columns), 
        np.linspace(0, 1, len(pipepressure.columns)), 
        fill_value='extrapolate'
    )(well_path.md)

    return {
        # TODO: Fix
        'time': { 
            'min': list(pipepressure.index)[0], 
            'max': list(pipepressure.index)[-1], 
            'step': list(pipepressure.index)[1] - list(pipepressure.index)[0] 
        },
        'casingShoes': casing_shoes,
        'pipeSegments': well_path,
    }

def get_image_data(path: str):
    well_path = parse_well_path(path)
    pipepressure = parse_pipepressure(path)
    height = interpolate.interp1d(np.array(well_path.md), np.array(well_path.tvd))
    mud_density = parse_mud_density(path)
    g = 9.81
    bar = 1e-5
    rho_g_bar = mud_density * g * bar
    
    print(rho_g_bar)
    p = pipepressure.transpose()
    s = pd.Series(rho_g_bar * height(np.array(p.index.map(float))), p.index)
    n = p.subtract(s, axis='rows')
    return n
