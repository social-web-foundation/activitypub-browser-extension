import test from 'node:test'
import assert from 'node:assert/strict'

import { StatusIdCache } from '../src/discovery/status-id-cache.js'

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

test('stores and retrieves status IDs by Mastodon hostname and ActivityPub resource', async () => {
  const cache = new StatusIdCache({ storage: new FakeStorage() })
  const resource = {
    id: 'https://example.com/activitypub/objects/1',
    url: 'https://example.com/posts/1'
  }
  const statusId = '123'

  await cache.setStatusId('mastodon.example', resource, statusId)

  assert.deepEqual(
    await cache.getStatusId('mastodon.example', resource),
    statusId
  )
})

test('returns null when status ID is missing', async () => {
  const cache = new StatusIdCache({ storage: new FakeStorage() })
  const resource = {
    id: 'https://example.com/activitypub/objects/1',
    url: 'https://example.com/posts/1'
  }

  assert.equal(await cache.getStatusId('mastodon.example', resource), null)
})

test('does not match the same resource on a different Mastodon hostname', async () => {
  const cache = new StatusIdCache({ storage: new FakeStorage() })
  const resource = {
    id: 'https://example.com/activitypub/objects/1',
    url: 'https://example.com/posts/1'
  }

  await cache.setStatusId('mastodon.example', resource, '123')

  assert.equal(await cache.getStatusId('other.example', resource), null)
})

test('does not match a different ActivityPub resource on the same Mastodon hostname', async () => {
  const cache = new StatusIdCache({ storage: new FakeStorage() })

  await cache.setStatusId(
    'mastodon.example',
    {
      id: 'https://example.com/activitypub/objects/1',
      url: 'https://example.com/posts/1'
    },
    '123'
  )

  assert.equal(
    await cache.getStatusId('mastodon.example', {
      id: 'https://example.com/activitypub/objects/2',
      url: 'https://example.com/posts/2'
    }),
    null
  )
})
