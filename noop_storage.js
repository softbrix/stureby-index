
var _ = require('underscore');

/**
This storage can be used for in memory index. Nothing will be persisted and can
not be restored when the process ends.
*/
module.exports = function(pathToUse) {
  return {
    readBlock : _.noop,
    writeMasterBlock : _.noop,
    readMasterBlock : _.noop,
    writeBlock : _.noop
  };
};
