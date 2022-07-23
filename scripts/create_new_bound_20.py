from math import ceil, cos, pi, sqrt
import re
from statistics import mean
from typing import List, Set
import numpy as np
import matplotlib.cm as cm
import matplotlib.pyplot as plt
from precession import precess_to_2000
from analyze_bound_20 import ConstellationBoundaryPoint

CONST_REGEX = r"([ \d]\d\.\d{5}) ([\+-]\d{2}\.\d{5}) (\w+)(?: {1,2}(\w+))?"
RA_LENGTH_SCALE = 360 / 24

class ConstellationBoundaryLine:
    def __init__(self, p1: ConstellationBoundaryPoint,
            p2: ConstellationBoundaryPoint):
        self.p1 = p1
        self.p2 = p2

    def __eq__(self, o):
        return isinstance(o, ConstellationBoundaryLine) and (
            (self.p1 == o.p1 and self.p2 == o.p2)
            or (self.p1 == o.p2 and self.p2 == o.p1)
        )

    def __hash__(self):
        return min(hash(self.p1), hash(self.p2))

    def __repr__(self):
        return f"ConstellationBoundaryLine({repr(self.p1)}, {repr(self.p2)})"

    def get_ra_delta(self):

        negative = ((self.p2.ra < self.p1.ra and self.p1.ra - self.p2.ra < 12) 
            or (self.p2.ra > self.p1.ra and self.p2.ra - self.p1.ra > 12))

        ra_length = abs(self.p1.ra - self.p2.ra)
        if (ra_length) > 12: ra_length = 24 - ra_length
        return (-1 if negative else 1) * ra_length

    def get_length(self):
        avg_dec = mean([self.p1.dec, self.p2.dec]) / 180 * pi
        # Don't draw too many points near the poles - scale ra_length slightly
        ra_length = abs(self.get_ra_delta()) * (cos(avg_dec) / 2 + 0.5)
        return sqrt((ra_length * RA_LENGTH_SCALE) ** 2
            + (self.p1.dec - self.p2.dec) ** 2)


const_re = re.compile(CONST_REGEX)

points_text = open("data/constbnd.dat.txt", "r").read().splitlines()

points = []
points_dict = {}

repeat_counter = 0
new_counter = 0

for line in points_text:
    data = const_re.search(line).groups()
    points.append(ConstellationBoundaryPoint(*data))

line_segments: Set[ConstellationBoundaryLine] = set()

for i in range(len(points) - 1):
    point1: ConstellationBoundaryPoint = points[i] 
    point2: ConstellationBoundaryPoint = points[i + 1]
    if not point2.const2: continue
    segment = ConstellationBoundaryLine(point1, point2)
    if segment in line_segments:
        repeat_counter += 1
    else:
        line_segments.add(segment)
        new_counter += 1

print(f"{repeat_counter} repeats")
print(f"{new_counter} new")

################################################################################

POINTS_PER_UNIT_LENGTH = 1

int_count = 0

new_line_segments: List[List[ConstellationBoundaryPoint]] = []
out_lines: List[str] = []

for line in line_segments:
    point_count = ceil(line.get_length() * POINTS_PER_UNIT_LENGTH)
    deltaRa = line.get_ra_delta() / point_count
    deltaDec = (line.p2.dec - line.p1.dec) / point_count

    interpolated_points = [
        ConstellationBoundaryPoint(
            (line.p1.ra + i * deltaRa) % 24,
            line.p1.dec + i * deltaDec,
            line.p2.const1 if i > 0 else None,
            line.p2.const2 if i > 0 else None,
            (i == 0 or i == point_count)
        ) for i in range(point_count + 1)
    ]

    for point in interpolated_points:
        new_ra, new_dec = precess_to_2000(point.ra, point.dec)
        point.ra = new_ra
        point.dec = new_dec

    new_line_segments.append(interpolated_points)

for line_segment_set in new_line_segments:
    first_point = True
    for point in line_segment_set:
        if first_point:
            const1 = ""
            const2 = ""
            first_point = False
        else:
            const1 = point.const1
            const2 = point.const2
        ra = point.ra
        dec = point.dec

        dec_string = f"{dec:+.5f}"
        if abs(dec) < 10:
            dec_string = dec_string[0] + "0" + dec_string[1:]

        out_lines.append(
            f"{f'{ra:.5f}':>8s} {dec_string} {const1:4s} {const2:4s}\n"
        )

open("data/bound_20_gen.txt", "w").writelines(out_lines)
