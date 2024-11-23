# 電通大3Dマップ 開発リポジトリ

## 電通大ホームページのステージング

電通大ホームページのステージングは AWS S3 を使用している。

- URL: https://d3ctc1v6gkh7de.cloudfront.net/about/profile/access/map/
- 有効パス: s3://pri2024-prd-bucket-www-uec-ac-jp-public/about/profile/access/map/*
- アクセスキーとシークレットキーは別途支給

### アクセスキーとシークレットキーの設定

下記は、uec-s3-staging プロファイルに割り当てる例

```shell
# 設定内容の確認、未設定状態
aws configure list --profile uec-s3-staging
      Name                    Value             Type    Location
      ----                    -----             ----    --------
   profile           uec-s3-staging           manual    --profile

The config profile (uec-s3-staging) could not be found

# アクセスキーとシークレットキーを uec-s3-staging プロファイルに割り当て
aws configure --profile uec-s3-staging
AWS Access Key ID [None]: アクセスキーを入力
AWS Secret Access Key [None]: シークレットキーを入力
Default region name [None]: 
Default output format [None]: 

# 設定内容の確認
$ aws configure list --profile uec-s3-staging
      Name                    Value             Type    Location
      ----                    -----             ----    --------
   profile           uec-s3-staging           manual    --profile
access_key     ****************???? shared-credentials-file    
secret_key     ****************???? shared-credentials-file    
    region                <not set>             None    None
```

### s3へのアップロード

ビルドしたファイル一式を aws s3 cp コマンドでコピーする。

```shell
# 3Sのバケットを環境変数に設定
export UEC3DDIR=s3://pri2024-prd-bucket-www-uec-ac-jp-public

# フォルダのコピー
aws s3 cp --profile uec-s3-staging out $UEC3DDIR --recursive --dryrun
```

### その他のS3コマンド例

```shell
# フォルダの同期
aws s3 sync --profile uec-s3-staging out $UEC3DDIR

# ファイルの一覧
aws s3 ls --profile uec-s3-staging $UEC3DDIR/about/profile/access/map/

# ファイルの削除
aws s3 rm --profile uec-s3-staging $UEC3DDIR/about/profile/access/map/cubes.glb
```
