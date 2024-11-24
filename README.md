# 電通大3Dマップ 開発リポジトリ

## 電通大ホームページのステージング

電通大ホームページのステージングは AWS S3 を使用している。

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

ビルドしたファイル一式を aws s3 cp コマンドでコピーする。

```shell
# 3Sのバケットを環境変数に設定
export UEC3DDIR=s3://pri2024-prd-bucket-www-uec-ac-jp-public

# フォルダのコピー
aws s3 cp --profile uec-s3-production out $UEC3DDIR --recursive --dryrun
```

### その他のS3コマンド例

```shell
# フォルダの同期
aws s3 sync --profile uec-s3-production out $UEC3DDIR

# ファイルの一覧
aws s3 ls --profile uec-s3-production $UEC3DDIR/about/profile/access/map/

# ファイルの削除
aws s3 rm --profile uec-s3-production $UEC3DDIR/about/profile/access/map/cubes.glb
```
