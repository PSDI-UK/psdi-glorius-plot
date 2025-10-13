#
# Dockerfile for image containerising PSDI Reaction Sensitivity Radar Plot Generator
#
#
# Building the image
# ------------------
#
# 1. Download the service repo containing the source code
#    from https://github.com/PSDI-UK/psdi-reaction-radar/tree/main
# 2. Copy this file into the main directory of the repo
# 3. From within the main directory of the repo, use docker to build the image
#    'psdi-reaction-radar' via the command
#    ``docker build -t psdi-reaction-radar .``
#
# To check that the image has been build run ``docker images``, which should
# list and image called 'psdi-reaction-radar'.
#
#
# Running the service
# -------------------
#
# The command ``docker run -p 8000:8000 psdi-reaction-radar`` will run the
# service on port 8000 of localhost, with logs output to stdout. To access the
# service visit http://localhost:8000 in your browser.
#

FROM python:3.14-slim-bookworm

RUN apt update
RUN apt-get -y install libxrender1 libxext6 git

# Install Python packages (including openbabel-wheel)
RUN pip install --upgrade pip

WORKDIR /app
COPY psdi_reaction_radar /app/psdi_reaction_radar
COPY CHANGELOG.md CONTRIBUTING.md LICENSE pyproject.toml README.md /app/

ENV SETUPTOOLS_SCM_PRETEND_VERSION="1.0.0"

RUN pip install .[deploy]

ENV PYTHONPATH="."
ENV SERVICE_MODE=true
ARG TAG
ENV TAG=$TAG
ARG TAG_SHA
ENV TAG_SHA=$TAG_SHA
ARG SHA
ENV SHA=$SHA

# The PRODUCTION_MODE env var hides features from the GUI that are only useful to developers, such as the SHA of the
# latest commit. This variable is injected into the container via the K8s deployment

# Set LOG_LEVEL to a desired level (e.g. "debug") to force all logging to be at that level. Leave blank for default
# behaviour (INFO+ to user log, ERROR+ to server log and stdout)

EXPOSE 8000

RUN mkdir -p /app/psdi_reaction_radar/static/uploads
RUN mkdir -p /app/psdi_reaction_radar/static/downloads

#set web server timout to more than application default (60)
ENV TIMEOUT=90

CMD ["sh", "-c", "gunicorn -b 0.0.0.0:8000 psdi_reaction_radar.app:app --timeout $TIMEOUT"]
