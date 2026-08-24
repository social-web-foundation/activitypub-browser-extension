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
  constructor () {
    this.tabs = {
      onActivated: new FakeEvent(),
      onUpdated: new FakeEvent()
    }
  }
}

function createObserver ({ browser = new FakeBrowser() } = {}) {
  return new DiscoveryObserver({
    browser,
    mastodonClient: {},
    resourceCache: {},
    securityStore: {}
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
