import json
import os
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional


# Enums
class CoordinateFeature(Enum):
    BLOCKING = 0
    AREA_ENTRANCE = 1
    WATER = 2
    WET = 3
    TRANSPORT_TARGET = 4
    MOUNTAIN = 5
    CASTLE = 6


class CoordinateChangeAction(Enum):
    ADD = "ADD"
    REMOVE = "REMOVE"


class CoordinateChangeStatus(Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"


# Define file paths
CHANGES_FOLDER = "./map changes/accepted"
MAP_FILE = "./buttermap-ui/src/app/data/mud_map.json"
OUTPUT_FILE = "./buttermap-ui/src/app/data/enhanced_map.json"

# Define char-color to feature mapping
CHAR_COLOR_FEATURE_MAPPING: List[Dict[str, Any]] = [
    {"char": "w", "color": "#0033CC", "feature": CoordinateFeature.WATER},
    {"char": "w", "color": "#0000FF", "feature": CoordinateFeature.WATER},
    {"char": "r", "color": "#0000FF", "feature": CoordinateFeature.WATER},
    {"char": "R", "color": "#000066", "feature": CoordinateFeature.WATER},
    {"char": "l", "color": "#000066", "feature": CoordinateFeature.WATER},
    {"char": "^", "color": "#847D84", "feature": CoordinateFeature.MOUNTAIN},
    {"char": "&", "color": "#847D84", "feature": CoordinateFeature.BLOCKING},
    {"char": "#", "color": "#847D84", "feature": CoordinateFeature.BLOCKING},
]


class CoordinateChangeAction(Enum):
    ADD = "ADD"
    REMOVE = "REMOVE"


class CoordinateChangeStatus(Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"


# Area (Placeholder for SimpleArea)
@dataclass
class SimpleArea:
    enterMessage: str
    exitMessage: str


@dataclass
class Transport:
    targetName: str
    moveCommand: str


@dataclass
class FullCoordinate:
    x: int
    y: int
    z: int
    char: str
    color: Optional[str]  # Raw hex color or None for default
    name: Optional[str] = None
    features: Optional[List[CoordinateFeature]] = None
    transports: Optional[List[Transport]] = None
    area: Optional[SimpleArea] = None


# CoordinateChange Class
@dataclass
class CoordinateChange:
    action: CoordinateChangeAction
    coord: Optional[FullCoordinate] = None
    status: CoordinateChangeStatus = CoordinateChangeStatus.PENDING
    features: Optional[List[CoordinateFeature]] = None
    charChange: Optional[str] = None
    color: Optional[str] = None
    name: Optional[str] = None
    transports: Optional[List[Transport]] = None
    area: Optional[SimpleArea] = None
    author: Optional[str] = None
    description: Optional[str] = None


@dataclass
class MapData:
    coordinates: List[FullCoordinate]


def load_json(file_path: str) -> Any:
    """Load JSON data from a file."""
    with open(file_path, "r") as f:
        return json.load(f)


def save_json(data: Any, file_path: str) -> None:
    """Save JSON data to a file."""

    def custom_encoder(obj):
        if isinstance(obj, Enum):
            return obj.value  # Serialize enums as their values
        raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")

    with open(file_path, "w") as f:
        json.dump(data, f, indent=4, default=custom_encoder)


def is_not_empty(value: Any) -> bool:
    """Check if the given value is not None, an empty string, or an empty list/array."""
    if value is None:
        return False
    if isinstance(value, str) and value.strip() == "":
        return False
    if isinstance(value, (list, tuple, set, dict)) and len(value) == 0:
        return False
    return True


def add_features(matching_coord: Dict[str, Any], features: List[CoordinateFeature]) -> None:
    """Add features to the coordinate's features list."""
    if "features" not in matching_coord or matching_coord["features"] is None:
        matching_coord["features"] = []
    for feature in features:
        if feature not in matching_coord["features"]:
            matching_coord["features"].append(feature.value)


def make_castle_changes(coord: Dict[str, Any]) -> None:
    if "features" in coord and CoordinateFeature.CASTLE in coord["features"]:
        if "transports" not in coord:
            coord["transports"] = []
        coord["transports"].append({"targetName": "despair", "moveCommand": "enter;cs;9 w"})


def add_feature_based_on_char_and_color(coord: Dict[str, Any]) -> None:
    """Add a feature to the coordinate based on matching char and color."""
    for mapping in CHAR_COLOR_FEATURE_MAPPING:
        if coord.get("char") == mapping["char"] and coord.get("color") == mapping["color"]:
            add_features(coord, [mapping["feature"]])


def remove_duplicates(matching_coord: dict) -> None:
    """
    Removes duplicate features and transports from a given coordinate.

    Args:
        matching_coord (dict): The coordinate object containing features and transports.
    """
    # Remove duplicate features
    if "features" in matching_coord and isinstance(matching_coord["features"], list):
        matching_coord["features"] = list(set(matching_coord["features"]))

    # Remove duplicate transports
    if "transports" in matching_coord and isinstance(matching_coord["transports"], list):
        unique_transports = []
        seen_transports = set()
        for transport in matching_coord["transports"]:
            # Create a unique identifier for the transport (e.g., tuple of targetName and moveCommand)
            transport_id = (transport["targetName"], transport["moveCommand"])
            if transport_id not in seen_transports:
                unique_transports.append(transport)
                seen_transports.add(transport_id)
        matching_coord["transports"] = unique_transports


def apply_changes(map_data: Dict[str, Any], changes: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Apply changes from the CoordinateChange files to the map data."""
    coordinates = map_data.get("coordinates", [])
    for coord in coordinates:
        add_feature_based_on_char_and_color(coord)

    for change in changes:
        if change["status"] != CoordinateChangeStatus.ACCEPTED.value or "coord" not in change:
            continue

        coord = change["coord"]
        matching_coord = next(
            (c for c in coordinates if c["x"] == coord["x"] and c["y"] == coord["y"] and c["z"] == coord["z"]),
            None,
        )

        if not matching_coord:
            continue

        if change["action"] == CoordinateChangeAction.ADD.value:
            if "features" in change:
                if "features" not in matching_coord:
                    matching_coord["features"] = []
                # Add features only if they are not already present
                for feature in change.get("features", []):
                    if feature not in matching_coord["features"]:
                        matching_coord["features"].append(feature)

        elif change["action"] == CoordinateChangeAction.REMOVE.value:
            # Remove specified features from the coordinate's feature list
            matching_coord["features"] = [
                f for f in matching_coord.get("features", []) if f not in change.get("features", [])
            ]

        if "transports" in change and is_not_empty(change["transports"]):
            if "transports" not in matching_coord:
                matching_coord["transports"] = []
            # Add transports only if they are not already present
            for transport in change["transports"]:
                if transport not in matching_coord["transports"]:
                    matching_coord["transports"].append(transport)

        if "charChange" in change and is_not_empty(change["charChange"]):
            matching_coord["char"] = change["charChange"]

        if "color" in change and is_not_empty(change["color"]):
            matching_coord["color"] = change["color"]

        if "name" in change and is_not_empty(change["name"]):
            matching_coord["name"] = change["name"]

        if "author" in change and is_not_empty(change["author"]):
            matching_coord["author"] = change["author"]

        if "description" in change and is_not_empty(change["description"]):
            matching_coord["description"] = change["description"]

    for coord in coordinates:
        # FIXME: Outworld castle
        # make_castle_changes(coord)
        remove_duplicates(coord)

    return {"coordinates": coordinates}


def main():
    def ensure_numbered_filenames(folder: str):
        files = [f for f in os.listdir(folder) if f.endswith(".json")]
        files.sort()  # Sort alphabetically to maintain consistent order
        for index, file_name in enumerate(files, start=1):
            if not file_name.split("_", 1)[0].isdigit():  # Check if prefixed with a number
                new_name = f"{index}_{file_name}"
                os.rename(os.path.join(folder, file_name), os.path.join(folder, new_name))
                print(f"Renamed {file_name} to {new_name}")

    ensure_numbered_filenames(CHANGES_FOLDER)

    # Load map data
    map_data = load_json(MAP_FILE)

    # Load changes
    changes = []
    for file_name in os.listdir(CHANGES_FOLDER):
        if file_name.endswith(".json"):
            change_data = load_json(os.path.join(CHANGES_FOLDER, file_name))
            changes.append(change_data)

    # Apply changes
    updated_map_data = apply_changes(map_data, changes)

    # Save updated map
    save_json(updated_map_data, OUTPUT_FILE)


if __name__ == "__main__":
    main()
