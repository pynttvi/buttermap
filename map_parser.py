import json
from bs4 import BeautifulSoup  # Use BeautifulSoup for easier HTML parsing

def parse_map(file_path):
    """
    Parses an ASCII map from an HTML file and generates a JSON representation.

    Args:
        file_path (str): Path to the HTML file containing the map.

    Returns:
        dict: JSON representation of the map.
    """
    # Read the file and parse it with BeautifulSoup
    with open(file_path, 'r') as file:
        soup = BeautifulSoup(file, 'html.parser')

    # Extract ASCII content with colors
    map_coordinates = []
    z_coordinate = 0
    y = 0

    def process_content(contents, current_y, current_x, current_color=None):
        """
        Process a list of contents, accounting for nested elements and <br> tags.

        Args:
            contents (list): List of elements to process.
            current_y (int): Current y position.
            current_x (int): Current x position.
            current_color (str): Current color context (hex).

        Returns:
            tuple: Updated (current_y, current_x).
        """
        for element in contents:
            if isinstance(element, str):
                # Process plain text
                for char in element.strip():
                    if char.strip():  # Skip empty spaces
                        map_coordinates.append({
                            "x": current_x,
                            "y": current_y,
                            "z": z_coordinate,
                            "char": char,
                            "color": current_color  # Assign the current color
                        })
                        current_x += 1
            elif element.name == 'font' and 'color' in element.attrs:
                # Process <font> tags with colors
                new_color = element.attrs['color']  # Update the color context
                current_y, current_x = process_content(element.contents, current_y, current_x, new_color)
            elif element.name == 'br':
                # Handle <br> tags
                current_y += 1
                current_x = 0  # Reset x position after a line break
        return current_y, current_x

    # Process the <pre> contents
    x = 0
    for element in soup.pre.contents:
        if isinstance(element, str):
            # Process plain text at root level
            for char in element.strip():
                if char.strip():  # Skip empty spaces
                    map_coordinates.append({
                        "x": x,
                        "y": y,
                        "z": z_coordinate,
                        "char": char,
                        "color": None  # Default to None for plain text
                    })
                    x += 1
        elif element.name == 'font' and 'color' in element.attrs:
            # Process <font> tags with colors
            color = element.attrs['color']
            y, x = process_content(element.contents, y, x, color)
        elif element.name == 'br':
            # Handle standalone <br> tags
            y += 1
            x = 0

        # Calculate row and column counts
    unique_rows = set(coord['y'] for coord in map_coordinates)
    max_columns_per_row = {
        row: max(coord['x'] for coord in map_coordinates if coord['y'] == row) + 1
        for row in unique_rows
    }
    max_columns = max(max_columns_per_row.values(), default=0)
    row_count = len(unique_rows)

    # Log row and column counts
    print(f"Row count: {row_count}")
    print(f"Max columns per row: {max_columns}")

    return {"coordinates": map_coordinates}

# Example usage
file_path = "./original_2020.html"  # Replace with the actual file path

# Parse the map and save to JSON
parsed_map = parse_map(file_path)
output_path = "./buttermap-ui/src/app/data/mud_map.json"
with open(output_path, 'w') as json_file:
    json.dump(parsed_map, json_file, indent=2)

print(f"Map has been parsed and saved to {output_path}")
