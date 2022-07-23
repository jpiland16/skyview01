import re
import numpy as np
import matplotlib.cm as cm
import matplotlib.pyplot as plt

CONST_REGEX_2 = r"(\d?\d\.\d{7})\s([\+-]\d{2}\.\d{7})\|(\w{3,4})\s?\|(.)"

class ConstellationBoundaryPoint:
    def __init__(self, ra, dec, const1, const2 = None, original = False):
        self.ra = float(ra)
        self.dec = float(dec)
        self.const1 = const1
        self.const2 = const2
        self.original = original
    def __repr__(self):
        return (f"ConstellationBoundaryPoint({self.ra}, {self.dec}, " + 
            f"{self.const1}, {self.const2}, {self.original})")
    def __str__(self):
        return (f"RA = {self.ra}, Dec = {self.dec} " + 
            f"| {self.const1} {self.const2} " + 
            f"{'original' if self.original else 'interpolated'}")
    def __eq__(self, o):
        return (isinstance(o, ConstellationBoundaryPoint) and
            self.ra == o.ra and self.dec == o.dec)
    def __hash__(self):
        return hash(self.ra + 24 * self.dec)

def createConstBndPoint(r, d, c, o):
    return ConstellationBoundaryPoint(r, d, c, original=(o=="O"))

def main():
    const_re = re.compile(CONST_REGEX_2)

    points_text = open("data/bound_20.txt", "r").read().splitlines()[7:-2]

    points = []
    points_dict = {}

    repeat_counter = 0
    new_counter = 0

    for line in points_text:
        data = const_re.search(line).groups()
        points.append(createConstBndPoint(*data))
        key = f"{data[0]}{data[1]}"
        if key in points_dict:
            repeat_counter += 1
        else:
            points_dict[key] = True
            new_counter += 1

    print(f"{len(points_text)} points processed.")
    print(f"{repeat_counter} repeats")
    print(f"{new_counter} new")

    x = [p.ra for p in points]
    y = [p.dec for p in points]

    colors = cm.rainbow(np.linspace(0, 1, len(points)))

    x_orig = []
    y_orig = []
    c_orig = []
    x_intr = []
    y_intr = []
    c_intr = []

    for c, p in zip(colors, points):
        if p.original:
            x_list = x_orig
            y_list = y_orig
            c_list = c_orig
        else:
            x_list = x_intr
            y_list = y_intr
            c_list = c_intr
        x_list.append(p.ra)
        y_list.append(p.dec)
        c_list.append(c)

    # plt.scatter(x, y, s=1, color=colors)
    plt.scatter(x_orig, y_orig, color=c_orig, s=3)
    plt.scatter(x_intr, y_intr, color=c_intr, s=0.5)

    # print(len(x_orig))

    plt.show()

if __name__ == "__main__":
    main()
