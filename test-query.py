import json
import urllib.request

with open('firebase-applet-config.json') as f:
    config = json.load(f)

project_id = config['projectId']
db_id = config['firestoreDatabaseId']

url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{db_id}/documents/schedules"

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
