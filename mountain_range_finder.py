import json
import os
from collections import deque
from enum import Enum


class CoordinateFeature(Enum):
    BLOCKING = 0
    AREA_ENTRANCE = 1
    WATER = 2
    WET = 3
    TRANSPORT_TARGET = 4
    MOUNTAIN = 5
    CASTLE = 6


DIRECTIONS = {
    "nw": (-1, -1), "n": (0, -1), "ne": (1, -1),
    "e": (1, 0), "se": (1, 1), "s": (0, 1),
    "sw": (-1, 1), "w": (-1, 0)
}


def build_grid(coordinates):
    return {(c["x"], c["y"]): c for c in coordinates}


def get_mountain_ranges(grid, min_cluster_size=3):
    visited = set()
    mountain_clusters = []

    for pos, coord in grid.items():
        if pos in visited or CoordinateFeature.MOUNTAIN.value not in coord.get("features", []):
            continue

        cluster = set()
        queue = deque([pos])

        while queue:
            x, y = queue.popleft()
            if (x, y) in visited:
                continue
            visited.add((x, y))

            c = grid.get((x, y))
            if not c or CoordinateFeature.MOUNTAIN.value not in c.get("features", []):
                continue

            cluster.add((x, y))

            for dx in [-1, 0, 1]:
                for dy in [-1, 0, 1]:
                    if dx or dy:
                        queue.append((x + dx, y + dy))

        if len(cluster) >= min_cluster_size:
            mountain_clusters.append(cluster)

    return mountain_clusters


def trace_feature_edges(edge_set):
    visited = set()
    all_paths = []

    def get_key(x, y):
        return f"{x},{y}"

    for start in edge_set:
        if get_key(*start) in visited:
            continue

        path = []
        coords = []
        current = start

        while True:
            visited.add(get_key(*current))
            coords.append([current[0], current[1]])

            for d, (dx, dy) in DIRECTIONS.items():
                nx, ny = current[0] + dx, current[1] + dy
                if (nx, ny) in edge_set and get_key(nx, ny) not in visited:
                    path.append(d)
                    current = (nx, ny)
                    break
            else:
                break

        if path:
            all_paths.append((path, coords))

    return all_paths


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

    while count > max_steps:
        compressed.append(f"{max_steps} {current}")
        count -= max_steps
    if count > 0:
        compressed.append(f"{count} {current}" if count > 1 else current)

    return ";".join(compressed)


def describe_extremes(coords):
    xs = [x for x, y in coords]
    ys = [y for x, y in coords]
    north = min(ys)
    south = max(ys)
    west = min(xs)
    east = max(xs)
    return f"north:{north}, east:{east}, south:{south}, west:{west}"


def extract_mountain_objects(coordinates, include_coordinates=True, include_dirs=True):
    grid = build_grid(coordinates)
    mountain_ranges = get_mountain_ranges(grid, min_cluster_size=3)

    mountain_objs = []

    for range_cluster in mountain_ranges:
        edge_tiles = find_mountain_edge_tiles(range_cluster, grid)
        edge_paths = trace_feature_edges(edge_tiles)

        for path, coord_path in edge_paths:
            if not path or len(path) < 6:
                continue  # ⛔ Skip if path is too short

            obj = {
                "name": describe_extremes(coord_path),
                "type": "mountain"
            }

            if include_dirs:
                obj["dirs"] = compress_directions(";".join(path))

            if include_coordinates:
                obj["coordinates"] = coord_path

            mountain_objs.append(obj)

    return mountain_objs


def find_mountain_edge_tiles(cluster, grid):
    edges = set()

    for (x, y) in cluster:
        for dx in [-1, 0, 1]:
            for dy in [-1, 0, 1]:
                if dx or dy:
                    nx, ny = x + dx, y + dy
                    neighbor = grid.get((nx, ny))
                    if not neighbor or CoordinateFeature.MOUNTAIN.value not in neighbor.get("features", []):
                        edges.add((x, y))
                        break  # found an exposed edge

    return edges

def save_files(data):
    base_output_dir = "./map changes/tours/mountain"
    os.makedirs(base_output_dir, exist_ok=True)

    for i, obj in enumerate(data, start=1):
        base_name = obj["name"].replace(" ", "_").replace(":", "-").replace(",", "")
        filename = f"{base_output_dir}/mountain_{i}_{base_name}.json"

        with open(filename, "w") as f:
            json.dump(obj, f, indent=2)

    print(f"Saved {len(data)} mountain files to '{base_output_dir}/'")


if __name__ == "__main__":
    with open("./buttermap-ui/src/app/data/enhanced_map.json", "r") as f:
        data = json.load(f)

    mountain_data = extract_mountain_objects(data["coordinates"], include_coordinates=True, include_dirs=True)
    save_files(mountain_data)

    print(json.dumps(mountain_data, indent=2))
