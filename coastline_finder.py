import json
import os
from collections import deque
from enum import Enum
from collections import Counter


class CoordinateFeature(Enum):
    BLOCKING = 0
    AREA_ENTRANCE = 1
    WATER = 2
    WET = 3
    TRANSPORT_TARGET = 4
    MOUNTAIN = 5
    CASTLE = 6


directions = {
    "nw": (-1, -1), "n": (0, -1), "ne": (1, -1),
    "e": (1, 0), "se": (1, 1), "s": (0, 1),
    "sw": (-1, 1), "w": (-1, 0)
}


def build_grid(coordinates):
    return {(c["x"], c["y"]): c for c in coordinates}


def is_land(c):
    return (c.get("char") != "w" and c.get("char") != "W") and CoordinateFeature.WATER.value not in c.get("features", []) and CoordinateFeature.BLOCKING.value not in c.get(
        "features", [])


def is_water(c):
    return (c.get("char") == "w" or c.get("char") == "W") and CoordinateFeature.WATER.value in c.get(
        "features", [])


def get_land_masses(grid, min_size=20):  # 👈 you can tune this
    visited = set()
    masses = []

    for pos, coord in grid.items():
        if pos in visited or not is_land(coord):
            continue

        mass = set()
        queue = deque([pos])
        while queue:
            x, y = queue.popleft()
            if (x, y) in visited:
                continue
            visited.add((x, y))

            c = grid.get((x, y))
            if not c or not is_land(c):
                continue

            mass.add((x, y))
            for dx in [-1, 0, 1]:
                for dy in [-1, 0, 1]:
                    if dx or dy:
                        queue.append((x + dx, y + dy))

        if len(mass) >= min_size:
            masses.append(mass)

    return masses


def find_coastline_tiles(mass, grid):
    def count_adjacent_water(x, y):
        count = 0
        for dx in [-1, 0, 1]:
            for dy in [-1, 0, 1]:
                if dx or dy:
                    neighbor = grid.get((x + dx, y + dy))
                    if neighbor and is_water(neighbor):
                        count += 1
        return count

    coast = set()
    for (x, y) in mass:
        if count_adjacent_water(x, y) >= 2  :  # 👈 more forgiving
            coast.add((x, y))

    return coast



def trace_edge_path(start, edge_set, grid, max_water_steps=5, min_total_steps=10):
    from heapq import heappush, heappop

    def get_key(x, y):
        return f"{x},{y}"

    def count_adjacent_water(x, y):
        count = 0
        for dx in [-1, 0, 1]:
            for dy in [-1, 0, 1]:
                if dx or dy:
                    neighbor = grid.get((x + dx, y + dy))
                    if neighbor and is_water(neighbor):
                        count += 1
        return count

    visited = set()
    path = []
    coords = []
    current = start
    water_streak = 0
    steps_since_progress = 0
    backtrack_limit = 200  # total "stuck" steps allowed

    while True:
        key = get_key(*current)
        if key in visited:
            break

        visited.add(key)
        coords.append([current[0], current[1]])

        # Build list of all possible moves with a "coastline preference score"
        candidates = []

        for d, (dx, dy) in directions.items():
            nx, ny = current[0] + dx, current[1] + dy
            neighbor = (nx, ny)
            neighbor_key = get_key(nx, ny)
            if neighbor_key in visited:
                continue

            tile = grid.get(neighbor)
            if not tile:
                continue

            if neighbor in edge_set:
                # prioritize edge tiles with more adjacent water
                score = -count_adjacent_water(nx, ny)
                heappush(candidates, (score, d, neighbor, 0))  # 0 water streak
            elif is_water(tile) and water_streak < max_water_steps:
                score = 10  # deprioritize water
                heappush(candidates, (score, d, neighbor, water_streak + 1))

        if not candidates:
            steps_since_progress += 1
            if len(path) >= min_total_steps or steps_since_progress > backtrack_limit:
                break
            else:
                continue

        # Pick the best candidate direction based on score
        _, direction, next_pos, next_streak = heappop(candidates)
        path.append(direction)
        current = next_pos
        water_streak = next_streak
        steps_since_progress = 0

    return path, coords





def describe_extremes(coords):
    xs = [x for x, y in coords]
    ys = [y for x, y in coords]
    north = min(ys)
    south = max(ys)
    west = min(xs)
    east = max(xs)
    return f"north:{north}, east:{east}, south:{south}, west:{west}"


def merge_coastline_masses(masses, grid, max_merge_distance=15):
    def centroid(mass):
        xs = [x for x, y in mass]
        ys = [y for x, y in mass]
        return (sum(xs) // len(xs), sum(ys) // len(ys))

    # Build list of (mass, centroid)
    centroids = [(mass, centroid(mass)) for mass in masses]
    merged = []

    while centroids:
        base_mass, base_center = centroids.pop(0)
        combined = set(base_mass)

        i = 0
        while i < len(centroids):
            other_mass, other_center = centroids[i]
            dist = abs(base_center[0] - other_center[0]) + abs(base_center[1] - other_center[1])
            if dist <= max_merge_distance:
                combined.update(other_mass)
                base_center = centroid(combined)
                centroids.pop(i)
                i = 0  # start over because centroid changed
            else:
                i += 1

        merged.append(combined)

    return merged



def extract_coastline_objects(coordinates, include_coordinates=True, include_dirs=True):
    grid = build_grid(coordinates)
    raw_masses = get_land_masses(grid, min_size=10)  # filter out tiny blobs
    merged_masses = merge_coastline_masses(raw_masses, grid)
    mass_classifications = [(mass, "continent") for mass in merged_masses]

    coastline_objs = []

    for i, (mass, classification) in enumerate(mass_classifications):
        coast = find_coastline_tiles(mass, grid)

        if not coast:
            print(f"⚠️ Skipping {classification} #{i+1}: no valid coastline tiles")
            continue

        path = None
        coords_path = None

        # ✅ Try all coast tiles until a long-enough path is found
        for start in coast:
            candidate_path, candidate_coords = trace_edge_path(
                start, coast, grid, max_water_steps=10, min_total_steps=20
            )
            if candidate_path and len(candidate_path) >= 10:
                path = candidate_path
                coords_path = candidate_coords
                break

        if not path:
            print(f"⚠️ Skipping {classification} #{i+1}: no valid route with 10+ steps")
            continue

        obj = {
            "name": describe_extremes(coords_path),
            "type": classification,
        }

        if include_dirs:
            obj["dirs"] = compress_directions(";".join(path))

        if include_coordinates:
            obj["coordinates"] = coords_path

        coastline_objs.append(obj)

        print(f"🌍 {classification.title()} #{i+1}: traced path with {len(path)} steps")

    print("✅ Final landmass classification:", Counter(o["type"] for o in coastline_objs))
    print(f"📦 Total coastline objects saved: {len(coastline_objs)}")

    return coastline_objs




def classify_mass(mass):
    size = len(mass)
    if size >= 100:
        return "continent"
    elif size >= 20:
        return "island"
    else:
        return "archipelago"


def compress_directions(directions, max_steps=20):
    direction_list = [d.strip() for d in directions.split(";") if d.strip()]
    compressed = []

    current = None
    count = 0

    for d in direction_list:
        parts = d.strip().split()
        if len(parts) == 2:
            step_count, direction = int(parts[0]), parts[1]
        else:
            step_count, direction = 1, parts[0]

        if direction == current:
            count += step_count
        else:
            while count > max_steps:
                compressed.append(f"{max_steps} {current}")
                count -= max_steps
            if count > 0:
                compressed.append(f"{count} {current}" if count > 1 else current)

            current = direction
            count = step_count

    # Final flush
    while count > max_steps:
        compressed.append(f"{max_steps} {current}")
        count -= max_steps
    if count > 0:
        compressed.append(f"{count} {current}" if count > 1 else current)

    return ";".join(compressed)


def save_files(coastline_data):
    base_output_dir = "./map changes/tours"

    for i, obj in enumerate(coastline_data, start=1):
        classification = obj.get("type", "unknown")
        output_dir = os.path.join(base_output_dir, classification)
        os.makedirs(output_dir, exist_ok=True)

        base_name = obj["name"].replace(" ", "_").replace(":", "-").replace(",", "")
        filename = f"{output_dir}/mass_{i}_{base_name}.json"

        with open(filename, "w") as f:
            json.dump(obj, f, indent=2)

    print(f"Saved {len(coastline_data)} files to '{base_output_dir}/[type]/'")


with open("./buttermap-ui/src/app/data/enhanced_map.json", "r") as f:
    data = json.load(f)

coastline_data = extract_coastline_objects(data["coordinates"], True, True)
save_files(coastline_data)

# Print as JSON
print(json.dumps(coastline_data, indent=None, separators=(",", ":")))
