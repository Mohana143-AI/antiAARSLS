import os
import sys

# Get the absolute path of the current file's directory (api/)
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the project root directory
root_dir = os.path.dirname(current_dir)
# Get the backend directory
backend_dir = os.path.join(root_dir, "backend")

# Add both root and backend to sys.path
sys.path.append(root_dir)
sys.path.append(backend_dir)

from backend.app.main import app

# For Vercel, export the handler
handler = app
