import json, re

f = json.load(open("data/constlines.json"))

new = {}

for constellation in f["features"]:
    coords = constellation["geometry"]["coordinates"]
    for list1 in coords:
        for list2 in list1:
            # Convert 'longitude' to right ascension
            lon = list2[0]
            if lon < 0: 
                lon += 360
            list2[0] = round(lon * 24 / 360, 5)
    new[constellation["id"]] = coords

out = json.dumps(new)
out = re.sub("}", "\n}\n", out)

open("data/constln.json", "w").write(re.sub("\"(?=[A-Z])", "\n    \"", out))