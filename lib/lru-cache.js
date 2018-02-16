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
 * A mapping from keys to values which drops the least recently used
 * entry when a hard-limit on the number of entries would be exceeded.
 *
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
   * Like get but does not affect the usage order
   * -- this method has no effect on cache eviction.
   *
   * @param {K} key
   * @param {=V} optFallback
   * @return {?V}
   */
  peek (key, optFallback) {
    // eslint-disable-next-line no-magic-numbers
    return this.lru(key, 4, optFallback)
  }

  /**
   * Associates newValue with key in the map,
   * possibly evicting the least recently used entry.
   *
   * @param {K} key
   * @param {=V} newValue
   * @return {?V} newValue
   */
  set (key, newValue) {
    return this.lru(key, 1, newValue)
  }

  /**
   * Removes any entry for key returning
   * the previously associated value or optFallback
   * if there was not a previously associated value.
   *
   * @param {K} key
   * @param {=V} optFallback
   * @return {?V}
   */
  delete (key, optFallback) {
    return this.lru(key, 2, optFallback)
  }

  /**
   * True iff there is an entry for key.
   * Like peek, does not affect eviction.
   *
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
    // Set up a doubly linked list of keys so that we can efficiently
    // pick for eviction.
    const keys = []
    // The keys list is broken into triplets, hence 3 here and belo.
    keys.length = capacity * 3 // eslint-disable-line no-magic-numbers
    // eslint-disable-next-line no-magic-numbers
    if (!(capacity > 0 && keys.length === capacity * 3)) {
      throw new Error(capacity)
    }

    // Map keys to [value, keyIndex]
    const map = new Map()

    // Indices into keys
    // LRU
    let head = -1
    // MRU
    let tail = -1
    // Count of keys stored in keys
    let count = 0

    function usedEntry (key, entry) {
      const [ , i ] = entry

      const prev = keys[i]
      const next = keys[i + 2]

      // Unlink from list
      if (head === i) {
        head = next
      }
      if (tail === i) {
        tail = prev
      }
      if (prev >= 0) {
        keys[prev + 2] = next
      }
      if (next >= 0) {
        keys[next] = prev
      }

      // Insert at end
      keys[i] = tail
      keys[i + 2] = -1
      if (head < 0) {
        head = i
      } else {
        keys[tail + 2] = i
      }
      tail = i
    }

    function newEntry (key) {
      let freeIndex = -1
      if (count === capacity) {
        // Evict
        freeIndex = head
        head = keys[head + 2]
        if (head < 0) {
          // Could be the case if capacity === 1.
          // eslint-disable-next-line no-magic-numbers
          tail = -1
        } else {
          keys[head] = -1
        }
        // If outstanding code had a handle to the
        // deleted entry, we would need to invalidate
        // its index.  This does not occur.
        map.delete(keys[freeIndex + 1])
      } else {
        // Instead of maintaining a free list, we do work
        // to preserve this invariant in unlinkEntry.
        // eslint-disable-next-line no-magic-numbers
        freeIndex = count * 3
        ++count
      }
      keys[freeIndex] = -1
      keys[freeIndex + 1] = key
      keys[freeIndex + 2] = -1
      return [ null, freeIndex ]
    }

    function unlinkEntry (entry) {
      --count

      // We need to unlink any references to keyIndex and
      // make sure that newEntry above finds a free index
      // by swapping any used entry there into keyIndex.
      // eslint-disable-next-line no-magic-numbers
      const nextFreeIndex = count * 3
      const [ , keyIndex ] = entry

      const prev = keys[keyIndex]
      const next = keys[keyIndex + 2]
      if (prev >= 0) {
        keys[prev + 2] = next
      } else {
        head = next
      }
      if (next >= 0) {
        keys[next] = prev
      } else {
        tail = prev
      }
      keys[keyIndex] = -1
      keys[keyIndex + 2] = -1

      if (keyIndex !== nextFreeIndex) {
        const shiftedEntry = map.get(keys[nextFreeIndex + 1])
        shiftedEntry[1] = keyIndex

        const shiftedPrev = keys[nextFreeIndex]
        const shiftedNext = keys[nextFreeIndex + 2]
        keys[keyIndex] = shiftedPrev
        keys[keyIndex + 1] = keys[nextFreeIndex + 1]
        keys[keyIndex + 2] = shiftedNext

        if (shiftedPrev >= 0) {
          keys[shiftedPrev + 2] = keyIndex
        } else {
          head = keyIndex
        }
        if (shiftedNext >= 0) {
          keys[shiftedNext] = keyIndex
        } else {
          tail = keyIndex
        }
        // Release the key for GC.
        // eslint-disable-next-line no-undefined
        keys[nextFreeIndex + 1] = undefined
      }

      entry[1] = -1
    }

    function cacheGet (key, value) {
      const entry = map.get(key)
      if (entry) {
        // Make sure that the Map's internal insertion
        // order reflects the fact that this was requested.
        usedEntry(key, entry)
        return entry[0]
      }
      return value
    }

    function cachePeek (key, value) {
      const entry = map.get(key)
      return entry ? entry[0] : value
    }

    function cacheSet (key, value) {
      let entry = map.get(key)
      if (!entry) {
        entry = newEntry(key)
        map.set(key, entry)
      }
      entry[0] = value
      usedEntry(key, entry)
      return value
    }

    function cacheDel (key, value) {
      const entry = map.get(key)
      if (!entry) {
        return value
      }
      unlinkEntry(entry)
      map.delete(key)
      return entry[0]
    }

    function cacheHas (key, value) {
      return map.has(key)
    }

    const actions = [ cacheGet, cacheSet, cacheDel, cacheHas, cachePeek ]

    /*
    // UNCOMMENT FOR DEBUGGING
    function cacheDebug (key, value) {
      console.log(`count=${count}`)
      map.forEach(([v, i], k) => {
        console.log(`* ${k}: ${v}`)
      })
    }
    actions.push(cacheDebug)
    function integrityViolation(msg) {
      throw new Error(`Integrity violation ${msg}`)
    }
    function checkIntegrity () {
      let countInMap = 0
      let used = []
      map.forEach(([v, i], k) => {
        if (i % 3) {
          integrityViolation(`entry [${v}, ${i}]: i % 3`)
        } else {
          if (used[i / 3]) {
            integrityViolation(`entry [${v}, ${i}]: reused i`)
          } else {
            used[i / 3] = 1
          }
        }
        if (k !== keys[i + 1]) {
          integrityViolation(`entry [${v}, ${i}]: ${k} !== keys[${i}`)
        }
        ++countInMap
      })
      if (count != countInMap) {
        integrityViolation(`${countInMap} in map, but count=${count}`)
      }
      let countInList = 0
      if (head >= 0 && keys[head] !== -1) {
        integrityViolation(`items before head`)
      }
      for (let i = head, next = -1; i >= 0; i = next) {
        if (typeof i !== 'number') {
          integrityViolation(`invalid index ${i} after ${countInList} steps`)
          break
        }
        ++countInList
        if (countInList > count) {
          integrityViolation(`expected list to end after ${count} steps but got index=${i}`)
          break
        }
        next = keys[i + 2]
        if (next < 0) {
          if (tail !== i) {
            integrityViolation(`list ends at ${i} but tail=${tail} after ${countInList} steps`)
            break
          }
          break
        }
        if (keys[next] !== i) {
          integrityViolation(`i=${i} next=${next} but backlink=${keys[next]}`)
        }
      }
      if (count != countInList) {
        integrityViolation(`${countInList} in list, but count=${count}`)
      }
    }
    */

    /**
     * @param {K} key
     * @param {V|undefined} opt_value
     */
    this.lru = function lru (key, action, value) {
      // checkIntegrity()
      return actions[action](key, value)
    }
  }
}

exports.LruCache = LruCache
