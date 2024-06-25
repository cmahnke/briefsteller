#!/usr/bin/env bash

set -e -o pipefail

TTS_PREFIX=content
TTS_GLOB="-name *-tts.json"

DOCKER_IMAGE_TTS="ghcr.io/cmahnke/speech-tools:piper-models"
RUN_PREFIX='docker run -v '$(pwd)':'$(pwd)' -w '$(pwd)' -i '$DOCKER_IMAGE_TTS' '

GAP_LENGTH=0.8
GAP_FILE=silence-$GAP_LENGTH.wav

if [ -n "$1" ] ; then
  ADDITIONAL_ARGS="$@"
else
  ADDITIONAL_ARGS=""
fi

if [ -z "$PYTHON" ] ; then
  PYTHON=python3
else
  echo "Using python command '$python'"
fi

$PYTHON scripts/md2ttsJSON.py $ADDITIONAL_ARGS

for JSON in `find "$TTS_PREFIX" $TTS_GLOB`
do
    echo "Processing $JSON"
    DIR=`dirname $JSON`
    cat $JSON |$RUN_PREFIX -m /opt/piper/de_DE-thorsten_emotional-medium.onnx --json-input #-f $DIR/out.wav
    ffmpeg -y -f lavfi -i anullsrc=r=44000:cl=mono -t $GAP_LENGTH $DIR/$GAP_FILE
    for f in $DIR/out_*.wav; do
      echo "file '$(basename $f)'" >> $DIR/sentences.lst
      echo "file '$GAP_FILE'" >> $DIR/sentences.lst
    done
    ffmpeg -y -f concat -i $DIR/sentences.lst -c copy $DIR/out.wav
    ffmpeg -y -i $DIR/out.wav -vn -ar 44100 -ac 2 -b:a 128k $DIR/out.mp3
    rm $DIR/out.wav $DIR/sentences.lst
    for f in $DIR/out_*.wav; do
      rm $f
    done
done
