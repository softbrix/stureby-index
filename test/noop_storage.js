var assert = require('assert');
var _ = require('underscore');
var fs = require('fs');
var shIndex = require('../index.js');


describe('Shatabang Noop Index', function() {
  const FOLDER = './test/data_noop';
  const idx = shIndex(FOLDER, {persist: false});

  it('should return empty array for unknown key', function() {
    assert.deepEqual([], idx.get('aaa'));
    assert.deepEqual([], idx.search('aaa'));
  });

  it('should handle put in different keys', () => {
    assert.equal(0, idx.size());

    idx.put('as', 'the beste1');
    idx.put('asa', 'the beste2');
    idx.put('asas', 'the beste3');
    idx.put('asasas', 'the beste4');

    assert.equal(4, idx.size());
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

  it('should be able to flush to disk', () => {
      return idx.flush(true);
  });

  it('should not exist a ' + FOLDER, () => {
      assert.equal(false, fs.existsSync(FOLDER));
  });
});
