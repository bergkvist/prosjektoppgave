import pandas as pd
import numpy as np
from math import pi

meters_per_inch = 0.0254

def _to_float_or_none(n: str):
    try:
        return float(n.strip())
    except:
        return None



def parse_pipepressure(path: str):
    return pd.read_csv(f'{path}/pipepressure.csv', index_col=0).rename(columns=_to_float_or_none)


def parse_pipestress(path: str):
    return pd.read_csv(f'{path}/pipepressure.csv', index_col=0).rename(columns=_to_float_or_none)


def parse_well_path(path: str):
    return pd.read_csv(f'{path}/well_path.csv', sep=';')\
        .rename(columns={ 'Md': 'md', 'Inc': 'rotz', 'Azi': 'roty', 'Tvd': 'tvd', 'TVD(m)': 'tvd' })\
        [['md', 'roty', 'rotz', 'tvd']]


def parse_mud_density(path: str):
    with open(f'{path}/fluiddef.txt') as fp:
        first_line = fp.readline()
        return float(first_line.split('#')[0].strip())


def parse_geometrydef(path: str):
    with open(f'{path}/geometrydef.txt') as fp:
        all_lines = fp.readlines()
        data = map(lambda line: line.split('#'), all_lines)    # Split up numbers and descriptions
        data = [item for sublist in data for item in sublist]  # Flatten the results
        data = map(_to_float_or_none, data)
        data = filter(lambda number: number is not None, data)
        data = list(data)

        radii = list(map(
            lambda inches: 0.5 * meters_per_inch * inches, 
            [ data[1], data[3], data[5], data[0] ]
        ))
        mds = [ 0, data[2], data[4], data[4] + data[6], data[10] ]

        return list(filter(lambda x: x['length'] > 0, [
            { 'name': 'riser',         'radius': radii[0], 'md_start': mds[0], 'md_stop': mds[1], 'length': mds[1] - mds[0] },
            { 'name': 'cased section', 'radius': radii[1], 'md_start': mds[1], 'md_stop': mds[2], 'length': mds[2] - mds[1] },
            { 'name': 'liner',         'radius': radii[2], 'md_start': mds[2], 'md_stop': mds[3], 'length': mds[3] - mds[2] },
            { 'name': 'open hole',     'radius': radii[3], 'md_start': mds[3], 'md_stop': mds[4], 'length': mds[4] - mds[3] }
        ]))


