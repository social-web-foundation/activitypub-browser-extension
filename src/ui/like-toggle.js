export class LikeToggle {
  constructor ({ discoveryObserver, mastodonClient, securityStore }) {
    this.discoveryObserver = discoveryObserver
    this.mastodonClient = mastodonClient
    this.securityStore = securityStore
    this.likedState = null
  }

  handleResourceChanged () {
    throw new Error('Not implemented')
  }

  initiateLike () {
    throw new Error('Not implemented')
  }

  initiateUndoLike () {
    throw new Error('Not implemented')
  }

  setLikedState (likedState) {
    this.likedState = likedState
  }

  clearLikedState () {
    this.likedState = null
  }
}
