magic-pot
====

RPGツクール2000用に、256色PNG画像のパレット順序を調整するツールです

## Description

256色PNG画像を読み込み、rgb(0, 255, 0)の色があれば、その色をパレットの一番最初に移動します。  
該当色が無い場合、何もしません。

## Usage

下記の設定ファイルを作成して作業ディレクトリに置く  
ファイルパスは、設定ファイルからの相対パスで良い

magic-pot.config.js
```
module.exports = {
  'pictureDir': './orig/',  // 画像読み込み元
  'outputDir': '../tkool/test/Picture/',  // 画像配置先
  'tmpDir': './tmp/', // 作業用ディレクトリ
  'imagickCmd': 'magick'
};
```

作業ディレクトリにて、下記コマンドを実行
```
magic-pot
```
