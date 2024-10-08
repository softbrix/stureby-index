var assert = require('assert');
var fs = require('fs-extra');
var shIndex = require('../index.js');

const waitForFileRemove = async (filePath, maxWaitTime) => {
  const startTime = new Date().getTime();
  do {
    if (fs.existsSync(filePath)) return true;
    // wait for 1 second
    await new Promise((resolve, reject) => setTimeout(() => resolve(true), 1000));
  } while(startTime + maxWaitTime < new Date().getTime());
  return false;
}

describe('Shatabang Index', function() {
  const DEFAULT_IDX_PATH = './test/data';
  const idx = shIndex(DEFAULT_IDX_PATH);

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

  it('should handle delete by valid key with flush', async () => {
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
    await waitForFileRemove(IDX_FILE, 2000);
    assert.equal(false, fs.existsSync(IDX_FILE));
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

    putRandomValues(idx, noOfItems, k);

    assert.equal(noOfItems, idx.get(k).length);
    assert.equal(1, idx.search(k).length);
  });

  it('should distribute random data with multiple values on same key', () => {
    var noOfItems = 1000;
    const PREV_KEY_LENGTH = idx.keys().length;

    /* Fill with garbage **/
    generateAndStoreRandomValues(idx, noOfItems, 200);

    assert.equal(PREV_KEY_LENGTH + noOfItems, idx.keys().length);
  });

  it('should be able to flush to disk', () => {
      return idx.flush(true);
  });

  describe('simultaneous read and write', function() {
    const idx2 = shIndex(DEFAULT_IDX_PATH);

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

      /* Fill with garbage **/
      generateAndStoreRandomValues(idx, noOfItems, 1);

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

  describe('error handling', function() {
    it('should not be able to put empty key', () => {
        assert.throws(() => { idx.put('', 'value'); }, Error, "Error thrown");
    });

    it('should not be able to put empty value', () => {
      assert.throws(() => { idx.put('key', ''); }, Error, "Error thrown");
    });
  });

  function putRandomValues(idx, times, key) {
    for (let n = 0; n < times; n++) {
        var value = (Math.random() * 10e20).toString(36);
        idx.put(key, value);
    }
  }
  
  var idx_suffix = 0;
  function generateAndStoreRandomValues(idx, count, valuesPerKey) {
    for (let n = 0; n < count; n++) {
      var k = (Math.random() * 10e20).toString(36).substring(0, Math.floor(Math.random() * (20 - 2 + 1)) + 2);
      k += idx_suffix++;
  
      putRandomValues(idx, valuesPerKey, k);
    }
  }
});