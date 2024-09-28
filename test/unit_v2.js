var assert = require('assert');
var shIndex = require('../index.js');

/**
Write example data for new test case
*/
describe('Shatabang Index writer', function() {
  const idx = shIndex('./test/data_vx');

  it('should return empty array for unknown key', function() {
    assert.deepEqual([], idx.get('aaa'));
    assert.deepEqual([], idx.search('aaa'));
  });

  it('should handle put in different keys', () => {
    assert.equal(0, idx.keys().length);

    idx.put('as', 'the beste1');
    idx.put('asa', 'the beste2');
    idx.put('asas', 'the beste3');
    idx.put('asasas', 'the beste4');

    assert.equal(4, idx.keys().length);
  });

  it('should handle wide search in different keys', () => {
    idx.put('as', 'the beste1');
    idx.put('asa', 'the beste2');
    idx.put('asas', 'the beste3');
    idx.put('asasas', 'the beste4');

    assert.equal(2, idx.search('asas').length);
  });

  it('should handle put with same key', () => {
    const KEY = 'asa';
    const VAL1 = 'the beste1';
    const VAL2 = 'the beste2';
    const VAL3 = 'the beste3';
    idx.put(KEY, VAL1);
    idx.put(KEY, VAL2);
    idx.put(KEY, VAL3);

    assert.deepEqual([VAL2, VAL1, VAL3], idx.get(KEY));
  });

  it('should handle put with complex key', () => {
    const KEY = '*$HDv>J7{$}s&N*+Gm=sZ@+9E!W:L)!ZhT)?SofkHM^{YKE&FTADDFRErY%YDvfprAd-)[DWp6/u$9+@zFJ%1xLq{gBz+/cx(4D]H<ixour7fiuT[.AHJcZgurQAf';
    const VAL1 = 'val1';
    idx.put(KEY, VAL1);

    assert.deepEqual([VAL1], idx.get(KEY));
  });

  it('should be able to put path as key', () => {
    const KEY = '2023/12/21/08340403.jpeg';
    const VAL1 = 'thiz waz valid';
    idx.put(KEY, VAL1);

    assert.equal(VAL1, idx.get(KEY));
  });

  it('should be able to flush to disk', () => {
      return idx.flush(true);
  });
});
