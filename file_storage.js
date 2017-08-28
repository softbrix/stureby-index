
var _ = require('underscore');
var fs = require('fs-extra');
var path = require('path');
var touch = require("touch");

const MASTER_KEY_FILE_NAME = '__allKeys';
const DEFAULT_ENCODING = 'utf8';

var touchFile = function(filepath) {
  var dirpath = path.dirname(filepath);
  try {
    fs.accessSync(dirpath, fs.F_OK);
  } catch(err) {
    fs.mkdirpSync(dirpath);
  }
  touch.sync(filepath);
};

module.exports = function(pathToUse) {

  var getMasterKeyFile = function() {
    var fileName = path.join(pathToUse, MASTER_KEY_FILE_NAME);
    touchFile(fileName);
    return fileName;
  };

  var blockFileName = function(block) {
    return path.join(pathToUse, block);
  };

  return {
    clearBlock : function(block) {
      const fileName = blockFileName(block);
      fs.removeSync(fileName);
    },
    readBlock : function(block) {
      const fileName = blockFileName(block);
      var data = fs.readFileSync(fileName, DEFAULT_ENCODING);
      if(_.isEmpty(data)) {
        return {};
      }
      return JSON.parse(data);
    },
    writeMasterBlock : function(list, version) {
      const fileName = getMasterKeyFile();
      touchFile(fileName);
      return fs.writeFile(fileName, JSON.stringify({version: version, items: list}));
    },
    readMasterBlock : function() {
      var data = fs.readFileSync(getMasterKeyFile(), DEFAULT_ENCODING);
      if(!_.isEmpty(data)) {
        return JSON.parse(data);
      }
      return undefined;
    },
    writeBlock : function(list, block) {
      const fileName = blockFileName(block);
      touchFile(fileName);
      return fs.writeFile(fileName, JSON.stringify(list));
    }
  };
};
