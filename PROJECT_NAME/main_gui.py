"""main_gui.py

This script acts as a server for the PROJECT_NAME_HUMAN website.
"""

from argparse import ArgumentParser

from PROJECT_NAME.gui.env import update_env
from PROJECT_NAME.gui.setup import start_app
from PROJECT_NAME.utils import print_wrap


def main():
    """Standard entry-point function for this script.
    """

    parser = ArgumentParser()

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

    parser.add_argument("--log-level", type=str, default=None,
                        help="The desired level to log at. Allowed values are: 'DEBUG', 'INFO', 'WARNING', 'ERROR, "
                             "'CRITICAL'. Default: 'INFO' for logging to file, 'WARNING' for logging to stdout")

    # Set global variables for settings based on parsed arguments, unless it's set to use env vars
    args = parser.parse_args()

    if not args.use_env_vars:
        # Overwrite the values from environmental variables with the values from the command-line arguments
        update_env(args)

    print_wrap("Starting the PROJECT_NAME_HUMAN GUI. This GUI is run as a webpage, which you can open by "
               "right-clicking the link below to open it in your default browser, or by copy-and-pasting it into your "
               "browser of choice.")

    start_app()


if __name__ == "__main__":
    main()
