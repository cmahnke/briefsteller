Briefsteller
============

# Setup for local (offline) development

Run the following script to generate assets

```
./scripts/setup.sh
```

# Creating clean derivates from source folder

## Batch conversion

```
find . -name '*.tif' -depth 1 -print -exec tiff2rgba {} {}-uc.tif \;
find . -name '*-uc.tif' -depth 1 -print -exec convert {} -quality 95 {}.jpg \;
find . -name '*-uc.tif' -print -exec rm "{}" \;
find . -name '*.tif.jpg' -print -exec bash -c 'mv "{}"  $(dirname "{}")/$(basename -s .tif-uc.tif.jpg "{}").jpg' \;
```

Use `depth` to exclude original images.

# Generating Tiles

We start to use [LibVIPS]https://github.com/libvips/libvips(), since it's very fast:

On Mac OS X just run:

```
brew install vips
```

## Generate tiles for a single file

```
vips dzsave front.jpg front -t 512 --layout iiif --id '.'
```

## Generating tiles for IIIF Presentation API

```
URL_PREFIX=http://localhost:1313/ ./scripts/iiif.sh
```

## Remove generated IIIF directories

```
find content/post/ -name info.json -exec dirname {} \; | xargs rm -r
```

# Running hugo

## With writing files to disk and watching

```
/usr/local/bin/hugo server -D --debug --disableFastRender --renderToDisk
```

## Without watching

This might be needed if there are to many sub directories (with IIIF structures) generated, since watching might not work in this setup.
This stopped to work reliably between Hugo 0.79.0 and 0.81.0

```
hugo serve -F --debug --disableFastRender  --disableLiveReload --watch=false --renderToDisk
```
