export class DiscoveryObserver extends EventTarget {
  #browser
  #resourceCache
  #resource
  #statusId
  #mastodonClient
  #securityStore
  #statusIdCache

  constructor ({
    browser,
    resourceCache,
    mastodonClient,
    securityStore,
    statusIdCache
  }) {
    super()
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
    if (!mastodonClient || typeof mastodonClient !== 'object') {
      throw new Error('mastodonClient argument invalid')
    }
    if (!securityStore || typeof securityStore !== 'object') {
      throw new Error('securityStore argument invalid')
    }
    if (!statusIdCache || typeof statusIdCache !== 'object') {
      throw new Error('statusIdCache argument invalid')
    }
    this.#browser = browser
    this.#resourceCache = resourceCache
    this.#mastodonClient = mastodonClient
    this.#securityStore = securityStore
    this.#statusIdCache = statusIdCache
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
    if (changeInfo.status === 'complete') {
      this.#clearState()
      this.#getDocumentFingerprint(tabId)
        .then(result => this.#discover(result))
        .catch(err => console.error(err))
    }
  }

  #clearState () {
    this.#setResource(null)
    this.#setStatusId(null)
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
    const resource = await this.#discoverResource(fingerprint)
    if (!resource) {
      return
    }

    this.#setResource(resource)

    const credentials = await this.#securityStore.getAccountCredentials()
    if (!credentials) {
      return
    }

    const hostname = this.#actorIdToHostname(credentials.accountIdentity)
    if (!hostname) {
      return
    }

    const statusId = await this.#discoverStatusId(
      hostname,
      resource,
      credentials
    )
    if (!statusId) {
      return
    }

    this.#setStatusId(statusId)
  }

  #actorIdToHostname (actorId) {
    const url = new URL(actorId)
    return url.hostname
  }

  async #discoverResource (fingerprint) {
    let resource = await this.#resourceCache.getActivityPubResource(fingerprint)
    if (!resource) {
      resource = await this.#discoverResourceByHeaders(fingerprint)
    }
    if (!resource) {
      resource = await this.#discoverResourceByLinkElement(fingerprint)
    }
    if (!resource) {
      resource = await this.#discoverResourceByAElement(fingerprint)
    }
    if (!resource) {
      resource = await this.#discoverResourceByEmbeddedJSONLD(fingerprint)
    }
    if (!resource) {
      resource = await this.#discoverResourceByContentNegotiation(fingerprint)
    }
    if (!resource) {
      resource = await this.#discoverResourceByWebfinger(fingerprint)
    }
    return resource
  }

  async #discoverResourceByHeaders (fingerprint) {
    return null
  }

  async #discoverResourceByLinkElement (fingerprint) {
    return null
  }

  async #discoverResourceByAElement (fingerprint) {
    return null
  }

  async #discoverResourceByEmbeddedJSONLD (fingerprint) {
    return null
  }

  async #discoverResourceByContentNegotiation (fingerprint) {
    return null
  }

  async #discoverResourceByWebfinger (fingerprint) {
    return null
  }

  async #discoverStatusId (hostname, resource, credentials) {
    let statusId = await this.#statusIdCache.getStatusId(hostname, resource)
    if (!statusId) {
      statusId =
        await this.#mastodonClient.resolveActivityPubResourceToStatusId(
          hostname,
          credentials,
          resource
        )
      if (statusId) {
        await this.#statusIdCache.setStatusId(hostname, resource, statusId)
      }
    }
    return statusId
  }

  #setResource (resource) {
    this.#resource = resource
    this.dispatchEvent(
      new CustomEvent('resourcechanged', {
        detail: { resource }
      })
    )
  }

  #setStatusId (statusId) {
    this.#statusId = statusId
    this.dispatchEvent(
      new CustomEvent('statusidchanged', {
        detail: { statusId }
      })
    )
  }
}
