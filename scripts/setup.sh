#!/usr/bin/env bash

echo "Set SKIP_IIIF to something to disable generation of IIIF derivates"

if [ -z "$SKIP_IIIF" ] ; then
    ./scripts/iiif.sh
fi

rm -f 'themes/projektemacher-base/patches/mirador+3.0.0.patch'

#NPM dependencies
echo "Calling theme scripts"
for SCRIPT in $PWD/themes/projektemacher-base/scripts/init/*.sh ; do
    echo "Running $SCRIPT"
    bash "$SCRIPT"
done

yarn run svgo
convert static/images/logo.svg -resize 256x256 -transparent white static/images/logo.png

SOURCE="static/images/logo.png" OPTIONS="-resize 128x128 -transparent white" ./themes/projektemacher-base/scripts/favicon.sh
