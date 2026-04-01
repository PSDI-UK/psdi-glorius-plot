# PSDI Glorius Plot Generator

[![License Badge](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

<!-- The following line can be commented out to add a coverage badge here once a gist has been created for it. See the
tutorial at https://nedbatchelder.com/blog/202209/making_a_coverage_badge.html, and also enable the code to generate
the badge in the .github/job-test-main.yaml workflow-->

<!-- ![Coverage Badge](https://img.shields.io/endpoint?url=[GIST_URL]/covbadge.json) -->

Release date: 2025-08-18

This project provides the code for a Flask-hosted web app to generate a Glorius-style radar plot of reaction sensitivity for the user. It publishes a service to https://organic-toolkit.psdi.ac.uk/glorius-plot

For internal testing, the main branch of this project is published to https://psdi-uk.github.io/psdi-glorius-plot

## Table of Contents

- [Project Structure](#project-structure)
- [Requirements](#requirements)
  - [Python](#python)
  - [Other Dependencies](#other-dependencies)
- [Using the online app](#using-the-online-app)
- [Running the Python/Flask app locally](#running-the-pythonflask-app-locally)
  - [Installation and Setup](#installation-and-setup)
  - [Running the App](#running-the-app)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributors](#contributors)
- [Funding](#funding)

## Project Structure

- `.github`
  - `workflows`
    - (Automated workflows for various tasks related to project maintenance)
- `deploy`
  - (Files used as part of the deployment to STFC infrastructure)
- `psdi_glorius_plot` (Primary source directory)
  - `static` (Static code and assets for the web app)
    - `img`
      - (Image assets for the web app)
    - `js`
      - (JavaScript code for the web app)
    - `css`
      - (CSS stylesheets for the web app)
  - `templates`
    - (HTML assets rendered by Flask for the web app)
  - `__init.py__`
  - (Python packages, modules, and scripts)
- `scripts`
  - (Scripts used for project maintenance)
- `tests`
  - `gui`
    - (Unit tests for the GUI, aka the local version of the web app)
  - `python`
    - (Unit tests for the Python library and command-line application)
- `CHANGELOG.md` (Updates since initial public release)
- `CONTRIBUTING.md` (Guidelines and information for contributors to the project)
- `DOCKERFILE` (Dockerfile for image containerising the service)
- `LICENSE` (Apache License version 2.0)
- `pyproject.toml` (Python project metadata and settings)
- `README.md` (This file)

## Requirements

### Python

Any local installation of this project requires Python 3.11 or greater. The best way to do this is dependant on your system, and you are likely to find the best tailored instructions by searching the web for e.g. "install Python 3.11 <your-os-or-distribution>". Some standard options are:

For Windows and MacOS: Download and run the installer for the latest version from the official site: https://www.python.org/downloads/

For Linux systems, Python is most readily installed with your distribution's package manager. For Ubuntu/Debian-based systems, this is `apt`, and the following series of commands can be used to install the latest version of Python compatible with your system:

```bash
sudo apt update # Make sure the package manager has access to the latest versions of all packages
sudo apt upgrade # Update all installed packages
sudo apt install python3 # Install the latest possible version of Python
```

Check the version of Python installed with one of the following:

```bash
python --version
python3 --version
```

Usually `python` will be set up as an alias to python3, but if you already have an older version installed on your system, this might not be the case. You may be able to set this behaviour up by installing the `python-is-python3` package:

```bash
sudo apt install python-is-python3
```

Also check that this process installed Python's package manager, `pip`, on your system:

```bash
pip --version
```

If it didn't, you can manually install it with:

```bash
sudo apt install python3-pip
```

If this doesn't work, or the version installed is too low, an alternative is to install Python via the Anaconda package manager. For this, see the guide here: https://www.askpython.com/python/examples/install-python-with-conda. If you already have an earlier version of Python installed with Anaconda, you can install and activate a newer version with a command such as:

```bash
conda create --name myenv python=3.11 anaconda # Where 'myenv' is a possible conda environment name
conda activate myenv
```

You can also install a newer version of Python if you wish by substituting "3.11" in the above with e.g. "3.13".

### Other Dependencies

This project depends on other projects available via pip, which will be installed automatically as required:

Required for all installations (`pip install .`):

- `Flask`

Required to run unit tests on the backend (`pip install '.[test]'`):

- `pytest`
- `coverage`

Required to run unit tests on the web app (`pip install '.[gui-test]'`):

- (all test requirements listed above)
- `selenium`
- `webdriver_manager`

In addition to the dependencies listed above, this project uses the assets made public by PSDI's common style project at https://github.com/PSDI-UK/psdi-common-style. The latest versions of these assets are copied to this project periodically (using the scripts in the `scripts` directory). In case a future release of these assets causes a breaking change in this project, the file `fetch-common-style.conf` can be modified to set a previous fixed version to download and use until this project is updated to work with the latest version of the assets.

## Using the online app

Enter https://psdi_glorius_plot.psdi.ac.uk/ in a browser. Guidance on usage is given on each page of the website.

## Testing

To test the app, install the optional testing requirements locally (ideally within a virtual environment) and test with pytest by executing the following commands from this project's directory:

```bash
pip install '.[test]'
pytest tests/python
```

To test the local version of the web app, install the GUI testing requirements locally (which also include the standard GUI requirements and standard testing requirements), start the server, and test by executing the GUI test script:

```bash
pip install '.[gui-test]'
pytest tests/gui
```

Both of these sets of tests can also be run together if desired through:

```bash
pip install '.[gui-test]'
pytest
```

## Troubleshooting

This section presents solutions for commonly-encountered issues.

## Contributors

- Bryan Gillis (7204836+brgillis@users.noreply.github.com)
- Sally Bloodworth
- Aileen Day
- Cerys Willoughby

## Funding

PSDI acknowledges the funding support by the EPSRC grants EP/X032701/1, EP/X032663/1 and EP/W032252/1
