"""
# utils.py

Miscellaneous utility functions used by this project
"""


import sys
import textwrap

from PROJECT_NAME.constants import TERM_WIDTH


class TextColors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_wrap(s: str, newline=False, err=False, **kwargs):
    """Print a string wrapped to the terminal width
    """
    if err:
        file = sys.stderr
    else:
        file = sys.stdout
    for line in s.split("\n"):
        print(textwrap.fill(line, width=TERM_WIDTH, **kwargs), file=file)
    if newline:
        print("")


def regularize_name(name: str):
    """Regularizes a name for comparisons, making it lowercase and stripping spaces

    Parameters
    ----------
    name : str
        The name, e.g. "Open Babel"

    Returns
    -------
    str
        The regularized name, e.g. "openbabel"
    """
    return name.lower().replace(" ", "")
