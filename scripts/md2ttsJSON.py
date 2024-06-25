#!/usr/bin/env python

import sys, os, pathlib, re, argparse, json
from pprint import pprint
from math import floor
from datetime import datetime
from termcolor import cprint
from markdown_it import MarkdownIt
from mdit_plain.renderer import RendererPlain
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'themes', 'projektemacher-base', 'scripts' ,'PyHugo'))
from content import Post, Content

emptyLinePattern = re.compile("^\s*$")

def processSingle(post: Post, speaker: int, out: pathlib.Path):
    global emptyLinePattern

    audio = False
    metadata = post.getMetadata()
    content = post.getContent()

    path = post.path
    description = ""
    if 'audio' in metadata:
        audio = True
    else:
        return
    cprint(f"Creating {out}", 'green')
    text = ""
    for line in content.splitlines():
        if line.endswith('-'):
            line = line[:-1]
        if emptyLinePattern.match(line):
            pass
        text += line

    parser = MarkdownIt(renderer_cls=RendererPlain)
    text = parser.render(text)

    ttsJson = {"speaker_id": speaker, "text": text}
    with open(out, 'w') as f:
        json.dump(ttsJson, f)
#{ "text": "First speaker.", "speaker_id": 0, "output_file": "/tmp/speaker_0.wav" }


def main() -> int:
    parser = argparse.ArgumentParser(prog='md2ttsJSON.py')
    parser.add_argument('--post', '-p', type=pathlib.Path, help='Path to post to process')
    parser.add_argument('--out', '-o', type=pathlib.Path, help='Path to output directory')
#    parser.add_argument('--model', '-m', type=str, help='Model')
    parser.add_argument('--speaker', '-s', type=int, help='Speaker')

    args = parser.parse_args()

    if args.post is not None:
        content = [Post(args.post)]
    else:
        content = Content()

    outDir = None
    if args.out is not None:
        outDir = args.out

#    if args.model is not None:
#        model = args.model
#    else:
#        model = None

    if args.speaker is not None:
        speaker = args.speaker
    else:
        speaker = 1


    for post in content:
        if outDir is None:
            od = post.path
        else:
            od = outDir
        out = os.path.join(od, f"{post.path.name}-tts.json")

        processSingle(post, speaker, out)

if __name__ == '__main__':
    sys.exit(main())
