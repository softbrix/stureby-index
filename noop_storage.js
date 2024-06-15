function noop() {}

/**
This storage can be used for in memory index. Nothing will be persisted and can
not be restored when the process ends.
*/
module.exports = function(pathToUse) {
  return {
    clearBlock : noop, 
    readBlock : noop,
    writeMasterBlock : noop,
    readMasterBlock : noop,
    writeBlock : noop
  };
};
