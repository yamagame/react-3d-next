#!/bin/bash
read -p "outディレクトリを削除しますか？ [y/N]" agree

if [ "$agree" == "y" ]; then
    rm -r ./out
    echo 削除しました
    exit 0
fi

echo 削除しませんでした。
