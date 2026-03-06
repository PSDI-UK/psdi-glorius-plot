"""
# setup.py

This module handles setting up the Flask app
"""


import os
from collections.abc import Callable
from functools import wraps
from typing import Any

import werkzeug
from flask import Flask, cli

import psdi_glorius_plot
from psdi_glorius_plot import constants as const
from psdi_glorius_plot.gui.env import get_env
from psdi_glorius_plot.gui.get import init_get
from psdi_glorius_plot.gui.post import init_post

_app: Flask | None = None


def _patch_flask_warning():
    """Monkey-patch Flask to disable the warnings that would otherwise appear for this so they don't confuse the user
    """

    def suppress_warning(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            if args and isinstance(args[0], str) and args[0].startswith('WARNING: This is a development server.'):
                return ''
            return func(*args, **kwargs)
        return wrapper

    werkzeug.serving._ansi_style = suppress_warning(werkzeug.serving._ansi_style)
    cli.show_server_banner = lambda *_: None


def _get_flask_kwargs() -> dict[str, Any]:
    """Get the kwargs we want to pass to the initialisation of the Flask app based on env settings"""

    env = get_env()
    flask_kwargs = {}

    # Only set the static URL path to something custom in service mode, as in local mode it will always just be the
    # Flask default
    if env.service_mode:
        flask_kwargs["static_url_path"] = env.static_url_path

    return flask_kwargs


def _init_app():
    """Create and return the Flask app with appropriate settings"""

    # Suppress Flask's warning, since we're using the dev server as a GUI
    _patch_flask_warning()

    app = Flask(const.APP_NAME, **_get_flask_kwargs())

    # Connect the app to the various pages and methods of the website
    init_get(app)
    init_post(app)

    return app


def get_app() -> Flask:
    """Get a reference to the global `Flask` app, creating it if necessary.
    """
    global _app
    if not _app:
        _app = _init_app()
    return _app


def start_app():
    """Start the Flask app - this requires being run from the base directory of the project, so this changes the
    current directory to there. Anything else which changes it while the app is running may interfere with its proper
    execution.
    """

    old_cwd = os.getcwd()

    try:
        os.chdir(os.path.join(psdi_glorius_plot.__path__[0], ".."))
        get_app().run(debug=get_env().debug_mode)
    finally:
        # Return to the previous directory after running the app
        os.chdir(old_cwd)
