export class LoginComponent {
  constructor ({ mastodonClient, securityStore }) {
    this.mastodonClient = mastodonClient
    this.securityStore = securityStore
  }

  selectLoginMenuItem () {
    throw new Error('Not implemented')
  }

  submitServerName () {
    throw new Error('Not implemented')
  }

  cancelLogin () {
    throw new Error('Not implemented')
  }

  handleAuthorizationRedirect () {
    throw new Error('Not implemented')
  }
}
