"use strict"
/**
This file describes the index module for the keyword store and lookup

The index stores all information to the file system.
*/

var _ = require('underscore');
var fileStorage = require('./file_storage');
var noopStorage = require('./noop_storage');

const IDX_VERSION = 2;
const CHARS='abcdefghijklmnopqrstuvwxyz';

var addValue = function(idx, key, value) {
  if(_.isUndefined(idx[key])) {
    idx[key] = new Set();
  }
  idx[key].add(value);
};

var isValidKey = function(key) {
  return _.isNumber(key) || _.isString(key) && key.trim().length > 0
}

const index_cache = {};

module.exports = function(pathToUse, options) {

  if(index_cache[pathToUse] !== undefined) {
    return index_cache[pathToUse];
  }

  options = options || {};
  var storage;
  if(_.isUndefined(options.storageFactory)) {
    if(_.isUndefined(options.persist) || options.persist) {
        storage = fileStorage(pathToUse);
    } else {
      storage = noopStorage();
    }
  } else {
    storage = options.storageFactory(pathToUse);
  }
  options.flushTime = Number.isInteger(options.flushTime) ? options.flushTime : 500;

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
    return CHARS.charAt(idx);
  };

  var getIndexForId = function(id) {
    var i = (id % CHARS.length);
    if(_.isUndefined(_idx[i])) {
      _idx[i] = readBlock(getBlockFromIndex(i));
    }
    return _idx[i];
  };

  // Initialize the keys index
  var _idx = [],
  _keys = new Map(),
  _counter = 0;

  // Load old master key block
  var parsed = storage.readMasterBlock();
  if(!_.isUndefined(parsed)) {
    if(_.isUndefined(parsed.version)) {
      // Version 1
      parsed.forEach(function(itm) {
        _keys.set(itm, ++_counter);
      });
      _.times(CHARS.length, (i) => {
        var oldIndex = readBlock(getBlockFromIndex(i));
        _.each(oldIndex, function(keySet, key) {
          var id = _keys.get(key);

          var idx = getIndexForId(id);
          keySet.forEach(value => addValue(idx, id, value));
        });
      });
    } else {
      // Version 2
      parsed.items.forEach(function(itm) {
        _keys.set(itm[0], itm[1]);
      });
    }
  }
  _counter = _keys.size;

  var getIndexAsList = function(index) {
    var list = {};
    _.each(index, function(keySet, key) {
      this[key] = keySet.values();
    }, list);
    return list;
  };

  var flush = function() {
    storage.writeMasterBlock(Array.from(_keys), IDX_VERSION);
    _.times(CHARS.length, function(i) {
      const block = getBlockFromIndex(i);
      if(_.isUndefined(_idx[i])) {
        // Ignore non loaded blocks
        return;
      }
      if(_.isEmpty(_idx[i])) {
        storage.clearBlock(block);
        return;
      }
      storage.writeBlock(getIndexAsList(_idx[i]), block);
    });
  };

  var getIdFromKey = function(key) {
    if(isValidKey(key)) {
      return _keys.get(key);
    }
    return undefined;
  }

  var throttled_flush = _.throttle(flush, options.flushTime);

  index_cache[pathToUse] = {
    /** Clear the entire index */
    clear: function() {
      _keys = new Map();
      _counter = 0;
      _.times(CHARS.length, (i) => _idx[i] = {} );
      flush();
    },

    /**
    Expects a key as a non empty string or numeric non empty value string as parameters. These will be added to
    the internal index
    */
    put : function(key, value) {
      if(!isValidKey(key) || 
         !_.isString(value) || value.length === 0) {
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
      var id = getIdFromKey(key);
      if(!_.isUndefined(id)) {
        var idx = getIndexForId(id);
        if(!_.isUndefined(idx[id])) {
          return Array.from(idx[id].values());
        }
      }
      return [];
    },

    /* Delete a key */
    delete: function(key) {
      var id = getIdFromKey(key);
      if(!_.isUndefined(id)) {
        var idx = getIndexForId(id);
        if(!_.isUndefined(idx[id])) {
          delete idx[id];
        }
        _keys.delete(key);
        throttled_flush();
      }
    },

    /** Update a key is delete then put */
    update : function(key, value) {
      this.delete(key);
      this.put(key, value);
    },

    /**
    Search for matching keys.
    Only a list of keys is returned which then can be used to lookup the values.
    **/
    search : function(searchStr) {
      let filtered = [];
      _keys.forEach(function(i, key) { 
        // Sometimes the key is numeric, but should still be searchable?
        if ((''+key).indexOf(searchStr) >= 0) {
          filtered.push(key);
        }
      });
      return filtered;
    },

    /**
    The list of stored keys
    */
    keys : function() {
      let keys = [];
      let it = _keys.keys();
      let result = it.next();
      while (!result.done) {
        keys.push(result.value)
        result = it.next();
      }
      return keys;
    },

    /** Return the number of keys in the index */
    size : function() {
      return _counter;
    },
    
    /**
    The index is returned as a json object
    */
    toJSON : function() {
      var obj = {};
      _keys.forEach((_v, key) => {
        obj[key] = this.get(key);
      });
      return obj;
    },

    /**
    The flush method should be called before process exit
    **/
    flush: function(force) {
      if(force) {
        return flush();
      } else {
        return throttled_flush();
      }
    }
  };
  return index_cache[pathToUse];
};
