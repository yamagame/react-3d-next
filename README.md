# 電通大3Dマップ 開発リポジトリ

## ビルド方法

```sh
# node_modulesのインストール(node_modulesがないまたはモジュールの更新があった場合に実施)
yarn install

# 開発モードで起動
yarn dev

# ブラウザで開く
open http://localhost:3000
```

```sh
# デプロイ用のファイルを生成、outディレクトリに作成される
yarn build

# outディレクトリを再作成する場合は以下のコマンドで削除してビルドする
yarn rebuild
```

outディレクトリの動作確認は下記

```sh
# 開発用サーバーを起動
yarn serve

# ブラウザで開く
open http://localhost:3000/about/profile/access/map/
```

## 3Dモデルの更新

以下のファイルを更新する

- assets/glb/uec-all.glb
- assets/gltf/uec-all.bin
- assets/gltf/uec-all.gltf

必要あれば下記ファイルも更新する

- assets/json/uec-all.json

下記のスクリプトでデータの生成とコピーを行う

```sh
./scripts/gltf-to-json.sh ./assets/gltf/uec-all.gltf
```

## 3Dモデルバージョンの更新

バージョンは次のような表記、
スラッシュの前のバージョンがモデルバージョン、スラッシュの後の数字がビルドバージョンとする。
マップデータを更新した場合はモデルバージョンを上げること。

- Ver.0.1.1/241126

モデルバージョンは下記スクリプトを使用して変更する。

```sh
$ ./scripts/update-model-version.sh 
現在のバージョン
{
  "version": "0.1.0"
}
新しいバージョンを入力してください> 0.1.1
バージョンを変更しました。
{
  "version": "0.1.1"
}
```

## 電通大ホームページへデプロイ

電通大ホームページは AWS S3 を使用している。下記パスにファイルをコピーすると電通大ホームページに公開される。

- URL: https://d3ctc1v6gkh7de.cloudfront.net/about/profile/access/map/
- 有効パス: s3://pri2024-prd-bucket-www-uec-ac-jp-public/about/profile/access/map/*
- アクセスキーとシークレットキーは別途支給

### アクセスキーとシークレットキーの設定

**アクセスキーとシークレットキーは git にコミットしないように！**

下記は、uec-s3-production プロファイルに割り当てる例

```shell
# 設定内容の確認、未設定状態
aws configure list --profile uec-s3-production
      Name                    Value             Type    Location
      ----                    -----             ----    --------
   profile        uec-s3-production           manual    --profile

The config profile (uec-s3-production) could not be found

# アクセスキーとシークレットキーを uec-s3-production プロファイルに割り当て
aws configure --profile uec-s3-production
AWS Access Key ID [None]: アクセスキーを入力
AWS Secret Access Key [None]: シークレットキーを入力
Default region name [None]: 
Default output format [None]: 

# 設定内容の確認
$ aws configure list --profile uec-s3-production
      Name                    Value             Type    Location
      ----                    -----             ----    --------
   profile        uec-s3-production           manual    --profile
access_key     ****************???? shared-credentials-file    
secret_key     ****************???? shared-credentials-file    
    region                <not set>             None    None
```

通常、設定情報は ~/.aws/credentials に保存される。

```shell
cat ~/.aws/credentials
[uec-s3-production]
aws_access_key_id = ****************????
aws_secret_access_key = ****************????
```

### s3へのアップロード

ビルドしたファイル一式を aws s3 コマンドでコピーする。

```shell
# 3Sのバケットを環境変数に設定
export UEC3DDIR=s3://pri2024-prd-bucket-www-uec-ac-jp-public

# フォルダの同期の確認
aws s3 sync --profile uec-s3-production --delete --dryrun --exclude '.DS_Store' out/about/profile/access/map/ $UEC3DDIR/about/profile/access/map/

# フォルダの同期
aws s3 sync --profile uec-s3-production --delete --exclude '.DS_Store' out/about/profile/access/map/ $UEC3DDIR/about/profile/access/map/
```

### その他のS3コマンド例

```shell
# フォルダのコピー
aws s3 cp --profile --recursive --dryrun --exclude '.DS_Store' uec-s3-production out/about/profile/access/map/ $UEC3DDIR/about/profile/access/map/

# ファイルの一覧
aws s3 ls --profile uec-s3-production --recursive $UEC3DDIR/about/profile/access/map/

# ファイルのダウンロード
aws s3 cp --profile uec-s3-production --recursive $UEC3DDIR/about/profile/access/map/ ./private/

# ファイルの削除
aws s3 rm --profile uec-s3-production $UEC3DDIR/about/profile/access/map/cubes.glb
```
