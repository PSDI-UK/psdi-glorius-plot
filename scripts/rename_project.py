#!/usr/bin/env python3

"""scripts/rename_project.py
============================

This script renames the project from the default "PROJECT_NAME" to a name of your choice. It can be called as:
``python project_name Human Readable Project Name``, where "project_name" is the name used within the code, e.g. as the
name of the Python package, and "Human Readable Project Name" is how it will appear in documentation, the title of the
web app, etc.

Note that the code version of the project name will be changed between underscore_separated and hyphen-separated
depending on context to match the standards of different languages and context.

Before running this script, it is recommended to commit this project to version control, so if things don't result as
desired, the changes can be undone with e.g. ``git reset --hard``.
"""

import os
import shutil
import sys
from argparse import ArgumentParser

L_EXTS_TO_MODIFY = [".conf", ".html", ".md", ".py", ".sh", ".toml", ".yml"]
"""The extensions of files that will have their contents modified to replace the project name. Files without an
extension (e.g. "Dockerfile") will also be modified, assuming that they're text files."""

L_IGNORE = [".git", ".coverage", ".vscode", ".venv", "rename_project.py"]
"""List of file/directory names to ignore (direct matches only)"""

PROJECT_NAME_PLACEHOLDER = "PROJECT_NAME"
PROJECT_NAME_HYPHEN_PLACEHOLDER = "PROJECT_NAME_HYPHEN"
PROJECT_NAME_HUMAN_PLACEHOLDER = "PROJECT_NAME_HUMAN"


def get_argument_parser():
    """Get an argument parser for this script.

    Returns
    -------
    parser : ArgumentParser
        An argument parser set up with the allowed command-line arguments for this script.
    """

    parser = ArgumentParser()

    parser.add_argument("code_name", help="The name of the project as it should appear in code, e.g. \"my_project\" "
                        "(hyphens and underscores in this will be automatically swapped as appropriate to match "
                        "context and language standards)")

    parser.add_argument("human_readable_name", type=str, nargs="+", help="The human-readable project name, with " +
                        "capitalisation and spaces as desired, e.g. \"My Project\".")

    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose output")

    return parser


def parse_args():
    """Parses arguments for this executable.

    Returns
    -------
    args : Namespace
        The parsed arguments.
    """

    parser = get_argument_parser()

    args = parser.parse_args()

    return args


def recursive_rename(base_path: str,
                     project_name: str,
                     project_name_hyphen: str,
                     project_name_human: str,
                     verbose: bool):
    """Operates on directories recursively to rename files and folders and set the project name within files
    """

    # Rename files and folders first
    for orig_name in os.listdir(base_path):

        if orig_name in L_IGNORE:
            continue

        new_name = orig_name
        for (orig_str, new_str) in ((PROJECT_NAME_HYPHEN_PLACEHOLDER, project_name_hyphen),
                                    (PROJECT_NAME_HUMAN_PLACEHOLDER, project_name_human),
                                    (PROJECT_NAME_PLACEHOLDER, project_name),):
            if orig_str in new_name:
                new_name = new_name.replace(orig_str, new_str)

        if new_name == orig_name:
            continue

        orig_full_name = os.path.join(base_path, orig_name)
        new_full_name = os.path.join(base_path, new_name)

        if verbose:
            print(f"Renaming {orig_full_name} to {new_full_name}")
        shutil.move(orig_full_name, new_full_name)

    # Now set the name wherever it appears within files, and recursively process folders
    for file_or_folder_name in os.listdir(base_path):

        if file_or_folder_name in L_IGNORE:
            continue

        full_name: str = os.path.join(base_path, file_or_folder_name)

        if os.path.isdir(full_name):
            recursive_rename(full_name, project_name,  project_name_hyphen, project_name_human,  verbose)
            continue

        # Otherwise it's a file, so check if it has an extension we want to process
        ext = os.path.splitext(full_name)[1]
        if ext and ext not in L_EXTS_TO_MODIFY:
            continue

        tmp_name = full_name + ".tmp"

        with open(full_name, "rt") as fi:
            try:
                orig_text = fi.read()
            except ValueError:
                print(f"ERROR: Cannot parse {full_name} as a text file", file=sys.stderr)
                raise

        text = orig_text
        for (orig_str, new_str) in ((PROJECT_NAME_HYPHEN_PLACEHOLDER, project_name_hyphen),
                                    (PROJECT_NAME_HUMAN_PLACEHOLDER, project_name_human),
                                    (PROJECT_NAME_PLACEHOLDER, project_name),):
            text = text.replace(orig_str, new_str)

        if text == orig_text:
            continue

        if verbose:
            print(f"Replacing project name where it occurs in the text of {full_name}")

        # Write to a temporary file, then move to the original file's name
        with open(tmp_name, "wt") as fo:
            fo.write(text)

        # Use a try-finally block to complete the move if it's interrupted midway through, except if it fails due to
        # file access permissions
        try:
            os.remove(full_name)
        except PermissionError:
            raise
        finally:
            shutil.move(tmp_name, full_name)


def main():
    """Standard entry-point function for this script.
    """

    args = parse_args()

    # Get the version of the project name with underscores and with hyphens
    project_name: str = args.code_name.replace("-", "_")
    project_name_hyphen = project_name.replace("_", "-")

    # Get the human-readable version of the project name, joining the args with spaces and stripping any surrounding
    # parentheses
    project_name_human = " ".join(args.human_readable_name)
    project_name_human = project_name_human.strip("'\"")

    verbose: bool = args.verbose

    if verbose:
        print(f"Using underscored_name: {project_name}, hyphened-name: {project_name_hyphen}, and Human Readable Name: "
              f"{project_name_human}")

    # Determine the base directory of the project
    this_file_path = os.path.split(os.path.abspath(__file__))[0]
    project_path = os.path.abspath(f"{this_file_path}/..")

    recursive_rename(project_path, project_name, project_name_hyphen, project_name_human, verbose)


if __name__ == "__main__":

    main()
