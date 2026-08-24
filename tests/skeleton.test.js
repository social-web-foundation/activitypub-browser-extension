import test from 'node:test'
import assert from 'node:assert/strict'

import { LikeToggle } from '../src/ui/like-toggle.js'

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
