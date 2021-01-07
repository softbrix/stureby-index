var assert = require('assert');
var _ = require('underscore');
var fs = require('fs-extra');
var shIndex = require('../index.js');


describe('Shatabang Index', function() {
  const idx = shIndex('./test/data');

  it('should return empty array for unknown key', function() {
    assert.equal(0, idx.size());
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
    assert.equal(4, idx.size());
  });

  it('should handle numeric put in different keys', () => {
    let init = idx.size();

    idx.put(123, 'the beste1');
    idx.put(456, 'the beste2');
    idx.put(543, 'the beste3');
    idx.put(Number.MAX_VALUE, 'the beste4');

    assert.equal(init + 4, idx.keys().length);
    assert.equal(init + 4, idx.size());
  });

  it('should handle wide search in different keys', () => {
    idx.put('as', 'the beste1');
    idx.put('asa', 'the beste2');
    idx.put('asas', 'the beste3');
    idx.put('asasas', 'the beste4');

    assert.strictEqual(idx.search('asas').length, 2);
  });

  it('should handle put with same key', () => {
    const KEY = 'asa';
    const VAL1 = 'the beste1';
    const VAL2 = 'the beste2';
    const VAL3 = 'the beste3';
    idx.put(KEY, VAL1);
    idx.put(KEY, VAL2);
    idx.put(KEY, VAL3);

    assert.deepEqual([VAL1, VAL2, VAL3], idx.get(KEY).sort());
  });

  it('should handle put with same numeric key', () => {
    const KEY = Math.PI;
    const VAL1 = 'the beste1';
    const VAL2 = 'the beste2';
    const VAL3 = 'the beste3';
    idx.put(KEY, VAL1);
    idx.put(KEY, VAL2);
    idx.put(KEY, VAL3);

    assert.deepEqual([VAL1, VAL2, VAL3], idx.get(KEY).sort());
  });

  it('should handle put with complex key', () => {
    const KEY = '*$HDv>J7{$}s&N*+Gm=sZ@+9E!W:L)!ZhT)?SofkHM^{YKE&FTADDFRErY%YDvfprAd-)[DWp6/u$9+@zFJ%1xLq{gBz+/cx(4D]H<ixour7fiuT[.AHJcZgurQAf';
    const VAL1 = 'val1';
    idx.put(KEY, VAL1);

    assert.deepEqual([VAL1], idx.get(KEY));
  });

  it('should handle delete by valid key', () => {
    const KEY = 'asa';
    assert.equal(3, idx.get(KEY).length);
    idx.delete(KEY);
    assert.deepEqual([], idx.get(KEY));
  });

  it('should handle delete by unused key', () => {
    const KEY = 'asakrassa';
    assert.deepEqual([], idx.get(KEY));
    idx.delete(KEY);
    assert.deepEqual([], idx.get(KEY));
  });

  it('should handle delete by valid key with flush', () => {
    const KEY = 'DELTE_ME',
      INDEX = './test/dataDelete',
      IDX_KEY_FILE = INDEX + '/__allKeys',
      IDX_FILE = INDEX + '/a';
    const idx = shIndex(INDEX, {flushTime: 0});
    idx.clear();
    assert.equal(24, fs.readFileSync(IDX_KEY_FILE).length);
    idx.put(KEY, 'Value');
    assert.equal(true, fs.existsSync(IDX_FILE))
    assert.equal(38, fs.readFileSync(IDX_KEY_FILE).length);
    idx.delete(KEY);
    assert.equal(false, fs.existsSync(IDX_FILE))
    assert.equal(24, fs.readFileSync(IDX_KEY_FILE).length);
  });

  it('should handle update by valid key', () => {
    const KEY = 'asaba';
    const NEW_VALUE = 'ABC123';
    idx.put(KEY, NEW_VALUE);
    assert.equal(1, idx.get(KEY).length);
    idx.update(KEY, NEW_VALUE);
    assert.deepEqual([NEW_VALUE], idx.get(KEY));
  });

  it('should handle update by unused key', () => {
    const KEY = 'asakrassa';
    const NEW_VALUE = 'KULBANA';
    assert.deepEqual([], idx.get(KEY));
    idx.update(KEY, NEW_VALUE);
    assert.deepEqual([NEW_VALUE], idx.get(KEY));
  });


  it('should be able to reopen index and add new items', function() {
    const KEY1 = 'asaklint';
    const VAL1 = 'the beste no 1';
    for(var i = 0; i < 3; ++i) {
      var tmpIdx = shIndex('./test/data');
      tmpIdx.put(KEY1, VAL1+i);
      tmpIdx.flush(true);
    }
    var tmpIdx = shIndex('./test/data');
    assert.equal(3, tmpIdx.get(KEY1).length);
  });

  it('should handle put plenty items in single file', () => {
    var k = "D5320";
    const noOfItems = 10000;
    _.times(noOfItems, function(n) {
        var v = (Math.random() * 10e20).toString(36);
      idx.put(k, v);
    });

    assert.equal(noOfItems, idx.get(k).length);
    assert.equal(1, idx.search(k).length);
  });

  it('should distribute random data with multiple values on same key', () => {
    var noOfItems = 1000;
    const PREV_KEY_LENGTH = idx.keys().length;

    /* Fill with garbage **/
    _.times(noOfItems, function(n) {
      var k = (Math.random() * 10e20).toString(36).substring(0,_.random(2, 20));
      k += new Date().getTime();

      _.times(200, function(n) {
        var v = (Math.random() * 10e20).toString(36);
        idx.put(k, v);
      });
    });

    assert.equal(PREV_KEY_LENGTH + noOfItems, idx.keys().length);
  });

  it('should be able to flush to disk', () => {
      return idx.flush(true);
  });

  describe('simultaneous read and write', function() {
    const PATH = './test/data';
    //const idx = shIndex(PATH);
    const idx2 = shIndex(PATH);

    it('should be able to sync data between instances in same process', () => {
      const KEY = 'Netflix';
      const VALUE = 'The Crown';
      assert.deepEqual([], idx.get(KEY));
      assert.deepEqual([], idx2.get(KEY));
      idx.update(KEY, VALUE);
      assert.deepEqual([VALUE], idx.get(KEY));
      assert.deepEqual([VALUE], idx2.get(KEY));
    });
  });

  describe('big Index', function() {
    const idx = shIndex('./test/data_big');
    it('should distribute random data with single value on same key', () => {
      var noOfItems = 20000;
      var id_suffix = 0;  // To secure the uniqueness

      /* Fill with garbage **/
      _.times(noOfItems, function(n) {
        var k = (Math.random() * 10e20).toString(36).substring(0,_.random(2, 20));
        k += id_suffix++;
        var v = (Math.random() * 10e20).toString(36);
        idx.put(k, v);

      });

      assert.equal(noOfItems, idx.keys().length);
    });

    it('should be able to flush to disk', () => {
        return idx.flush(true);
    });

    it('should be able to clear', () => {
        idx.clear();

        // Reload the index
        const idx_cleared = shIndex('./test/data_big');
        assert.equal(0, idx_cleared.keys().length);
    });
  });
});
