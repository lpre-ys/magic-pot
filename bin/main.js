const path = require('path');
const fs = require('fs');
const execSync = require('child_process').execSync;
const md5File = require('md5-file');
const md5 = require('md5');

const parseArgs = require('minimist');

const paletteSorter = require('../src/palette-sorter');

const args = parseArgs(process.argv);
if (!args.config) {
  args.config = 'magic-pot.config.js';
}
const configPath = path.resolve(args.config);
const config = require(configPath);
const picturePath = path.resolve(config.pictureDir);
const outputPath = path.resolve(config.outputDir);
const tmpPath = path.resolve(config.tmpDir);

const md5FilePath = path.resolve(config.md5File);
const md5List = {}
try {
  Object.assign(md5List, JSON.parse(fs.readFileSync(md5FilePath)));
} catch(err) {
  if (err.code !== 'ENOENT') {
    throw err;
  }
}

const imagick = config.imagickCmd;

console.log(`INIT-START`);

const images = [];
readdirRec(picturePath, images, /.*\.png$/);

images.filter(filterImagePath).forEach((image) => {
  const tmpFilePath = path.resolve(path.join(tmpPath, path.basename(image)));
  execSync(`${imagick} ${image} png8:${tmpFilePath}`);
  try {
    paletteSorter(tmpFilePath, getOutputPath(image));
  } catch (e) {
    console.err(e);
  }
});

fs.writeFileSync(md5FilePath, JSON.stringify(md5List));

function readdirRec(dir, list, filter = false) {
    fs.readdirSync(dir).forEach((item) => {
        var stat = fs.statSync(path.join(dir, item));
        if (stat.isFile()) {
          if (filter && !filter.test(item)) return;
          list.push(path.resolve(path.join(dir, item)));
        }
        else if (stat.isDirectory()) readdirRec(path.join(dir, item), list, filter);
    });
}

function getOutputPath(filepath) {
  const rel = path.basename(filepath);
  const outputPath = path.resolve(`${config.outputDir}${rel}`);
  console.log(outputPath);

  return outputPath;
}

function filterImagePath(path) {
  const key = md5(path);
  const fileHash = md5File.sync(path);
  if (!md5List[key] || md5List[key] !== fileHash) {
    md5List[key] = fileHash;
    return true;
  }
}
