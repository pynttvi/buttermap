import json

def find_unique_values(file_path, field_name):
    """
    Opens a JSON file and finds unique values of a specified field in a list of objects.

    :param file_path: Path to the JSON file
    :param field_name: Field name whose unique values are to be found
    :return: Set of unique values for the specified field
    """
    try:
        # Open and load the JSON file
        with open(file_path, 'r') as file:
            content = json.load(file)
            data = content.get("coordinates")

        # Ensure the data is a list of objects
        if not isinstance(data, list):
            raise ValueError("The Data file must contain a list of objects.")

        # Extract unique values from the specified field
        unique_values = {obj.get(field_name) for obj in data if field_name in obj}
        return unique_values

    except FileNotFoundError:
        print(f"Error: The file '{file_path}' was not found.")
    except json.JSONDecodeError:
        print(f"Error: The file '{file_path}' is not a valid JSON file.")
    except ValueError as ve:
        print(f"Error: {ve}")

def save_array_to_json(file_path, data):
    """
    Saves an array or set as a JSON list to a file.

    :param file_path: Path to the JSON file where the list will be saved
    :param data: Array or set to save
    """
    try:
        # Convert set to list if needed
        if isinstance(data, set):
            data = list(data)

        with open(file_path, 'w') as file:
            json.dump(data, file, indent=4)
        print(f"Data saved successfully to {file_path}")
    except Exception as e:
        print(f"An error occurred while saving the file: {e}")


# Example usage
if __name__ == "__main__":
    file_path = "./buttermap-ui/src/app/data/mud_map.json"  # Path to your JSON file
    field_name = "co"  # Replace with the field name you want to check

    unique_colors = find_unique_values(file_path, "color")
    save_array_to_json("./buttermap-ui/src/app/data/colors.json", unique_colors)

    unique_chars = find_unique_values(file_path, "char")
    save_array_to_json("./buttermap-ui/src/app/data/chars.json", unique_chars)
