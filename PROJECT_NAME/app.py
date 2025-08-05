"""app.py

Entry-point module for when Flask is called directly to start the server
"""

from PROJECT_NAME.gui.setup import get_app

app = get_app()
