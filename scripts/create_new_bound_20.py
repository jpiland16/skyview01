import re
import numpy as np
import matplotlib.cm as cm
import matplotlib.pyplot as plt
from precession import precess_to_2000
from analyze_bound_20 import ConstellationBoundaryPoint

CONST_REGEX = r"([ \d]\d\.\d{5}) ([\+-]\d{2}\.\d{5}) (\w+)(?: {1,2}(\w+))?"

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
    

const_re = re.compile(CONST_REGEX)

points_text = open("data/constbnd.dat.txt", "r").read().splitlines()

points = []
points_dict = {}

repeat_counter = 0
new_counter = 0

for line in points_text:
    data = const_re.search(line).groups()
    points.append(ConstellationBoundaryPoint(*data))

line_segments = set()

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



# x = [p.ra for p in points]
# y = [p.dec for p in points]
# colors = cm.rainbow(np.linspace(0, 1, len(points)))

# plt.scatter(x, y, s=1, color=colors)
# plt.show()
