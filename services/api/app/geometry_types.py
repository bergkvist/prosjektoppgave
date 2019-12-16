# Author: Tobias Bergkvist
# Purpose: Create a list of all the different sections/geometry types of the well path, when they start and when they stop.
# Different "geometry types" generally have different radiuses.

import numpy as np
import pandas as pd


def geometry_types(geometrydef: pd.DataFrame):
    meters_per_inch = 0.0254
    radii = 0.5 * meters_per_inch * np.array([ 
        geometrydef.iloc[1][0], # Riser inner diameter in inches
        geometrydef.iloc[3][0], # Cased section inner diameter in inches
        geometrydef.iloc[5][0], # Liner diameter inner in inches
        geometrydef.iloc[0][0]  # Open hole diameter in inches
    ])
    mds = np.array([
        0,                                                                       # start of riser
        geometrydef.iloc[2][0],                                                  # end of riser
        geometrydef.iloc[4][0],                                                  # end of cased section
        geometrydef.iloc[4][0] + geometrydef.iloc[6][0],                         # end of liner
        geometrydef.iloc[7][0] + geometrydef.iloc[8][0] + geometrydef.iloc[9][0] # end of open hole
    ])
    # For something to be considered a valid geoemtry type, md_stop must come after md_start.
    # Any invalid geometry type (which includes one of length 0) is removed from the list.
    return list(filter(lambda x: x['md_stop'] > x['md_start'], [
        { 'name': 'riser',         'radius': radii[0], 'md_start': mds[0], 'md_stop': mds[1] },
        { 'name': 'cased section', 'radius': radii[1], 'md_start': mds[1], 'md_stop': mds[2] },
        { 'name': 'liner',         'radius': radii[2], 'md_start': mds[2], 'md_stop': mds[3] },
        { 'name': 'open hole',     'radius': radii[3], 'md_start': mds[3], 'md_stop': mds[4] }
    ]))