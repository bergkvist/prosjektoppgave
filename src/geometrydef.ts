const data = [
    8.5,	//0 Well diameter in inches (open section)

    19.5,	//1 Inner riser diameter in inches
    373.2,	//2 Length of riser in meters 

    9.625,	//3 Inner casing diameter in inches
    1930,	//4 Length of cased section in m (approximate, casing shoe set on nearest cell interface)

    8.88,	//5 Liner Inner Diameter
    0.00,	//6 Liner length

    4597,	//7 Pipe length in meters (total length is pipe length+bha length+heavy weight drill pipe length)

    100,	//8 Heavy weight drill pipe length in meters
    42,	    //9 BHA length in meters
    
    5192,	//10 Total well length in meters
    
    4.276,	//11 Inner pipe diameter in inches
    5.0,	//12 Outer pipe diameter in inches

    3.0,	//13 Inner heavy weight drill pipe diameter in inches
    6.5,	//14 Outer heavy weight drill pipe diameter in inches
    
    2.25,	//15 Inner bha diameter in inches
    6.75,	//16 Outer bha diameter in inches
    
    7800,	//17 Density of pipe material in kg/m^3
    2.068e6,//18 Young’s modulus for pipe material in bar (<0.0: Non-elastic drill string)
    0.3,	//19 Poisson's ratio of pipe material
    0.29,	//20 Static friction factor for drag force on pipe from well wall
    0.28,	//21 Dynamic friction factor for drag force on pipe from well wall
    19992,	//22 Weight of BHA and heavy pipe in kg
    6,	    //23 Number of segments in riser section (riser segments must be longer than heavy weight drill pipe segments)
    9,	    //24 Number of segments in heavy weight pipe
    4,	    //25 Number of segments in bha
    0       //26 Index at location of HeaveLock within bha (No HeaveLock=0
]

export interface GeometrySegment { name: string, diameter: number, length: number, md: number }
export type GeometryDef = Array<GeometrySegment>

export default [
    { name: 'riser',         diameter: data[1],  length: data[2],                      md: data[2]           },
    { name: 'cased section', diameter: data[3],  length: data[4] - data[2],            md: data[4]           },
    { name: 'liner',         diameter: data[5],  length: data[6],                      md: data[4] + data[6] },
    { name: 'open hole',     diameter: data[0],  length: data[10] - data[4] - data[6], md: data[10]          }
].map(d => ({
    ...d,
    diameter: d.diameter * 0.0254  // convert to meters
}))