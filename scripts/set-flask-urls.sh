#!/bin/bash

# Look through all .html files in the static/html directory, and for any urls with the "URL_FOR:" prefix, replace the
# URL with a properly wrapped "url_for" command for Flask

for filename in $TARGET_HTML_DIR/*.html; do
    [ -e "$filename" ] || continue
    
    REPLACE_CMD='sed -i -E -e "s/URL_FOR:\/(\S+?)\"/{{url_for\('\''static'\'', filename='\''img\/\1'\'')}}\"/g" '$filename
    eval $REPLACE_CMD
done