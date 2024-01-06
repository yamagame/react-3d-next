#!/bin/bash
#
# gltf をパースしてシーンのJSONデータを作成する
#

CWD=`pwd`
BASEDIR=`dirname $1`
FILENAME=$(basename -- $1)
BASENAME="${FILENAME%.*}"
node tools/glft2json/index.mjs $1 | tee ./work/$BASENAME.json
jq -s 'add' ./assets/json/$BASENAME.json ./work/$BASENAME.json > ./app/scenes/$BASENAME.json
