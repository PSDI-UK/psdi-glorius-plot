"""@file PROJECT_NAME/logging.py

Functions and classes related to logging and other messaging for the user
"""

import logging
import re
from datetime import datetime

D_LOG_LEVELS = {"notset": logging.NOTSET,
                "debug": logging.DEBUG,
                "info": logging.INFO,
                "warn": logging.WARNING,
                "warning": logging.WARNING,
                "error": logging.ERROR,
                "critical": logging.CRITICAL,
                "fatal": logging.CRITICAL}


def get_log_level_from_str(log_level_str: str | None) -> int:
    """Gets a log level, as one of the literal ints defined in the `logging` module, from the string representation
    of it.
    """

    if not log_level_str:
        return logging.NOTSET
    try:
        return D_LOG_LEVELS[log_level_str.lower()]
    except KeyError:
        raise ValueError(f"Unrecognised logging level: '{log_level_str}'. Allowed levels are (case-insensitive): "
                         f"{list(D_LOG_LEVELS.keys())}")


def get_date():
    """Retrieve current date as a string

    Returns
    -------
    str
        Current date in the format YYYY-MM-DD
    """
    today = datetime.today()
    return str(today.year) + '-' + format_time(today.month) + '-' + format_time(today.day)


def get_time():
    """Retrieve current time as a string

    Returns
    -------
    str
        Current time in the format HH:MM:SS
    """
    today = datetime.today()
    return format_time(today.hour) + ':' + format_time(today.minute) + ':' + format_time(today.second)


def get_date_time():
    """Retrieve current date and time as a string

    Returns
    -------
    str
        Current date and time in the format YYYY-MM-DD HH:MM:SS
    """
    return get_date() + ' ' + get_time()


def format_time(time: str | int):
    """Ensure that an element of date or time (month, day, hours, minutes or seconds) always has two digits.

    Parameters
    ----------
    time : str or int
        Digit(s) indicating date or month

    Returns
    -------
    str
        2-digit value indicating date or month
    """
    num = str(time)

    if len(num) == 1:
        return '0' + num
    else:
        return num


def string_with_placeholders_matches(test_pattern: str, parent_str: str) -> bool:
    """An advanced version of "`test_pattern` in `parent_str`" for checking if a substring is in a containing string,
    which allows for `test_pattern` to contain placeholders (e.g. a string like "The file name is: {file}".).

    The test here splits `test_pattern` up into segments which exclude the placeholders, and checks that all segments
    are in `parent_string`. As such, it has the potential to return false positives in the segments are all in the
    parent string but split far apart or out of order, so this method should not be used if it is critical that false
    positives be avoided.

    Parameters
    ----------
    test_pattern : str
        The pattern to check if it's contained in `parent_str`
    parent_str : str
        The string to search in for `test_pattern`

    Returns
    -------
    bool
        True if `test_pattern` appears to be in `parent_str` with some placeholders filled in, False otherwise
    """

    l_test_segments = re.split(r"\{.*?\}", test_pattern)
    all_segments_in_parent = all([s in parent_str for s in l_test_segments])

    return all_segments_in_parent
