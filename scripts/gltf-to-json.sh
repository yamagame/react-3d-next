#!/bin/bash
#
# gltf をパースしてシーンのJSONデータを作成する
# ./scripts/gltf-to-json.sh ./assets/gltf/cubes.gltf
#

CWD=`pwd`
BASEDIR=`dirname $1`
FILENAME=$(basename -- $1)
BASENAME="${FILENAME%.*}"
node tools/gltf2json/index.mjs $1 | tee ./work/$BASENAME.json
jq -s 'add' ./assets/json/$BASENAME.json ./work/$BASENAME.json > ./app/scenes/$BASENAME.json
cp ./assets/glb/$BASENAME.glb ./public
