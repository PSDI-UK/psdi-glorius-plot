#!/bin/bash

# This script handles copying Node-installed packages into the `static/js/packages` directory. This allows packages to
# be installable (and monitored for updates) by `npm` and also be deployed by Flask and thus accessible within the
# deployment

SCRIPTS_DIR=$(dirname -- $(readlink -f $BASH_SOURCE))
PYPACKAGE_DIR=$SCRIPTS_DIR/../psdi_glorius_plot
MODULES_DIR=$PYPACKAGE_DIR/node_modules
JSPACKAGE_DIR=$PYPACKAGE_DIR/static/js/packages

mkdir -p JSPACKAGE_DIR
for file in \
    bootstrap/dist/js/bootstrap.bundle.min.js \
    chart.js/dist/chart.umd.js \
    vanilla-cookieconsent/dist/cookieconsent.umd.js \
    jquery/dist/jquery.min.js \
    @popperjs/core/dist/umd/popper.min.js
do
    cp $MODULES_DIR/$file $JSPACKAGE_DIR
done