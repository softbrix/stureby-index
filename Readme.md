[![Build Status](https://travis-ci.org/softbrix/stureby_index.svg?branch=master)](https://travis-ci.org/softbrix/stureby_index)

# Stureby Index
This is an simple index or cache for javascript.

Create the index instance by simply requiring the stureby_index module and create a
new instance of the object.

Then you can use the put, get and search methods to modify the index.

The first argument to the put method is the key and the second is the value.
The same key can be linked to multiple values.

The search method will return a list of matched keys.

## Version 2
The new version is backwards compatible with version 1 of the index. The index
will be upgraded and once it is flushed back to disk the process is not reversible.

### Don't persist on disk
In this version it is possible to create a index without the disk access. The
options parameter should include persist false which will use the noop_storage.

## Flush before process exists
```
  if(!_.isUndefined(process)) {
    process.on('SIGINT', indexObject.flush);
  }
```

### Options

* storageFactory (undefined) - override the persistant storage to use
* flushTime (500) - the time in milliseconds between flushing changes back to persisted storage
* persist (true) - should we persist the index to file or just keep it in memory

## Why Stureby?
Stureby is a small area in the southern suburbs of Stockholm, Sweden. This is a
calm and child friendly area having mostly small houses and private villas.
This is the place where my mother spent her first year with her family and where
 I currently live with mine.
