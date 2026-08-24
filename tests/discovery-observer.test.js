import test from 'node:test'
import assert from 'node:assert/strict'

import { DiscoveryObserver } from '../src/discovery/discovery-observer.js'

class FakeEvent {
  constructor () {
    this.listeners = []
  }

  addListener (listener) {
    this.listeners.push(listener)
  }

  emit (...args) {
    for (const listener of this.listeners) {
      listener(...args)
    }
  }
}

class FakeBrowser {
  constructor ({ messageResponses = new Map() } = {}) {
    this.sentMessages = []
    this.messageResponses = messageResponses
    this.tabs = {
      onActivated: new FakeEvent(),
      onUpdated: new FakeEvent(),
      sendMessage: async (tabId, message) => {
        this.sentMessages.push({ tabId, message })
        return this.messageResponses.get(tabId) ?? null
      }
    }
  }
}

class FakeResourceCache {
  constructor ({ resources = new Map() } = {}) {
    this.resources = resources
    this.requests = []
    this.requested = new Promise(resolve => {
      this.resolveRequested = resolve
    })
  }

  async getActivityPubResource (documentFingerprint) {
    this.requests.push(documentFingerprint)
    this.resolveRequested(documentFingerprint)
    return this.resources.get(this.#key(documentFingerprint)) ?? null
  }

  #key ({ url, hash }) {
    return `${url}\n${hash}`
  }
}

class FakeSecurityStore {
  constructor ({
    accountCredentials = {
      accountIdentity: 'https://mastodon.example/users/example',
      accessToken: 'access-token'
    }
  } = {}) {
    this.accountCredentials = accountCredentials
    this.requests = []
  }

  async getAccountCredentials () {
    this.requests.push({})
    return this.accountCredentials
  }
}

class FakeMastodonClient {
  constructor ({ statusId = '123' } = {}) {
    this.statusId = statusId
    this.requests = []
  }

  async resolveActivityPubResourceToStatusId (
    hostname,
    accountCredentials,
    resource
  ) {
    this.requests.push({ hostname, accountCredentials, resource })
    return this.statusId
  }
}

class FakeStatusIdCache {
  constructor ({ statusIds = new Map() } = {}) {
    this.statusIds = statusIds
    this.getRequests = []
    this.setRequests = []
    this.requested = new Promise(resolve => {
      this.resolveRequested = resolve
    })
  }

  async getStatusId (hostname, resource) {
    this.getRequests.push({ hostname, resource })
    const statusId = this.statusIds.get(this.#key(hostname, resource)) ?? null
    if (statusId) {
      this.resolveRequested(statusId)
    }
    return statusId
  }

  async setStatusId (hostname, resource, statusId) {
    this.setRequests.push({ hostname, resource, statusId })
    this.statusIds.set(this.#key(hostname, resource), statusId)
    this.resolveRequested(statusId)
  }

  #key (hostname, resource) {
    return `${hostname}\n${resource.id}`
  }
}

function createObserver ({
  browser = new FakeBrowser(),
  mastodonClient = new FakeMastodonClient(),
  resourceCache = new FakeResourceCache(),
  securityStore = new FakeSecurityStore(),
  statusIdCache = new FakeStatusIdCache()
} = {}) {
  return new DiscoveryObserver({
    browser,
    mastodonClient,
    resourceCache,
    securityStore,
    statusIdCache
  })
}

async function waitForStatusIdCacheRequest (statusIdCache) {
  return Promise.race([
    statusIdCache.requested,
    new Promise((resolve, reject) => {
      setTimeout(
        () => reject(new Error('status ID cache was not requested')),
        100
      )
    })
  ])
}

test('starts without current resource state', () => {
  const observer = createObserver()

  assert.equal(observer.resource, undefined)
  assert.equal(observer.statusId, undefined)
})

test('listens for tab update events', () => {
  const browser = new FakeBrowser()

  createObserver({ browser })

  assert.equal(browser.tabs.onUpdated.listeners.length, 1)
})

test('listens for tab activation events', () => {
  const browser = new FakeBrowser()

  createObserver({ browser })

  assert.equal(browser.tabs.onActivated.listeners.length, 1)
})

test('uses cached resource when active tab changes', async () => {
  const documentFingerprint = {
    url: 'https://example.com/posts/1',
    hash: 'sha256:abc123'
  }
  const resource = {
    id: 'https://example.com/activitypub/objects/1',
    url: 'https://example.com/posts/1'
  }
  const resourceCache = new FakeResourceCache({
    resources: new Map([
      [`${documentFingerprint.url}\n${documentFingerprint.hash}`, resource]
    ])
  })
  const browser = new FakeBrowser({
    messageResponses: new Map([[1, documentFingerprint]])
  })
  const observer = createObserver({ browser, resourceCache })

  browser.tabs.onActivated.emit({ tabId: 1 })
  await resourceCache.requested
  await Promise.resolve()

  assert.deepEqual(browser.sentMessages, [
    {
      tabId: 1,
      message: {
        type: 'getDocumentFingerprint'
      }
    }
  ])
  assert.deepEqual(observer.resource, resource)
  assert.deepEqual(resourceCache.requests, [documentFingerprint])
})

test('uses cached resource when a new document is loaded in the tab', async () => {
  const documentFingerprint = {
    url: 'https://example.com/posts/1',
    hash: 'sha256:abc123'
  }
  const resource = {
    id: 'https://example.com/activitypub/objects/1',
    url: 'https://example.com/posts/1'
  }
  const resourceCache = new FakeResourceCache({
    resources: new Map([
      [`${documentFingerprint.url}\n${documentFingerprint.hash}`, resource]
    ])
  })
  const browser = new FakeBrowser({
    messageResponses: new Map([[1, documentFingerprint]])
  })
  const observer = createObserver({ browser, resourceCache })

  browser.tabs.onUpdated.emit(
    1,
    {
      status: 'complete',
      url: 'https://example.com/posts/1'
    },
    {
      id: 1
    }
  )
  await resourceCache.requested
  await Promise.resolve()

  assert.deepEqual(browser.sentMessages, [
    {
      tabId: 1,
      message: {
        type: 'getDocumentFingerprint'
      }
    }
  ])
  assert.deepEqual(observer.resource, resource)
  assert.deepEqual(resourceCache.requests, [documentFingerprint])
})

test('uses cached status ID for cached resource', async () => {
  const documentFingerprint = {
    url: 'https://example.com/posts/1',
    hash: 'sha256:abc123'
  }
  const resource = {
    id: 'https://example.com/activitypub/objects/1',
    url: 'https://example.com/posts/1'
  }
  const resourceCache = new FakeResourceCache({
    resources: new Map([
      [`${documentFingerprint.url}\n${documentFingerprint.hash}`, resource]
    ])
  })
  const statusIdCache = new FakeStatusIdCache({
    statusIds: new Map([[`mastodon.example\n${resource.id}`, '123']])
  })
  const mastodonClient = new FakeMastodonClient()
  const browser = new FakeBrowser({
    messageResponses: new Map([[1, documentFingerprint]])
  })
  const observer = createObserver({
    browser,
    mastodonClient,
    resourceCache,
    statusIdCache
  })

  browser.tabs.onActivated.emit({ tabId: 1 })
  await waitForStatusIdCacheRequest(statusIdCache)
  await Promise.resolve()

  assert.deepEqual(statusIdCache.getRequests, [
    {
      hostname: 'mastodon.example',
      resource
    }
  ])
  assert.deepEqual(mastodonClient.requests, [])
  assert.equal(observer.statusId, '123')
})

test('resolves status ID for cached resource when status ID is not cached', async () => {
  const documentFingerprint = {
    url: 'https://example.com/posts/1',
    hash: 'sha256:abc123'
  }
  const resource = {
    id: 'https://example.com/activitypub/objects/1',
    url: 'https://example.com/posts/1'
  }
  const accountCredentials = {
    accountIdentity: 'https://mastodon.example/users/example',
    accessToken: 'access-token'
  }
  const resourceCache = new FakeResourceCache({
    resources: new Map([
      [`${documentFingerprint.url}\n${documentFingerprint.hash}`, resource]
    ])
  })
  const securityStore = new FakeSecurityStore({ accountCredentials })
  const statusIdCache = new FakeStatusIdCache()
  const mastodonClient = new FakeMastodonClient({ statusId: '123' })
  const browser = new FakeBrowser({
    messageResponses: new Map([[1, documentFingerprint]])
  })
  const observer = createObserver({
    browser,
    mastodonClient,
    resourceCache,
    securityStore,
    statusIdCache
  })

  browser.tabs.onActivated.emit({ tabId: 1 })
  await waitForStatusIdCacheRequest(statusIdCache)
  await Promise.resolve()

  assert.deepEqual(securityStore.requests, [{}])
  assert.deepEqual(mastodonClient.requests, [
    {
      hostname: 'mastodon.example',
      resource,
      accountCredentials
    }
  ])
  assert.deepEqual(statusIdCache.setRequests, [
    {
      hostname: 'mastodon.example',
      resource,
      statusId: '123'
    }
  ])
  assert.equal(observer.statusId, '123')
})
