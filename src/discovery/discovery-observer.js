export class DiscoveryObserver {
  #browser
  #resourceCache
  #resource
  #statusId

  constructor ({ browser, resourceCache }) {
    if (
      !browser ||
      typeof browser !== 'object' ||
      !browser.tabs ||
      typeof browser.tabs !== 'object' ||
      !browser.tabs.onActivated ||
      typeof browser.tabs.onActivated !== 'object' ||
      !browser.tabs.onUpdated ||
      typeof browser.tabs.onUpdated !== 'object'
    ) {
      throw new Error('browser argument invalid')
    }
    if (!resourceCache || typeof resourceCache !== 'object') {
      throw new Error('resourceCache argument invalid')
    }
    this.#browser = browser
    this.#resourceCache = resourceCache
    this.#browser.tabs.onActivated.addListener(activeInfo =>
      this.onActivated(activeInfo)
    )
    this.#browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) =>
      this.onUpdated(tabId, changeInfo, tab)
    )
  }

  get resource () {
    return this.#resource
  }

  get statusId () {
    return this.#statusId
  }

  onActivated (activeInfo) {
    this.#clearState()
    this.#getDocumentFingerprint(activeInfo.tabId)
      .then(result => this.#discover(result))
      .catch(err => console.error(err))
  }

  onUpdated (tabId, changeInfo, tab) {
    if (!changeInfo || typeof changeInfo !== 'object') {
      throw new Error('invalid changeInfo argument')
    }
    if (changeInfo.status == 'complete') {
      this.#clearState()
      this.#getDocumentFingerprint(tabId)
        .then(result => this.#discover(result))
        .catch(err => console.error(err))
    }
  }

  #clearState () {
    this.#resource = null
    this.#statusId = null
  }

  async #getDocumentFingerprint (tabId) {
    const result = await this.#browser.tabs.sendMessage(tabId, {
      type: 'getDocumentFingerprint'
    })
    if (result.error) {
      throw new Error(result.error)
    } else {
      return result
    }
  }

  async #discover (fingerprint) {
    const resource = await this.#resourceCache.getActivityPubResource(
      fingerprint
    )
    if (resource) {
      this.#resource = resource
    }
  }
}
