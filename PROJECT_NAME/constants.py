"""@file PROJECT_NAME/constants.py

Miscellaneous constant values used within this project.

These values are stored as constants rather than hardcoded literals for various reasons, including:
- Better assurance of consistency that the same value is used every time
- If a value needs to be changed, this only needs to be done at one location
- Compatibility with IDE features - a constant can be checked for validity by an IDE, while e.g. a string key for a dict
  can't, allowing more errors to be caught and fixed by the IDE rather than at runtime
- The use of a constant may improve readability - e.g. `MEGABYTE = 1024*1024; max_file_size = 1*MEGABYTE` is more
  readable than `max_file_size = 1*1024*1024`, and so doesn't require a comment like the latter would

There are some known drawbacks to this approach which need to be considered though:
- Constants may obscure readability - it may be quite relevant to the reader exactly what a constant represents, which
  is obscured until they (at minimum) mouse over it
- More code is necessary to use a constant than a literal (at minimum it needs an extra line to define it, and when
  stored here, it also needs a line to import it or this module)

With these drawbacks in mind, we make the following recommendations for constant use:
- Messages for the user (print/logging messages, exceptions) should by default not be stored as constants. They should
  be made constants if it's necessary to reference their exact text elsewhere (either in the executable code or unit
  tests). In this case, the name of the constant should be descriptive, even if this means a rather long name
- If a value is only used in one file and only likely to ever be used in that file, it can be defined as a constant
  there (or if used only two or three times in quick succession, left as a literal)
- Of course, deviations from this should be made when necessary, such as to avoid circular imports
"""

import shutil

# Interface
# ---------

# The name of the command-line script
CL_SCRIPT_NAME = "PROJECT_NAME_HYPHEN"

# The name of the Flask app
APP_NAME = "PROJECT_NAME"

# Environmental variables
LOG_MODE_EV = "LOG_MODE"
LOG_LEVEL_EV = "LOG_LEVEL"

SERVICE_MODE_EV = "SERVICE_MODE"
PRODUCTION_EV = "PRODUCTION_MODE"
DEBUG_EV = "DEBUG_MODE"

TAG_EV = "TAG"
TAG_SHA_EV = "TAG_SHA"
SHA_EV = "SHA"


# Logging and Formatting
# ----------------------

# Number of character spaces allocated for flags/options

# Get the terminal width so we can prettily print help text - default to 80 chars by 20 lines
TERM_WIDTH, _ = shutil.get_terminal_size((80, 20))

# Log formatting
LOG_FORMAT = r'[%(asctime)s] %(levelname)s [%(name)s.%(funcName)s:%(lineno)d] %(message)s'
TIMESTAMP_FORMAT = r"%Y-%m-%d %H:%M:%S"

# Regex to match date/time format
DATE_RE_RAW = r"\d{4}-[0-1]\d-[0-3]\d"
TIME_RE_RAW = r"[0-2]\d:[0-5]\d:[0-5]\d"
DATETIME_RE_RAW = f"{DATE_RE_RAW} {TIME_RE_RAW}"
