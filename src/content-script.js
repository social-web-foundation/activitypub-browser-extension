globalThis.activityPubBrowserExtensionContentScript = {
  loaded: true
}

if (!globalThis.chrome || typeof globalThis.chrome !== 'object') {
  throw new Error('No chrome global')
}

if (
  !globalThis.chrome.runtime ||
  typeof globalThis.chrome.runtime !== 'object'
) {
  throw new Error('chrome global has invalid runtime')
}

if (
  !globalThis.chrome.runtime.onMessage ||
  typeof globalThis.chrome.runtime.onMessage !== 'object'
) {
  throw new Error('chrome global runtime has invalid onMessage')
}

globalThis.chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if (message && typeof message === 'object') {
      switch (message.type) {
        case 'getDocumentFingerprint':
          getDocumentFingerprint()
            .then(sendResponse)
            .catch(error => {
              sendResponse({
                error: error.message
              })
            })
          return true
        default:
          break
      }
    }
  }
)

async function getDocumentFingerprint () {
  if (!globalThis.document || typeof globalThis.document !== 'object') {
    throw new Error('No document global')
  }

  if (
    !globalThis.document.location ||
    typeof globalThis.document.location !== 'object'
  ) {
    throw new Error('document global has invalid location')
  }

  const url = globalThis.document.location.href

  if (
    !globalThis.document.documentElement ||
    typeof globalThis.document.documentElement !== 'object'
  ) {
    throw new Error('document global has invalid documentElement')
  }

  const text = globalThis.document.documentElement.outerHTML

  const bytes = new TextEncoder().encode(text)

  if (!globalThis.crypto || typeof globalThis.crypto !== 'object') {
    throw new Error('No crypto global runtime')
  }

  if (
    !globalThis.crypto.subtle ||
    typeof globalThis.crypto.subtle !== 'object'
  ) {
    throw new Error('No subtle property of crypto global runtime')
  }

  const buffer = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  const hash =
    'sha256:' +
    [...new Uint8Array(buffer)]
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')

  return { url, hash }
}
