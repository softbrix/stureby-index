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
var fileStorage = require("./file_storage");

const IDX_VERSION = 2;
const CHARS='abcdefghijklmnopqrstuvwxyz';

var addValue = function(idx, key, value) {
  if(_.isUndefined(idx[key])) {
    idx[key] = new StringSet();
  }
  idx[key].add(value);
};

module.exports = function(pathToUse) {

  var storage = fileStorage(pathToUse);

  /**
  Read the index items from the block
  **/
  var readBlock = function(blockName) {
    try {
      var idx = {};
      var block = storage.readBlock(blockName);
      _.each(block, function(list, key) {
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

  var getBlockFromIndex = function(idx) {
    return CHARS.charAt(idx-1);
  };

  var getIndexForId = function(id) {
    var i = (id % CHARS.length) + 1;
    if(_.isUndefined(_idx[i])) {
      _idx[i] = readBlock(getBlockFromIndex(i));
    }
    return _idx[i];
  };

  // Initialize the keys index
  var _idx = [new StringMap()],
  _keys = _idx[0],
  _counter = 1;

  // Load old master key block
  var parsed = storage.readMasterBlock();
  if(!_.isUndefined(parsed)) {
    if(_.isUndefined(parsed.version)) {
      // Version 1
      parsed.forEach(function(itm) {
        _keys.set(itm, _counter++);
      });
      _.times(CHARS.length, (i) => {
        var oldIndex = readBlock(getBlockFromIndex(i));
        _.each(oldIndex, function(keySet, key) {
          var id = _keys.get(key);

          var idx = getIndexForId(id);
          keySet.items().forEach(value => addValue(idx, id, value));
        });
      });
    } else {
      // Version 2
      parsed.items.forEach(function(itm) {
        _keys.set(itm[0], itm[1]);
      });
    }
  }

  var getIndexAsList = function(index) {
    var list = {};
    _.each(index, function(keySet, key) {
      this[key] = keySet.items();
    }, list);
    return list;
  };

  var flush = function() {
    storage.writeMasterBlock(_keys.items(), IDX_VERSION);
    _.times(CHARS.length, function(i) {
      ++i;
      if(_.isEmpty(_idx[i])) {
        return;
      }
      storage.writeBlock(getIndexAsList(_idx[i]), getBlockFromIndex(i));
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
