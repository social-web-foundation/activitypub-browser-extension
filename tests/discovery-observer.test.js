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
  async getAccountCredentials () {
    return {
      accountIdentity: 'https://mastodon.example/users/example',
      accessToken: 'access-token'
    }
  }
}

class FakeMastodonClient {
  async resolveActivityPubResourceToStatusId () {
    return {
      value: '123'
    }
  }
}

function createObserver ({
  browser = new FakeBrowser(),
  mastodonClient = new FakeMastodonClient(),
  resourceCache = new FakeResourceCache(),
  securityStore = new FakeSecurityStore()
} = {}) {
  return new DiscoveryObserver({
    browser,
    mastodonClient,
    resourceCache,
    securityStore
  })
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
    resources: new Map([[`${documentFingerprint.url}\n${documentFingerprint.hash}`, resource]])
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
    resources: new Map([[`${documentFingerprint.url}\n${documentFingerprint.hash}`, resource]])
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
