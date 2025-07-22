import sys
import json
import os
from elevenlabs.client import ElevenLabs

api_key = os.getenv("ELEVENLABS_API_KEY")
file_path = sys.argv[1]
name = sys.argv[2]
elevenlabs = ElevenLabs(api_key=api_key)
with open(file_path, "rb") as f:
    pd = elevenlabs.pronunciation_dictionaries.create_from_file(file=f.read(), name=name)
print(json.dumps({"pronunciation_dictionary_id": pd.id, "version_id": pd.version_id})) 