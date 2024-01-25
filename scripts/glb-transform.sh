#!/bin/bash
#
# gltf をパースしてJSXコンポーネントを作成(未使用)
#

CWD=`pwd`
BASEDIR=`dirname $1`
FILENAME=$(basename -- $1)
BASENAME="${FILENAME%.*}"
EXTENSION="${FILENAME#*.}"
OUTPUT=$BASEDIR/
echo $BASEDIR/$FILENAME
pushd public
# glb/gltfを変換
npx gltfjsx $CWD/$1 --keepmeshes --shadows --keepnames
# jsxを移動
mkdir -p $CWD/work/models
mv *.jsx $CWD/work/models
