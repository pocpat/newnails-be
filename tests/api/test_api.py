import requests
import json

design_id = "68765ec38d68ccae6786a191" # Replace with the actual design ID from the previous step
user_id = "testuser123"

url = f"http://localhost:3000/api/designs/{design_id}"
headers = {"Content-Type": "application/json"}
payload = {"userId": user_id}

try:
    response = requests.delete(url, headers=headers, data=json.dumps(payload))
    response.raise_for_status()  # Raise an exception for HTTP errors
    print(response.json())
except requests.exceptions.RequestException as e:
    print(f"Error: {e}")
    if hasattr(e, 'response') and e.response is not None:
        print(f"Response content: {e.response.text}")
