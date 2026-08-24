import test from 'node:test'
import assert from 'node:assert/strict'

import { ResourceCache } from '../src/discovery/resource-cache.js'

class FakeStorage {
  constructor () {
    this.values = new Map()
  }

  async get (key) {
    return {
      [key]: this.values.get(key)
    }
  }

  async set (items) {
    for (const [key, value] of Object.entries(items)) {
      this.values.set(key, value)
    }
  }
}

test('stores and retrieves resources by document fingerprint', async () => {
  const cache = new ResourceCache({ storage: new FakeStorage() })
  const fingerprint = {
    url: 'https://example.com/posts/1',
    hash: 'sha256:abc123'
  }
  const resource = {
    id: 'https://example.com/activitypub/objects/1',
    url: 'https://example.com/posts/1'
  }

  await cache.setActivityPubResource(fingerprint, resource)

  assert.deepEqual(await cache.getActivityPubResource({
    url: 'https://example.com/posts/1',
    hash: 'sha256:abc123'
  }), resource)
})

test('returns null when document fingerprint is missing', async () => {
  const cache = new ResourceCache({ storage: new FakeStorage() })
  const fingerprint = {
    url: 'https://example.com/posts/1',
    hash: 'sha256:abc123'
  }

  assert.equal(await cache.getActivityPubResource(fingerprint), null)
})

test('does not match the same URL with a different document hash', async () => {
  const cache = new ResourceCache({ storage: new FakeStorage() })
  const resource = {
    id: 'https://example.com/activitypub/objects/1',
    url: 'https://example.com/posts/1'
  }

  await cache.setActivityPubResource(
    {
      url: 'https://example.com/posts/1',
      hash: 'sha256:abc123'
    },
    resource
  )

  assert.equal(
    await cache.getActivityPubResource({
      url: 'https://example.com/posts/1',
      hash: 'sha256:def456'
    }),
    null
  )
})

test('does not match the same hash with a different URL', async () => {
  const cache = new ResourceCache({ storage: new FakeStorage() })
  const resource = {
    id: 'https://example.com/activitypub/objects/1',
    url: 'https://example.com/posts/1'
  }

  await cache.setActivityPubResource(
    {
      url: 'https://example.com/posts/1',
      hash: 'sha256:abc123'
    },
    resource
  )

  assert.equal(
    await cache.getActivityPubResource({
      url: 'https://example.com/posts/2',
      hash: 'sha256:abc123'
    }),
    null
  )
})
