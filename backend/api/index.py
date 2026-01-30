import os
import sys

# Add the parent directory to sys.path so we can import 'main'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

# Vercel looks for 'app' variable by default for ASGI apps
