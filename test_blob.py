import requests

url = "https://newnails-be.vercel.app/api/save-design?filename=test-file.txt"
headers = {"Content-Type": "text/plain"}
data = "This is a test file for Vercel Blob integration."

try:
    response = requests.post(url, headers=headers, data=data)
    response.raise_for_status()  # Raise an exception for HTTP errors
    print(response.json())
except requests.exceptions.RequestException as e:
    print(f"Error: {e}")
    if hasattr(e, 'response') and e.response is not None:
        print(f"Response content: {e.response.text}")
