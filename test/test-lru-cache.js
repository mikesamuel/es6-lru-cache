/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint "no-magic-numbers": off, "no-undefined": off */

const { expect } = require('chai')
const { describe, it } = require('mocha')
const { LruCache } = require('../index')

const hole = { toString: () => 'HOLE' }
function expects (cache, vals) {
  function expectEntry (key) {
    const val = vals[key]
    expect(cache.peek(key), key)
      .to.equal(val === hole ? undefined : val)
    expect(cache.has(key), key)
      .to.equal(val !== hole)
  }
  if (Array.isArray(vals)) {
    for (let i = 0; i < vals.length; ++i) {
      expectEntry(i)
    }
  } else {
    for (const key in vals) {
      if (Object.hasOwnProperty.call(vals, key)) {
        expectEntry(key)
      }
    }
  }
}

describe('lru-cache', () => {
  describe('read-empty-cache', () => {
    const cache = new LruCache()
    const key = {}
    it('get', () => {
      expect(cache.get(key)).to.equal(undefined)
    })
    it('peek', () => {
      expect(cache.peek(key)).to.equal(undefined)
    })
    it('has', () => {
      expect(cache.has(key)).to.equal(false)
    })
    it('get-with-default', () => {
      expect(cache.get(key, 'default')).to.equal('default')
    })
    it('del', () => {
      expect(cache.get(key)).to.equal(undefined)
    })
    it('del-with-default', () => {
      expect(cache.get(key, 'foo')).to.equal('foo')
    })
  })
  describe('cache-seeded', () => {
    const cache = new LruCache()
    const key = {}
    const absent = {}
    cache.set('foo', 'bar')
    cache.set(key, 'baz')
    cache.set(null, 'nul')
    cache.set(undefined, 'und')
    cache.set('123', 'str')
    cache.set(123, 'num')

    it('has foo', () => {
      expect(cache.has('foo')).to.equal(true)
    })
    it('foo', () => {
      expect(cache.get('foo')).to.equal('bar')
    })
    it('foo-with-default', () => {
      expect(cache.get('foo', 'default')).to.equal('bar')
    })
    it('has key', () => {
      expect(cache.has(key)).to.equal(true)
    })
    it('key', () => {
      expect(cache.get(key)).to.equal('baz')
    })
    it('key-with-default', () => {
      expect(cache.get(key, 'default')).to.equal('baz')
    })
    it('has null', () => {
      expect(cache.has(null)).to.equal(true)
    })
    it('null', () => {
      expect(cache.get(null)).to.equal('nul')
    })
    it('null-with-default', () => {
      expect(cache.get(null, 'default')).to.equal('nul')
    })
    it('has undef', () => {
      expect(cache.has(undefined)).to.equal(true)
    })
    it('undef', () => {
      expect(cache.get(undefined)).to.equal('und')
    })
    it('undef-with-default', () => {
      expect(cache.get(undefined, 'default')).to.equal('und')
    })
    it('has str', () => {
      expect(cache.has('123')).to.equal(true)
    })
    it('str', () => {
      expect(cache.get('123')).to.equal('str')
    })
    it('str-with-default', () => {
      expect(cache.get('123', 'default')).to.equal('str')
    })
    it('has num', () => {
      expect(cache.has(123)).to.equal(true)
    })
    it('num', () => {
      expect(cache.get(123)).to.equal('num')
    })
    it('num-with-default', () => {
      expect(cache.get(123, 'default')).to.equal('num')
    })
    it('has absent', () => {
      expect(cache.has(absent)).to.equal(false)
    })
    it('absent', () => {
      expect(cache.get(absent)).to.equal(undefined)
    })
    it('absent-with-default', () => {
      expect(cache.get(absent, 'default')).to.equal('default')
    })
  })
  it('override value', () => {
    const cache = new LruCache()

    cache.set(0, 'zero')
    cache.set(1, 'one')
    cache.set(2, 'two')
    cache.set(3, 'three')
    expects(cache, [ 'zero', 'one', 'two', 'three', hole ])

    cache.set(2, 'zwei')
    expects(cache, [ 'zero', 'one', 'zwei', 'three', hole ])

    cache.delete(2)
    expects(cache, [ 'zero', 'one', hole, 'three', hole ])

    cache.delete(2)
    expects(cache, [ 'zero', 'one', hole, 'three', hole ])

    cache.delete(5)
    expects(cache, [ 'zero', 'one', hole, 'three', hole ])
  })
  it('explicit capacity', () => {
    const cap = 4
    const cache = new LruCache(cap)
    function obj (i) {
      return { x: i, toString: () => `{"x":${i}}` }
    }

    const keys = [ obj(0), obj(1), obj(2), obj(3), obj(4), obj(5) ]
    for (let iteration = 0; iteration < 2; ++iteration) {
      for (let i = 0; i < keys.length; ++i) {
        cache.set(keys[i], i)
      }
      expect(cache.peek(keys[0])).to.equal(undefined)
      expect(cache.peek(keys[1])).to.equal(undefined)
      expect(cache.peek(keys[2])).to.equal(2)
      expect(cache.peek(keys[3])).to.equal(3)
      expect(cache.peek(keys[4])).to.equal(4)
      expect(cache.peek(keys[5])).to.equal(5)

      // Delete all and reenter.
      for (let i = 0; i < keys.length; ++i) {
        cache.delete(keys[i], i)
      }
    }
  })
  it('incapacity', () => {
    function cacheMaker (capacity) {
      return () => new LruCache(capacity)
    }
    expect(cacheMaker({})).to.throw()
    expect(cacheMaker('foo')).to.throw()
    expect(cacheMaker(100.5)).to.throw()
    expect(cacheMaker(-1)).to.throw()
    expect(cacheMaker(0)).to.throw()
    expect(cacheMaker(-0)).to.throw()
    expect(cacheMaker(NaN)).to.throw()
    expect(cacheMaker(Infinity)).to.throw()
    expect(cacheMaker(-Infinity)).to.throw()
  })
  it('singleton cache', () => {
    // Test degenerate cases when capacity is 1 which exercises corner
    // cases where the capacity is reached and the head and tail of
    // the key list are the same.
    const cache = new LruCache(1)

    cache.set(0, 'a')
    expects(cache, [ 'a', hole ])
    expect(cache.get(0)).to.equal('a')
    expect(cache.get(1)).to.equal(undefined)
    cache.set(1, 'b')
    expects(cache, [ hole, 'b' ])
    expect(cache.get(0)).to.equal(undefined)
    expect(cache.get(1)).to.equal('b')
    cache.delete(0)
    expects(cache, [ hole, 'b' ])
    expect(cache.get(0)).to.equal(undefined)
    expect(cache.get(1)).to.equal('b')
    cache.delete(1)
    expects(cache, [ hole, hole ])
    expect(cache.get(0)).to.equal(undefined)
    expect(cache.get(1)).to.equal(undefined)
    cache.set(0, 'c')
    expects(cache, [ 'c', hole ])
  })
  it('eviction on set', () => {
    const cache = new LruCache(4)

    cache.set(0, 0)
    cache.set(1, 1)
    cache.set(2, 2)
    cache.set(3, 3)
    expects(cache, [ 0, 1, 2, 3, hole ])
    cache.delete(2)
    cache.delete(1)
    expects(cache, [ 0, hole, hole, 3, hole ])
    cache.set(4, 4)
    cache.set(5, 5)
    cache.set(6, 6)
    expects(cache, [ hole, hole, hole, 3, 4, 5, 6, hole ])
    cache.set(7, 7)
    expects(cache, [ hole, hole, hole, hole, 4, 5, 6, 7, hole ])
  })
  it('lru includes reads', () => {
    const cache = new LruCache(4)
    cache.set(0, 0)
    cache.set(1, 1)
    cache.set(2, 2)
    cache.set(3, 3)
    expects(cache, [ 0, 1, 2, 3, hole ])
    // The LRU list should look like: LRU [0, 1, 2, 3] MRU
    expect(cache.get(1)).to.equal(1)
    // The LRU list should look like: LRU [0, 2, 3, 1] MRU
    cache.set(4, 4)
    expects(cache, [ hole, 1, 2, 3, 4, hole ])
    cache.set(5, 5)
    // The LRU list should look like: LRU [3, 1, 4, 5] MRU
    expects(cache, [ hole, 1, hole, 3, 4, 5, hole ])
    cache.set(6, 6)
    // The LRU list should look like: LRU [1, 4, 5, 6] MRU
    expects(cache, [ hole, 1, hole, hole, 4, 5, 6, hole ])
    cache.set(7, 7)
    // The LRU list should look like: LRU [4, 5, 6, 7] MRU
    expects(cache, [ hole, hole, hole, hole, 4, 5, 6, 7, hole ])
  })
  it('coalesce to start', () => {
    const cache = new LruCache(4)

    cache.set('A', 'a')
    cache.set('B', 'b')
    cache.set('C', 'c')
    cache.set('D', 'd')
    expects(cache, { A: 'a', B: 'b', C: 'c', D: 'd', E: hole })
    cache.delete('B')
    cache.delete('C')
    expects(cache, { A: 'a', B: hole, C: hole, D: 'd', E: hole })
    cache.set('E', 'e')
    expects(cache, { A: 'a', B: hole, C: hole, D: 'd', E: 'e', F: hole })
    cache.set('A', 'f')
    cache.set('B', 'g')
    cache.set('C', 'h')
    expects(cache, { A: 'f', B: 'g', C: 'h', D: hole, E: 'e', F: hole })
    cache.set('D', 'i')
    expects(cache, { A: 'f', B: 'g', C: 'h', D: 'i', E: hole, F: hole })
  })
  it('eviction', function eviction () {
    // This test takes a while
    // eslint-disable-next-line no-invalid-this, line-comment-position, no-inline-comments
    this.timeout(30000) // ms
    // eslint-disable-next-line no-invalid-this, line-comment-position, no-inline-comments
    this.slow(10000) // ms

    const cache = new LruCache()
    const repetitions = 500

    for (let i = 0; i < repetitions; ++i) {
      cache.set(i, i)

      // At every stage, the last ten are present if more
      // than that have been inserted.
      for (let cursor = Math.max(0, i - 10); cursor <= i; ++cursor) {
        expect(cache.get(cursor), `has10 i=${i}, cursor=${cursor}`)
          .to.equal(cursor)
      }

      // At no-time is any key mapped to the wrong value.
      for (let cursor = 0; cursor < repetitions; ++cursor) {
        expect(cache.get(cursor, cursor), `integ i=${i}, cursor=${cursor}`)
          .to.equal(cursor)
      }
    }

    // At the end, the ones present are a run of the least recently used.
    let sawBlank = false
    for (let i = repetitions; --i >= 0;) {
      const val = cache.get(i)
      if (!sawBlank && val === undefined) {
        sawBlank = true
      }
      expect(val, `lru i=${i}`).to.equal(sawBlank ? undefined : i)
    }
    // Something should have been evicted
    expect(sawBlank).to.equal(true)
  })
  it('repetitive', () => {
    // This tests a corner case when evicting the same item we're
    // inserting.
    const cache = new LruCache()
    for (let i = 0; i < 1000; ++i) {
      cache.set('a', 'A')
      expect(cache.has('a'), `i=${i}`).to.equal(true)
      expect(cache.get('a'), `i=${i}`).to.equal('A')
    }
  })
  it('fuzz', function fuzz () {
    // eslint-disable-next-line no-invalid-this, line-comment-position, no-inline-comments
    this.slow(5000) // ms

    // stochastic tests that compare a simple but inefficient
    // implementation against the actual run against the same randomly
    // generated sequence of operations
    const capacity = 20
    const repetitions = 10000

    class SlowCache {
      constructor () {
        this.map = new Map()
      }

      peek (key) {
        return this.map.get(key)
      }

      set (key, val) {
        this.map.set(key, val)
      }

      has (key) {
        return this.map.has(key)
      }

      delete (key) {
        this.map.delete(key)
      }
    }

    function randomIntBetween (min, max) {
      return Math.floor(Math.random() * (max - min)) + min
    }

    // Compute a test script of actions to perform against both
    const testScript =
      (function setupTestScript () {
        // Accumulates random method calls and expected outcomes
        const testScriptArr = []
        // A simple but slow implementation that we compare to.
        const slowCache = new SlowCache()
        // Method names to exercise.
        const methods = [ 'peek', 'set', 'has', 'delete' ]

        for (let i = 0; i < repetitions; ++i) {
          const method = methods[randomIntBetween(0, methods.length)]
          const key = String(randomIntBetween(0, 100))
          const args = [ key ]
          if (method === 'set') {
            args.push(String(randomIntBetween(0, 100)))
          }
          const result = slowCache[method](...args)
          const step = {
            i,
            key,
            method,
            args
          }
          if (method === 'peek' || method === 'has') {
            step.want = result
          }
          testScriptArr[i] = step
        }
        return testScriptArr
      }())

    const cache = new LruCache(capacity)
    const lruMusts = []
    try {
      testScript.forEach((step, i) => {
        const { method, args, key } = step
        if (method === 'set') {
          if (lruMusts.length >= capacity) {
            lruMusts.shift()
          }
          lruMusts.push(key)
        }
        const got = cache[method](...args)
        // If we have a value and it must be in our cache, then compare
        // the values.
        if ('want' in step && lruMusts.indexOf(key) >= 0) {
          expect(got, `i=${i}, ${method}(${args.join(', ')})`).to.equal(step.want)
        }
      })
    } catch (exc) {
      // eslint-disable-next-line no-console
      console.log(`Fuzz failed with\n${JSON.stringify(testScript, null, '  ')}`)
      throw exc
    }
  })
})
