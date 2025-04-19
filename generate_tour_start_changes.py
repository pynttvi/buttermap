import os
import json
from enum import Enum


class CoordinateFeature(Enum):
    TOUR_START = 7


class CoordinateChangeAction(Enum):
    ADD = "ADD"


class CoordinateChangeStatus(Enum):
    ACCEPTED = "ACCEPTED"


def load_coordinate_sets(folder_path, prefix):
    tour_changes = []
    tour_index_entries = []
    index = 1

    print(f"\n🔍 Scanning folder: {folder_path}")

    for file_name in sorted(os.listdir(folder_path)):
        if not file_name.endswith(".json"):
            continue

        file_path = os.path.join(folder_path, file_name)
        with open(file_path, "r") as f:
            data = json.load(f)

        coords = data.get("coordinates", [])
        if not coords:
            print(f"⚠️  Skipped {file_name}: no coordinates")
            continue

        coord = coords[0]
        x, y = coord
        tour_name = f"{prefix}{index}"

        change = {
            "action": CoordinateChangeAction.ADD.value,
            "status": CoordinateChangeStatus.ACCEPTED.value,
            "coord": {"x": x, "y": y, "z": 0},
            "features": [CoordinateFeature.TOUR_START.value],
            "name": tour_name,
            "author": "auto-tour",
            "description": f"Auto-added TOUR_START for {tour_name}"
        }

        relative_path = os.path.join(os.path.basename(folder_path), file_name)

        tour_changes.append(change)
        tour_index_entries.append({
            "name": tour_name,
            "file": file_name,
            "path": relative_path,
            "x": x,
            "y": y
        })

        print(f"✅ Added {tour_name} from {file_name} at ({x},{y})")
        index += 1

    return tour_changes, tour_index_entries




def main():
    base_dir = "./map changes/tours"
    output_dir = "./map changes/accepted"

    os.makedirs(output_dir, exist_ok=True)

    all_changes = []
    index_list = []

    sources = [
        ("continent", "Continent"),
        ("mountain", "Mountain"),
        ("island", "Island")
    ]

    for subfolder, prefix in sources:
        folder_path = os.path.join(base_dir, subfolder)
        if not os.path.exists(folder_path):
            print(f"⛔ Missing folder: {folder_path}")
            continue

        changes, names = load_coordinate_sets(folder_path, prefix)
        all_changes.extend(changes)
        index_list.extend(names)

    # Save single 17_tour_starts.json
    tour_path = os.path.join(output_dir, "17_tour_starts.json")
    with open(tour_path, "w") as f:
        json.dump(all_changes, f, indent=2)
    print(f"\n✅ Saved {len(all_changes)} TOUR_STARTs to {tour_path}")

    # Save index
    index_path = os.path.join("./buttermap-ui/src/app/data/", "tour_index.json")
    with open(index_path, "w") as f:
        json.dump({"tour": index_list}, f, indent=2)
    print(f"📍 Tour order saved to {index_path}")


if __name__ == "__main__":
    main()
