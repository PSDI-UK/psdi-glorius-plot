"""render_static.py

This script renders all pages in the site as static html pages.
"""

import os
from argparse import ArgumentParser

DEFAULT_TARGET_DIR = "public"


def main():
    """Standard entry-point function for this script.
    """

    parser = ArgumentParser()

    parser.add_argument("--output", "-o", type=str, default=DEFAULT_TARGET_DIR,
                        help="The desired directory (absolute or relative to where this script is run from) to render"
                        "the site to")

    args = parser.parse_args()

    # Ensure the output directory exists
    output_dir = os.path.abspath(args.output)
    os.makedirs(output_dir, exist_ok=True)
    if not os.path.isdir(output_dir):
        raise FileNotFoundError(f"Unable to create directory {output_dir}")


if __name__ == "__main__":
    main()
