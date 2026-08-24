import test from 'node:test'
import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'

class FakeEvent {
  constructor () {
    this.listeners = []
  }

  addListener (listener) {
    this.listeners.push(listener)
  }
}

function createDocument () {
  return {
    location: {
      href: 'https://example.com/posts/1'
    },
    documentElement: {
      outerHTML: '<html><body><article>Example</article></body></html>'
    }
  }
}

async function loadContentScript ({ crypto = webcrypto } = {}) {
  const chrome = {
    runtime: {
      onMessage: new FakeEvent()
    }
  }

  const previousChrome = Object.getOwnPropertyDescriptor(globalThis, 'chrome')
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const previousCrypto = Object.getOwnPropertyDescriptor(globalThis, 'crypto')

  Object.defineProperty(globalThis, 'chrome', {
    configurable: true,
    value: chrome
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: createDocument()
  })
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: crypto
  })

  await import(`../src/content-script.js?test=${Date.now()}-${Math.random()}`)

  return {
    chrome,
    restore () {
      restoreGlobal('chrome', previousChrome)
      restoreGlobal('document', previousDocument)
      restoreGlobal('crypto', previousCrypto)
    }
  }
}

function restoreGlobal (name, descriptor) {
  if (descriptor) {
    Object.defineProperty(globalThis, name, descriptor)
  } else {
    delete globalThis[name]
  }
}

test('registers a document fingerprint message handler', async () => {
  const contentScript = await loadContentScript()

  try {
    assert.equal(contentScript.chrome.runtime.onMessage.listeners.length, 1)
  } finally {
    contentScript.restore()
  }
})

test('responds to getDocumentFingerprint messages', async () => {
  const contentScript = await loadContentScript()

  try {
    const response = new Promise(resolve => {
      const keepChannelOpen = contentScript.chrome.runtime.onMessage.listeners[0](
        {
          type: 'getDocumentFingerprint'
        },
        {},
        resolve
      )

      assert.equal(keepChannelOpen, true)
    })

    assert.deepEqual(await response, {
      url: 'https://example.com/posts/1',
      hash: 'sha256:c4da8b1144bcb65b5474ebb70488a1bcea3680b9617a020e10188a78a87588ac'
    })
  } finally {
    contentScript.restore()
  }
})

test('responds with an error when document fingerprinting fails', async () => {
  const contentScript = await loadContentScript({
    crypto: {
      subtle: {
        async digest () {
          throw new Error('digest failed')
        }
      }
    }
  })

  try {
    const response = new Promise(resolve => {
      const keepChannelOpen = contentScript.chrome.runtime.onMessage.listeners[0](
        {
          type: 'getDocumentFingerprint'
        },
        {},
        resolve
      )

      assert.equal(keepChannelOpen, true)
    })

    assert.deepEqual(await response, {
      error: 'digest failed'
    })
  } finally {
    contentScript.restore()
  }
})
