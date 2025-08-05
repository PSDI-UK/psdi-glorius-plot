"""@file PROJECT_NAME/file_io.py

Functions and classes related to general filesystem input/output
"""

import os
from functools import lru_cache

from PROJECT_NAME import constants as const


@lru_cache(maxsize=1)
def get_package_path() -> str:
    """Gets the absolute path to where the `PROJECT_NAME` package is on disk

    Returns
    -------
    str
    """

    # For an interactive shell, __file__ won't be defined for this module, so use the constants module instead
    reference_file = os.path.realpath(const.__file__)

    package_path = os.path.dirname(reference_file)

    return package_path
