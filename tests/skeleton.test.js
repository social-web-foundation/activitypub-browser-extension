import test from 'node:test'
import assert from 'node:assert/strict'

import { DiscoveryObserver } from '../src/discovery/discovery-observer.js'
import { ResourceCache } from '../src/discovery/resource-cache.js'
import { LikeToggle } from '../src/ui/like-toggle.js'

test('discovery observer starts without current resource state', () => {
  const observer = new DiscoveryObserver({
    browserAdapter: {},
    mastodonClient: {},
    resourceCache: {},
    securityStore: {}
  })

  assert.equal(observer.getCurrentActivityPubResource(), null)
  assert.equal(observer.getCurrentStatusId(), null)
})

test('resource cache stores resources by document id', () => {
  const cache = new ResourceCache()
  const resource = { id: 'https://example.com/object', url: 'https://example.com/post' }

  cache.storeActivityPubResource('document-id', resource)

  assert.equal(cache.getActivityPubResource('document-id'), resource)
})

test('like toggle can set and clear liked state', () => {
  const toggle = new LikeToggle({
    discoveryObserver: {},
    mastodonClient: {},
    securityStore: {}
  })

  toggle.setLikedState(true)
  assert.equal(toggle.likedState, true)

  toggle.clearLikedState()
  assert.equal(toggle.likedState, null)
})
