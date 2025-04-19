import requests
import os
import json
from datetime import datetime, UTC
import argparse

# Configuration
API_ENDPOINT = "https://buttermap-backend.vercel.app/api/get-data "  # Replace with your API endpoint
OUTPUT_DIR = "./map changes"  # Directory to store the output files

def get_timestamp():
    return datetime.now(UTC).isoformat() + "Z"

# Parse command-line arguments for username and password
def parse_arguments():
    parser = argparse.ArgumentParser(description="Fetch persisted data with Basic Auth and save to files.")
    parser.add_argument("--username", required=True, help="Basic Auth username")
    parser.add_argument("--password", required=True, help="Basic Auth password")
    return parser.parse_args()

# Fetch data from the REST API using Basic Auth
def fetch_persisted_data(username, password):
    auth = (username, password)
    response = requests.get(API_ENDPOINT, auth=auth)

    if response.status_code == 200:
        return response.json()  # Convert JSON response to Python dict
    else:
        raise Exception(f"Failed to fetch data: {response.status_code} - {response.text}")

# Save data to individual files
def save_data_to_files(data):
    # Save changes
    changes_dir = os.path.join(OUTPUT_DIR, "changes")
    os.makedirs(changes_dir, exist_ok=True)

    for change in data.get("changes", []):
        timestamp = change.get("timestamp", datetime.utcnow().isoformat())
        filename = f"{timestamp.replace(':', '-').replace('T', '_')}_change.json"
        filepath = os.path.join(changes_dir, filename)

        with open(filepath, "w") as file:
            json.dump(change, file, indent=4)
        print(f"Saved change: {filepath}")

    # Save areas
    areas_dir = os.path.join(OUTPUT_DIR, "areas")
    os.makedirs(areas_dir, exist_ok=True)

    for area in data.get("areas", []):
        timestamp = area.get("timestamp", get_timestamp())
        filename = f"{timestamp.replace(':', '-').replace('T', '_')}_area.json"
        filepath = os.path.join(areas_dir, filename)

        with open(filepath, "w") as file:
            json.dump(area, file, indent=4)
        print(f"Saved area: {filepath}")

# Main execution
def main():
    args = parse_arguments()
    username = args.username
    password = args.password

    try:
        print("Fetching persisted data...")
        persisted_data = fetch_persisted_data(username, password)

        print("Saving data to files...")
        save_data_to_files(persisted_data)

        print("Data processing complete.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
