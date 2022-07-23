from math import atan2, cos, sin, pi, asin

J2000 = 2451545

def besselian_to_jd(b):
    # https://www.wikiwand.com/en/Equinox_(celestial_coordinates)
    return (b - 1900) * 365.242198781 + 2415020.31352

def precess_to_2000(ra, dec, start_year = 1875):

    alpha = ra / 12 * pi
    delta = dec / 180 * pi

    # # Note, assume after 1582
    # yp = start_year - 1
    # mp = 13
    # d  = 1

    # A = truncate(yp / 1000)
    # B = 2 - A + truncate(A / 4)
    # C = truncate(365.25 * yp)
    # D = truncate(30.6001 * (mp + 1))

    # julian_date_start = B + C + D + d + 1720994.5
    # print(julian_date_start)

    julian_date_start = besselian_to_jd(start_year)

    T = (julian_date_start - J2000) / 365.25 / 100 # number of Julian centuries
    zeta_deg  = 0.640_616_1 * T + 0.000_083_9 * T ** 2 + 0.000_005_0 * T ** 3
    z_deg     = 0.640_616_1 * T + 0.000_304_1 * T ** 2 + 0.000_005_1 * T ** 3
    theta_deg = 0.556_753_0 * T - 0.000_118_5 * T ** 2 - 0.000_011_6 * T ** 3

    zeta  = zeta_deg  / 180 * pi
    z     = z_deg     / 180 * pi
    theta = theta_deg / 180 * pi

    CX = cos(zeta)
    SX = sin(zeta)
    CZ = cos(z)
    SZ = sin(z)
    CT = cos(theta)
    ST = sin(theta)

    Pt = [
        [  CX * CT * CZ - SX * SZ,   CX * CT * SZ + SX * CZ,   CX * ST],
        [- SX * CT * CZ - CX * SZ, - SX * CT * SZ + CX * CZ, - SX * ST],
        [- ST * CZ,                - ST * SZ,                  CT     ]
    ]

    v = [
        cos(alpha) * cos(delta),
        sin(alpha) * cos(delta),
        sin(delta)
    ]

    s = [
        Pt[0][0] * v[0] + Pt[0][1] * v[1] + Pt[0][2] * v[2], 
        Pt[1][0] * v[0] + Pt[1][1] * v[1] + Pt[1][2] * v[2], 
        Pt[2][0] * v[0] + Pt[2][1] * v[1] + Pt[2][2] * v[2], 
    ]
    
    alpha_new = atan2(s[1], s[0])
    delta_new = asin(s[2])

    return (alpha_new / pi * 12) % 24, delta_new / pi * 180

if __name__ == "__main__":
    res = precess_to_2000(1, 10)
    print(res)
