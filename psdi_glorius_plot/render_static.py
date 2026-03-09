"""render_static.py

This script renders all pages in the site as static html pages.
"""

import os
import shutil
from argparse import ArgumentParser

from flask import render_template

import psdi_glorius_plot
from psdi_glorius_plot.gui.env import get_env_kwargs, update_env
from psdi_glorius_plot.gui.get import d_pages
from psdi_glorius_plot.gui.setup import get_app

DEFAULT_TARGET_DIR = "public"
DEFAULT_SERVER_ROOT = "psdi-uk.github.io/"


def main():
    """Standard entry-point function for this script.
    """

    parser = ArgumentParser()

    parser.add_argument("--output", "-o", type=str, default=DEFAULT_TARGET_DIR,
                        help="The desired directory (absolute or relative to where this script is run from) to render"
                        "the site to")

    parser.add_argument("--server-name", "-s", type=str, default=DEFAULT_SERVER_ROOT + "psdi-glorius-plot",
                        help="The name of the server this will be deployed to, which will be used in constructing "
                        "absolute URLs")

    parser.add_argument("--use-env-vars", action="store_true",
                        help="If set, all other arguments and defaults for this script are ignored, and environmental "
                        "variables and their defaults will instead control execution. These defaults will result in "
                        "the app running in production server mode.")

    parser.add_argument("--service-mode", action="store_true",
                        help="If set, will run as if deploying a service rather than the local GUI")

    parser.add_argument("--dev-mode", action="store_true",
                        help="If set, will expose development elements, such as the SHA of the latest commit")

    parser.add_argument("--debug", action="store_true",
                        help="If set, will run the Flask server in debug mode, which will cause it to automatically "
                        "reload if code changes and show an interactive debugger in the case of errors")

    parser.add_argument("--rel-url-path", type=str, default="",
                        help="In service mode, will set the path to content relative to the site root "
                        "directory. Has no effect if not in service mode.")

    parser.add_argument("--log-level", type=str, default=None,
                        help="The desired level to log at. Allowed values are: 'DEBUG', 'INFO', 'WARNING', 'ERROR, "
                             "'CRITICAL'. Default: 'INFO' for logging to file, 'WARNING' for logging to stdout")

    args = parser.parse_args()

    if not args.use_env_vars:
        # Overwrite the values from environmental variables with the values from the command-line arguments
        update_env(args)

    # Ensure the output directory exists
    output_dir = os.path.abspath(args.output)
    os.makedirs(output_dir, exist_ok=True)
    if not os.path.isdir(output_dir):
        raise FileNotFoundError(f"Unable to create directory {output_dir}")

    # Get the location of the project's root directory
    project_dir = os.path.abspath(os.path.join(psdi_glorius_plot.__path__[0], ".."))

    # Copy over the static contents directly to the output directory
    target_static_dir = os.path.join(output_dir, "static")
    if os.path.exists(target_static_dir):
        shutil.rmtree(target_static_dir)
    shutil.copytree(os.path.join(project_dir, "psdi_glorius_plot/static"),
                    target_static_dir)

    # Start the app so we're able to render pages

    app = get_app()
    app.config['SERVER_NAME'] = args.server_name
    app.config['PREFERRED_URL_SCHEME'] = 'https'

    with app.app_context():
        # Render all pages and output them to the output directory
        for path in d_pages:
            if not path.endswith(".html"):
                continue

            stripped_path = path.strip("/")

            qualified_path = os.path.join(output_dir, stripped_path)

            # Render the template and write it to the desired output location
            open(qualified_path, "w").write(render_template(stripped_path, **get_env_kwargs()))


if __name__ == "__main__":
    main()
