"""
# env.py

This module handles setting up and storing the state of the environment for the website, e.g. environmental variables
"""

import os
import sys
from argparse import Namespace
from subprocess import run
from traceback import format_exc
from typing import TypeVar

from PROJECT_NAME import constants as const
from PROJECT_NAME import log_utility


class SiteEnv:
    def __init__(self, args: Namespace | None = None):

        self._args = args
        """The parsed arguments provided to the script to start the server"""

        self.log_level: str = self._determine_log_level()
        """The logging level"""

        self.service_mode: bool = self._determine_value(ev=const.SERVICE_MODE_EV,
                                                        arg="service_mode",
                                                        value_type=bool,
                                                        default=False)
        """True if the app is running in service mode, False if it's running in local mode"""

        self.production_mode: bool = self._determine_value(ev=const.PRODUCTION_EV,
                                                           arg="!dev_mode",
                                                           value_type=bool,
                                                           default=False)
        """True if the app is running in production mode, False if it's running in developmennt mode"""

        self.debug_mode: bool = self._determine_value(ev=const.DEBUG_EV,
                                                      arg="debug",
                                                      value_type=bool,
                                                      default=False)
        """True if the app is running in debug mode, False if not"""

        tag, sha = self._determine_tag_and_sha()

        self.tag: str = tag
        """The latest tag in the repo"""

        self.sha: str = sha
        """The SHA of the latest commit, if the latest commit isn't tagged, otherwise an empty string"""

        self._kwargs: dict[str, str] | None = None
        """Cached value for dict containing all env values"""

    @property
    def kwargs(self) -> dict[str, str]:
        """Get a dict which can be used to provide kwargs for rendering a template"""
        if not self._kwargs:
            self._kwargs = {}
            for key, val in self.__dict__.items():
                if not key.startswith("_"):
                    self._kwargs[key] = val
        return self._kwargs

    def _determine_log_level(self) -> str | None:
        """Determine the log level from args and environmental variables, preferring the former"""
        if self._args:
            return self._args.log_level

        ev_log_level = os.environ.get(const.LOG_LEVEL_EV)
        if ev_log_level is None:
            return None

        return log_utility.get_log_level_from_str(ev_log_level)

    T = TypeVar('T')

    def _determine_value(self,
                         ev: str,
                         arg: str | None = None,
                         value_type: type[T] = float,
                         default: T = None) -> T | None:
        """Determine a value using input arguments (preferred if present) and environmental variables"""
        if self._args and arg:
            # Special handling for bool, which allows flipping the value of an arg
            if value_type is bool and arg.startswith("!"):
                return not getattr(self._args, arg[1:])
            return getattr(self._args, arg)

        ev_value = os.environ.get(ev)
        if not ev_value:
            return default

        # Special handling for bool, to properly parse strings into bools
        if value_type is bool:
            return ev_value.lower().startswith("t")

        return value_type(ev_value)

    def _determine_tag_and_sha(self) -> tuple[str, str]:
        """Get latest tag and SHA of latest commit, if the latest commit differs from the latest tagged commit
        """

        # Get the tag of the latest commit
        ev_tag = os.environ.get(const.TAG_EV)
        if ev_tag:
            tag = ev_tag
        else:
            try:
                # This bash command calls `git tag` to get a sorted list of tags, with the most recent at the top, then
                # uses `head` to trim it to one line
                cmd = "git tag --sort -version:refname | head -n 1"

                out_bytes = run(cmd, shell=True, capture_output=True).stdout
                tag = str(out_bytes.decode()).strip()

            except Exception:
                # Failsafe exception block, since this is reasonably likely to occur (e.g. due to a shallow fetch of the
                # repo, and we don't want to crash the whole app because of it)
                print("ERROR: Could not determine most recent tag. Error was:\n" + format_exc(),
                      file=sys.stderr)
                tag = ""

        # Get the SHA associated with this tag
        ev_tag_sha = os.environ.get(const.TAG_SHA_EV)
        if ev_tag_sha:
            tag_sha: str | None = ev_tag_sha
        else:
            try:
                cmd = f"git show {tag}" + " | head -n 1 | gawk '{print($2)}'"

                out_bytes = run(cmd, shell=True, capture_output=True).stdout
                tag_sha = str(out_bytes.decode()).strip()

            except Exception:
                # Another failsafe block, same reason as before
                print("ERROR: Could not determine SHA for most recent tag. Error was:\n" + format_exc(),
                      file=sys.stderr)
                tag_sha = None

        # First check if the SHA is provided through an environmental variable
        ev_sha = os.environ.get(const.SHA_EV)
        if ev_sha:
            sha = ev_sha
        else:
            try:
                # This bash command calls `git log` to get info on the last commit, uses `head` to trim it to one line,
                # then uses `gawk` to get just the second word of this line, which is the SHA of this commit
                cmd = "git log -n 1 | head -n 1 | gawk '{print($2)}'"

                out_bytes = run(cmd, shell=True, capture_output=True).stdout
                sha = str(out_bytes.decode()).strip()

            except Exception:
                # Another failsafe block, same reason as before
                print("ERROR: Could not determine SHA of most recent commit. Error was:\n" + format_exc(),
                      file=sys.stderr)
                sha = ""

        # If the SHA of the tag is the same as the current SHA, we indicate this by returning a blank SHA
        if tag_sha == sha:
            sha = ""

        return (tag, sha)


_env: SiteEnv | None = None


def get_env():
    """Get a reference to the global `SiteEnv` object, creating it if necessary.
    """
    global _env
    if not _env:
        _env = SiteEnv()
    return _env


def update_env(args: Namespace | None = None):
    """Update the global `SiteEnv` object, optionally using arguments passed at the command-line to override values
    passed through environmental variables.
    """
    global _env
    _env = SiteEnv(args)


def get_env_kwargs():
    """Get a dict of kwargs for the environment
    """

    env = get_env()

    kwargs = env.kwargs

    return kwargs
