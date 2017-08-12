var assert = require('assert');
var _ = require('underscore');
var shIndex = require('../index.js');

/**
Backwards compability test for old and current version

Create new version by renaming the vx_data folder after the tests has run
**/
describe('Shatabang Index', function() {
  ['./test/v1_data', './test/v2_data'].forEach(idxPath => {
    const idx = shIndex(idxPath);

    describe(idxPath, () => {
      it('should return empty array for unknown key', function() {
        assert.deepEqual([], idx.get('aaa'));
        assert.deepEqual([], idx.search('aaa'));
      });

      it('should handle get with different keys', () => {
        assert.equal(5, idx.keys().length);

        assert.deepEqual(['the beste1'], idx.get('as'));
        assert.deepEqual(['the beste3'], idx.get('asas'));
        assert.deepEqual(['the beste4'], idx.get('asasas'));
      });

      it('should handle wide search in different keys', () => {
        assert.equal(2, idx.search('asas').length);
      });

      it('should handle put with same key', () => {
        const KEY = 'asa';
        const VAL1 = 'the beste1';
        const VAL2 = 'the beste2';
        const VAL3 = 'the beste3';

        assert.deepEqual([VAL2, VAL1, VAL3], idx.get(KEY));
      });

      it('should handle put with complex key', () => {
        const KEY = '*$HDv>J7{$}s&N*+Gm=sZ@+9E!W:L)!ZhT)?SofkHM^{YKE&FTADDFRErY%YDvfprAd-)[DWp6/u$9+@zFJ%1xLq{gBz+/cx(4D]H<ixour7fiuT[.AHJcZgurQAf';
        const VAL1 = 'val1';

        assert.deepEqual([VAL1], idx.get(KEY));
      });
    });
  });
});
