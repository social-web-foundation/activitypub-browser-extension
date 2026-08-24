import test from 'node:test'
import assert from 'node:assert/strict'

import { SecurityStore } from '../src/security/security-store.js'

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

  async remove (key) {
    this.values.delete(key)
  }
}

test('stores and retrieves client credentials by server name', async () => {
  const store = new SecurityStore({ storage: new FakeStorage() })
  const credentials = {
    clientId: 'client-id',
    clientSecret: 'client-secret'
  }

  await store.setClientCredentials('mastodon.example', credentials)

  assert.deepEqual(
    await store.getClientCredentials('mastodon.example'),
    credentials
  )
})

test('returns null when client credentials are missing', async () => {
  const store = new SecurityStore({ storage: new FakeStorage() })

  assert.equal(await store.getClientCredentials('mastodon.example'), null)
})

test('stores account credentials for the current account identity', async () => {
  const store = new SecurityStore({ storage: new FakeStorage() })
  const accountIdentity = 'https://mastodon.example/users/example'
  const accessToken = 'access-token'

  await store.setAccessToken(accountIdentity, accessToken)
  await store.setCurrentAccountIdentity(accountIdentity)

  assert.deepEqual(await store.getCurrentAccountIdentity(), accountIdentity)
  assert.deepEqual(await store.getAccountCredentials(), {
    accountIdentity,
    accessToken
  })
})

test('returns null account credentials when there is no current account identity', async () => {
  const store = new SecurityStore({ storage: new FakeStorage() })

  assert.equal(await store.getAccountCredentials(), null)
})

test('returns null account credentials when the current access token is missing', async () => {
  const store = new SecurityStore({ storage: new FakeStorage() })
  const accountIdentity = 'https://mastodon.example/users/example'

  await store.setCurrentAccountIdentity(accountIdentity)

  assert.equal(await store.getAccountCredentials(), null)
})

test('removes access token and current account identity', async () => {
  const store = new SecurityStore({ storage: new FakeStorage() })
  const accountIdentity = 'https://mastodon.example/users/example'
  const accessToken = 'access-token'

  await store.setAccessToken(accountIdentity, accessToken)
  await store.setCurrentAccountIdentity(accountIdentity)
  await store.removeAccessToken(accountIdentity)
  await store.removeCurrentAccountIdentity()

  assert.equal(await store.getCurrentAccountIdentity(), null)
  assert.equal(await store.getAccountCredentials(), null)
})
