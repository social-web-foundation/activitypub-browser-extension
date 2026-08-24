export class LogoutComponent {
  constructor ({ securityStore }) {
    this.securityStore = securityStore
  }

  selectLogoutMenuItem () {
    throw new Error('Not implemented')
  }
}
