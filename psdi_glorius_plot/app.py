"""app.py

Entry-point module for when Flask is called directly to start the server
"""

from psdi_glorius_plot.gui.setup import get_app

app = get_app()
