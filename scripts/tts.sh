#!/usr/bin/env bash

set -e -o pipefail

TTS_PREFIX=content
TTS_GLOB="-name *-tts.json"

DOCKER_IMAGE_TTS="ghcr.io/cmahnke/speech-tools:piper-models"
RUN_PREFIX='docker run -v '$(pwd)':'$(pwd)' -w '$(pwd)' -i '$DOCKER_IMAGE_TTS' '

SCRIPT=`dirname $0`/./enhance_image.py

if [ -n "$1" ] ; then
  ADDITIONAL_ARGS="$1"
else
  ADDITIONAL_ARGS=""
fi

if [ -z "$PYTHON" ] ; then
  PYTHON=python3
else
  echo "Using python command '$python'"
fi

$PYTHON scripts/md2ttsJSON.py

for JSON in `find "$TTS_PREFIX" $TTS_GLOB`
do
    echo "Processing $JSON"
    DIR=`dirname $JSON`
    cat $JSON |$RUN_PREFIX -m /opt/piper/de_DE-thorsten_emotional-medium.onnx --json-input #-f $DIR/out.wav
    for f in $DIR/*.wav; do echo "file '$f'" >> $DIR/sentences.lst; done
    #ffmpeg -i $DIR/out.wav -vn -ar 44100 -ac 2 -b:a 128k $DIR/out.mp3
done
