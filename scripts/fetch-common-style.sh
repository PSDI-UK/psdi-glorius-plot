#!/bin/bash

# Source the configuration file to get settings in its envvars, if it exists
ROOTDIR=$(dirname -- $(readlink -f $BASH_SOURCE))

CONF_FILE=$ROOTDIR/fetch-common-style.conf
if [ -f $CONF_FILE ]; then
    echo "Sourcing configuration from $CONF_FILE"
    source $CONF_FILE
else
    echo "No configuration file found at $CONF_FILE; configuration will be controlled by environmental variables"
fi

PACKAGE_FILENAME=$ROOTDIR/psdi-assets.tar.gz

# Check if the file already exists

if [ -f $PACKAGE_FILENAME ]; then
    echo "Assets are already available at $PACKAGE_FILENAME"
else
    # If ASSET_VER is not set, download the latest release
    if [ -z $ASSET_VER ]; then
        # Code snippet courtesy of
        # https://geraldonit.com/2019/01/15/how-to-download-the-latest-github-repo-release-via-command-line/
        LOCATION=$(curl -s https://api.github.com/repos/psdi-uk/psdi-common-style/releases/latest \
        | grep "tag_name" \
        | awk '{print "https://github.com/psdi-uk/psdi-common-style/archive/" substr($2, 2, length($2)-3) ".tar.gz"}');
    else
        LOCATION="https://github.com/psdi-uk/psdi-common-style/archive/"$ASSET_VER".tar.gz"
    fi

    echo "Downloading assets from $LOCATION"
    curl -L -o $PACKAGE_FILENAME $LOCATION
fi

# Get the directory name within the archive
ASSET_SUBDIR=`tar tf $PACKAGE_FILENAME | head -n 1`
ASSET_DIR=$ROOTDIR/$ASSET_SUBDIR

if [ -d $ASSET_DIR ]; then
    echo "Asset directory $ASSET_DIR already exists"
else
    echo "Extracting assets to $ASSET_DIR"
    cd $ROOTDIR
    tar xf $PACKAGE_FILENAME
    cd -
fi

# Clean up the tarball if cleanup is enabled
if [ "$CLEAN_UP_ASSETS" = "true" ]; then
    rm $PACKAGE_FILENAME
fi

if [ "$FETCH_ONLY" = "true" ]; then
    echo "FETCH_ONLY is set to 'true', so assets won't be copied. They're available in the following directory:"
    echo $ASSET_DIR
else
    echo "Copying assets to configured locations"
    $ASSET_DIR/scripts/copy_all.sh
    
    # Clean up the extracted assets if cleanup is enabled
    if [ "$CLEAN_UP_ASSETS" = "true" ]; then
        rm -r $ASSET_DIR
    else
        # If we don't clean up assets, create a script to clean up copied files
        CLEANUP_SCRIPT=$ROOTDIR/cleanup-common-style.sh
        echo "#!/bin/bash" > $CLEANUP_SCRIPT
        echo "" >> $CLEANUP_SCRIPT
        echo "# Generated script to clean copied style assets" >> $CLEANUP_SCRIPT
        echo "" >> $CLEANUP_SCRIPT
        echo "source $ROOTDIR/fetch-common-style.conf" >> $CLEANUP_SCRIPT
        echo "$ASSET_DIR/scripts/clear_all.sh" >> $CLEANUP_SCRIPT
        chmod +x $CLEANUP_SCRIPT
    fi
fi

# Create a script to purge downloaded assets if cleanup is not enabled
if [ "$CLEAN_UP_ASSETS" != "true" ]; then

    PURGE_SCRIPT=$ROOTDIR/purge-common-style.sh
    echo "#!/bin/bash" > $PURGE_SCRIPT
    echo "" >> $PURGE_SCRIPT
    echo "# Generated script to clean up copied style assets, downloaded files, and created scripts" >> $PURGE_SCRIPT
    echo "" >> $PURGE_SCRIPT

    if [ -f $CLEANUP_SCRIPT ]; then
        echo "# Run the cleanup script first" >> $PURGE_SCRIPT
        echo $CLEANUP_SCRIPT >> $PURGE_SCRIPT
        echo "" >> $PURGE_SCRIPT
    fi

    echo "rm $PACKAGE_FILENAME" >> $PURGE_SCRIPT
    echo "rm -r $ASSET_DIR" >> $PURGE_SCRIPT
    echo "" >> $PURGE_SCRIPT

    echo "# Delete cleanup script (if present) and self" >> $PURGE_SCRIPT
    if [ -f $CLEANUP_SCRIPT ]; then
        echo "rm $CLEANUP_SCRIPT" >> $PURGE_SCRIPT
    fi
    echo "rm $PURGE_SCRIPT" >> $PURGE_SCRIPT

    chmod +x $PURGE_SCRIPT
fi