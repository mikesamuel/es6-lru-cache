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

/**
 * @fileoverview
 * A simple LRU cache for JavaScript
 */

/**
 * @template K
 * @template V
 */
class LruCache {
  /**
   * @param {K} key
   * @param {=V} optFallback
   * @return {?V}
   */
  get (key, optFallback) {
    return this.lru(key, 0, optFallback)
  }

  /**
   * @param {K} key
   * @param {=V} newValue
   * @return {?V}
   */
  set (key, newValue) {
    return this.lru(key, 1, newValue)
  }

  /**
   * @param {K} key
   * @param {=V} optFallback
   * @return {?V}
   */
  delete (key, optFallback) {
    return this.lru(key, 2, optFallback)
  }

  /**
   * @param {K} key
   * @return {boolean}
   */
  has (key) {
    // eslint-disable-next-line no-magic-numbers
    return this.lru(key, 3, null)
  }

  /**
   * @param {=number} optCapacity
   */
  constructor (capacity = 100) { // eslint-disable-line no-magic-numbers
    // Set up a rotating cue of keys.
    const keys = []
    keys.length = capacity
    if (!(capacity > 0 && keys.length === capacity)) {
      throw new Error(capacity)
    }
    // pos is the index in keys of the least-recently used key
    // unless it is equal to limit in which case map is empty.
    let pos = 0
    // count is the count of entries in keys that are known to
    // be used or are known to be holes
    let count = 0
    // A placeholder that indicates that a key is not in the LRU
    // list because it was deleted.
    const hole = {}

    // Map keys to [value, keysIndex]
    const map = new Map()

    function maybeCoalesce () {
      let lastIndex = (pos + count - 1) % capacity
      // Don't evict when we alternate sets
      // and deletes.
      while (count && keys[lastIndex] === hole) {
        --count
        lastIndex = (lastIndex || capacity) - 1
      }
      if (!count) {
        pos = 0
      }
    }

    function maybeEvict () {
      if (count === capacity) {
        const toEvict = keys[pos]
        if (toEvict !== hole) {
          map.delete(toEvict)
        }
        keys[pos] = hole
        pos = (pos + 1) % capacity
        maybeCoalesce()
      }
    }

    function cacheGet (key, entry, value) {
      return entry ? entry[0] : value
    }

    function cacheSet (key, entry, value) {
      if (entry) {
        keys[entry[1]] = hole
      }
      maybeEvict()
      const limit = (pos + count) % capacity
      keys[limit] = key
      ++count
      map.set(key, [ value, limit ])
      return value
    }

    function cacheDel (key, entry, value) {
      if (!entry) {
        return value
      }
      map.delete(key)
      const [ oldValue, index ] = entry
      keys[index] = hole
      maybeCoalesce()
      return oldValue
    }

    function cacheHas (key, entry, value) {
      return entry !== void 0 // eslint-disable-line no-void
    }

    const actions = [ cacheGet, cacheSet, cacheDel, cacheHas ]

    /*
    // UNCOMMENT FOR DEBUGGING
    function cacheDebug (key, entry, value) {
      const keysReorg = pos + count <= capacity
        ? keys.slice(pos, pos + count)
            : keys.slice(pos, capacity).concat(keys.slice(0, (pos + count) % capacity))
      console.log(`keys=${keysReorg}`)
      map.forEach(([v, i], k) => {
        console.log(`* ${k}: ${v}${keys[i] === k ? '' : '*INTEGRITY FAILURE*'}`)
      })
    }
    actions.push(cacheDebug)
    */

    /**
     * @param {K} key
     * @param {V|undefined} opt_value
     */
    this.lru = function lru (key, action, value) {
      return actions[action](key, map.get(key), value)
    }
  }
}

exports.LruCache = LruCache
