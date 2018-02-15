# ES6 LRU Cache

A simple [LRU Cache](https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU), a
Map that has a maximum number of entries and which discards the least recently used
items first.

To install

```sh
$ npm install an-lru-cache
```

[![Coverage Status](https://coveralls.io/repos/github/mikesamuel/es6-lru-cache/badge.svg?branch=master)](https://coveralls.io/github/mikesamuel/es6-lru-cache?branch=master)
[![Build Status](https://travis-ci.org/mikesamuel/es6-lru-cache.svg?branch=master)](https://travis-ci.org/mikesamuel/es6-lru-cache)
[![Dependencies Status](https://david-dm.org/mikesamuel/es6-lru-cache/status.svg)](https://david-dm.org/mikesamuel/es6-lru-cache)
[![npm](https://img.shields.io/npm/v/an-lru-cache.svg)](https://www.npmjs.com/package/an-lru-cache)

## API

The API mirrors the builtin `Map` and `WeakMap` APIs but does not include iterators.

```js
const { LruCache } = require('an-lru-cache')

const myCache = new LruCache()  // Default capacity is 100

function foo(key, value) {
  myCache.set(key, value)
  // ...
  return myCache.get(key)
}

function bar(key) {
  if (myCache.has(key)) {
    // ...
  }
  myCache.delete(key)
}
```


### `.set(key, value)`

Associates *value* with *key* so that `.get(key)` returns *value*
until a subsequent `.set` or `.delete` with the same *key* or
eviction.

### `.get(key, fallbackValue=undefined)`

Returns the value associated with *key*, or the *fallbackValue* if supplied.

Gets may return the *fallbackValue* even if there was a value associated
with *key* if that entry was evicted to ensure that the number of entries
did not exceed the maximum allowed.

### `.delete(key, fallbackValue=undefined)`

Deletes any entry for the given *key* returning the previously associated
value if present or *fallbackValue* otherwise.

### `.has(key)`

True iff there is a value associated with `key`.
