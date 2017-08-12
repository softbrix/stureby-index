"use strict"
/**
This file describes the index module for the keyword store and lookup

The index stores all information to the file system.
*/

var _ = require('underscore');
var fs = require('fs-extra');
var path = require('path');
var touch = require("touch");
var StringSet = require("stringset");
var StringMap = require("stringmap");

const IDX_VERSION = 2;
const MASTER_KEY_FILE_NAME = '__allKeys';
const DEFAULT_ENCODING = 'utf8';
const CHARS='abcdefghijklmnopqrstuvwxyz';

var touchFile = function(filepath) {
  var dirpath = path.dirname(filepath);
  try {
    fs.accessSync(dirpath, fs.F_OK);
  } catch(err) {
    fs.mkdirpSync(dirpath);
  }
  touch.sync(filepath);
};

/**
Read the index items from the file
**/
var readFile = function(fileName) {
  try {
    var idx = {};
    var data = fs.readFileSync(fileName, DEFAULT_ENCODING);
    if(_.isEmpty(data)) {
      return idx;
    }
    var parsed = JSON.parse(data);
    _.each(parsed, function(list, key) {
      list.forEach(function(value) {
        addValue(idx, key, value);
      });
    });
    return idx;
  } catch(err) {
    //console.log(err);
    return {};
  }
};

var addValue = function(idx, key, value) {
  if(_.isUndefined(idx[key])) {
    idx[key] = new StringSet();
  }
  idx[key].add(value);
};

module.exports = function(pathToUse) {

  var getFileFromIndex = function(idx) {
    return path.join(pathToUse, CHARS.charAt(idx-1));
  };

  var getIndexForId = function(id) {
    var i = (id % CHARS.length) + 1;
    if(_.isUndefined(_idx[i])) {
      _idx[i] = readFile(getFileFromIndex(i));
    }
    return _idx[i];
  };

  var getMasterKeyFile = function() {
    var fileName = path.join(pathToUse, MASTER_KEY_FILE_NAME);
    touchFile(fileName);
    return fileName;
  };

  // Initialize the keys index
  var _idx = [new StringMap()],
  _keys = _idx[0],
  _counter = 1;

  // Load old master key file
  var data = fs.readFileSync(getMasterKeyFile(), DEFAULT_ENCODING);
  if(!_.isEmpty(data)) {
    var parsed = JSON.parse(data);
    if(_.isUndefined(parsed.version)) {
      // Version 1
      parsed.forEach(function(itm) {
        _keys.set(itm, _counter++);
      });
      _.times(CHARS.length, (i) => {
        var oldIndex = readFile(getFileFromIndex(i));
        _.each(oldIndex, function(keySet, key) {
          var id = _keys.get(key);

          var idx = getIndexForId(id);
          keySet.items().forEach(value => addValue(idx, id, value));
        });
      })

    } else {
      // Version 2
      parsed.items.forEach(function(itm) {
        _keys.set(itm[0], itm[1]);
      });
    }
  }

  var writeMasterFile = function(list, fileName) {
    touchFile(fileName);
    return fs.writeFile(fileName, JSON.stringify({version: IDX_VERSION, items: list}));
  };

  var writeFile = function(list, fileName) {
    touchFile(fileName);
    return fs.writeFile(fileName, JSON.stringify(list));
  };

  var getIndexAsList = function(index) {
    var list = {};
    _.each(index, function(keySet, key) {
      this[key] = keySet.items();
    }, list);
    return list;
  };

  var flush = function() {
    writeMasterFile(_keys.items(), getMasterKeyFile());
    _.times(CHARS.length, function(i) {
      ++i;
      if(_.isEmpty(_idx[i])) {
        return;
      }
      writeFile(getIndexAsList(_idx[i]), getFileFromIndex(i));
    });
  };

  var throttled_flush = _.throttle(flush, 5000);

  return {
    /**
    Expects a key string and value string as parameters. These will be added to
    the internal index
    */
    put : function(key, value) {
      if(!_.isString(key) || !_.isString(value) ||
        key.length === 0 || value.length === 0) {
        return;
      }

      var id = _keys.get(key);
      if(id === undefined) {
        id = _counter++;
        _keys.set(key, id);
      }

      var idx = getIndexForId(id);
      addValue(idx, id, value);
      throttled_flush();
    },
    /**
     Return all items for the matching key
     */
    get : function(key) {
      if(_.isString(key) && key.length >= 0 ) {
        var id = _keys.get(key);
        if(!_.isUndefined(id)) {
          var idx = getIndexForId(id);
          if(!_.isUndefined(idx[id])) {
            return idx[id].items();
          }
        }
      }
      return [];
    },
    /**
    Search for matching keys.
    Only a list of keys is returned which then can be used to lookup the values.
    **/
    search : function(searchStr) {
      var keys = _idx[0].keys();
      return _.filter(keys, function(item){ return item.indexOf(searchStr) >= 0; });
    },
    /**
    The list of stored keys
    */
    keys : function() {
      return _idx[0].keys();
    },
    /**
    The flush method is internal and should not be called externally
    **/
    flush: function(force) {
      if(force) {
        return flush();
      } else {
        return throttled_flush();
      }
    }
  };
};
