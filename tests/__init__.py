import json


def extract_keys_from_json(file_path):
    # Open and read the JSON file
    with open(file_path, 'r') as file:
        data = json.load(file)

    # Function to recursively get all keys
    def get_keys(data, parent_key=''):
        keys = []
        if isinstance(data, dict):
            for key, value in data.items():
                full_key = f"{parent_key}.{key}" if parent_key else key
                keys.append(full_key)
                keys.extend(get_keys(value, full_key))
        elif isinstance(data, list):
            for item in data:
                keys.extend(get_keys(item, parent_key))
        return keys

    # Extract keys
    keys = get_keys(data)

    # Remove duplicate keys and sort them
    unique_keys = sorted(set(keys))

    # Output keys
    for key in unique_keys:
        print(key)


if __name__ == "__main__":
    # Replace 'your_file.json' with the path to your JSON file
    json_file_path = 'C:/Users/Vanja/Desktop/Sport5Rider3.json'
    extract_keys_from_json(json_file_path)
