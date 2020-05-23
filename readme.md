magic-pot
====

RPGツクール2000用に、256色PNG画像のパレット順序を調整するツールです

## Description

256色PNG画像を読み込み、透過色があれば、その色をパレットの一番最初に移動します。  
該当色が無い場合、何もしません。

### 透明色の指定について

後述の設定ファイルにて、指定可能です。  
設定が無い場合、rgb(0, 255, 0)になります。

## Install

### 準備

下記3点を事前にインストールしておく。

* node.js
* git
* ImageMagick

### インストール

```
npm install -g lpre-ys/magic-pot
```

適当なフォルダで、```magic-pot```と叩き、"magic-pot.config.js"が見つからない、というようなエラーメッセージが出れば、インストール成功です。

```
$ magic-pot
internal/modules/cjs/loader.js:797
    throw err;
    ^

Error: Cannot find module '/mnt/c/Users/****/magic-pot.config.js'
Require stack:
(略)
```

## Usage

下記の設定ファイルを作成し、作業フォルダに置いてください。  
ファイルパスは、設定ファイルからの相対パスで構いません。

ファイル名: magic-pot.config.js
```
module.exports = {
  'pictureDir': './orig/',  // 画像読み込み元
  'outputDir': '../tkool/test/Picture/',  // 画像配置先
  'tmpDir': './tmp/', // 作業用フォルダ
  'transparentColor': [0, 255, 0],  // 透過色。RGBの順。
  'md5File': './magic-pot-md5.json',  // ファイルのハッシュをメモするファイル。変更なしで構いません。
  'imagickCmd': 'magick'  // ImageMagick実行コマンド
};
```

各行、 // から先はコメントなので、書かなくてもよいです。

フォルダ（読み込み元、出力先、作業用）については、事前に作成しておいてください。


出力先は、直でツクールのプロジェクトのPictureフォルダを指定しても構いません。  
※もちろん、上書きしていくので、自己責任でどうぞ。

'imagickCmd'ですが、普通なら、このまま変更なしで動くと思います。Linux環境で、ImageMagickのV6系を使っている等、ImageMagickの実行コマンドが異なる場合、こちらを書き換えてください。


設定ファイルの用意が終わったら、作業フォルダで下記コマンドを実行してください。  
INIT-STARTという文字の後、出力した画像のパスが表示されます。

```
$ magic-pot
INIT-START
C:\*****\test\Picture\test1.png
C:\*****\test\Picture\test2.png
C:\*****\test\Picture\test3.png
......
```

2回目以降の実行時、前回から変更の無い画像は変換を行いません。  
全ファイル、再変換を行いたい場合、設定ファイルの"md5File"が示すファイルを削除してください。
