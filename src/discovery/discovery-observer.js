export class DiscoveryObserver {
  constructor ({ browserAdapter, mastodonClient, resourceCache, securityStore }) {
    this.browserAdapter = browserAdapter
    this.mastodonClient = mastodonClient
    this.resourceCache = resourceCache
    this.securityStore = securityStore
    this.currentActivityPubResource = null
    this.currentStatusId = null
  }

  handleDocumentChanged () {
    this.clearCurrentActivityPubResource()
    this.clearCurrentStatusId()
  }

  getCurrentActivityPubResource () {
    return this.currentActivityPubResource
  }

  getCurrentStatusId () {
    return this.currentStatusId
  }

  clearCurrentActivityPubResource () {
    this.currentActivityPubResource = null
  }

  clearCurrentStatusId () {
    this.currentStatusId = null
  }

  setCurrentActivityPubResource (resource) {
    this.currentActivityPubResource = resource
  }

  setCurrentStatusId (statusId) {
    this.currentStatusId = statusId
  }
}
