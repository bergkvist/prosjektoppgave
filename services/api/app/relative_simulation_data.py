# Author: Tobias Bergkvist
# Purpose: Remove the pressure component that depends on vertical height from the simulation data (leaving only relative pressure).

import pandas as pd
import scipy.interpolate


def relative_simulation_data(well_path: pd.DataFrame, simulation_data_transposed: pd.DataFrame, pressure_per_meter: float):
    assert set(['md', 'tvd']).issubset(well_path)
    vertical_depth = scipy.interpolate.interp1d(well_path.md, well_path.tvd)
    simulation_depths = vertical_depth(simulation_data_transposed.index.astype(float))
    due_to_gravity = pd.Series(pressure_per_meter * simulation_depths, simulation_data_transposed.index)
    relative_data = simulation_data_transposed.subtract(due_to_gravity, axis='rows')
    return relative_data
