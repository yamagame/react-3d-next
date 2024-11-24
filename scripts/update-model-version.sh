#!/bin/bash
VERSIONFILE=./app/model-info.json
JQPATH=`which jq`

if [ "$JQPATH" == "" ]; then
  echo jq コマンドが見つかりませんでした。
  echo "こちらからインストールしてください。 https://jqlang.github.io/jq/download/"
  exit -1
fi

echo 現在のバージョン
cat $VERSIONFILE | jq
read -p "新しいバージョンを入力してください> " VERSION

if [ "$VERSION" != "" ]; then
  echo バージョンを変更しました。
  tmpfile=$(mktemp)
  cat $VERSIONFILE | jq '.version = "'${VERSION}'"' > $tmpfile
  mv $tmpfile $VERSIONFILE
  cat $VERSIONFILE | jq
  exit 0
fi

echo バージョンを変更しませんでした。
