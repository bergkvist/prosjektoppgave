# Author: Tobias Bergkvist
# Purpose: Load/parse data/config files for a specific HeaveSIM simulation.

import pandas as pd
import numpy as np
from math import pi


class SimulationLoader:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir

    def path(self, file_name: str):
        return f'{self.data_dir}/{file_name}'

    def pipepressure(self):
        return pd.read_csv(self.path('pipepressure.csv'), index_col=0).rename(columns=float)

    def annuluspressure(self):
        return pd.read_csv(self.path('annuluspressure.csv'), index_col=0).rename(columns=float)

    def pipestress(self):
        return pd.read_csv(self.path('pipestress.csv'), index_col=0).rename(columns=float)

    def fluiddef(self):
        with open(self.path('fluiddef.txt')) as f:
            return parse_txt(f.readlines())

    def geometrydef(self):
        with open(self.path('geometrydef.txt')) as f:
            return parse_txt(f.readlines())

    def well_path(self):
        return pd.read_csv(self.path('well_path.csv'), sep=';').rename(columns={
            'Md': 'md',
            'Inc': 'inc',
            'Azi': 'azi',
            'Tvd': 'tvd',
            'TVD(m)': 'tvd'
        })[['md', 'inc', 'azi', 'tvd']]


def parse_txt(file_lines: list):
    data = pd.Series(file_lines).str.split('#', n=1, expand=True)
    data.columns = ['value', 'description']
    data.value = data.value.astype(float)
    data.description = data.description.str.strip()
    return data.set_index('description')