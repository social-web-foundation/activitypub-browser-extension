export class DiscoveryObserver {
  #browser
  #resource
  #statusId

  constructor ({ browser }) {
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
    this.#browser = browser
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

  onActivated (activeInfo) {}

  onUpdated (tabId, changeInfo, tab) {}
}
