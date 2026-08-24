export class SecurityStore {
  #storage

  constructor ({ storage }) {
    if (!storage) {
      throw new Error('storage argument not defined')
    }
    this.#storage = storage
  }

  async getClientCredentials (hostname) {
    if (!hostname) {
      throw new Error('hostname argument not defined')
    }
    return (
      (await this.#storage.get(this.#clientCredentialsKey(hostname))) ?? null
    )
  }

  async setClientCredentials (hostname, { clientId, clientSecret }) {
    if (!hostname) {
      throw new Error('hostname argument not defined')
    }
    if (!clientId) {
      throw new Error('clientId argument not defined')
    }
    if (!clientSecret) {
      throw new Error('clientSecret argument not defined')
    }
    await this.#storage.set(this.#clientCredentialsKey(hostname), {
      clientId,
      clientSecret
    })
  }

  async setAccessToken (accountIdentity, accessToken) {
    if (!accountIdentity || typeof accountIdentity !== 'string') {
      throw new Error('accountIdentity argument not defined')
    }
    if (!accessToken || typeof accessToken !== 'string') {
      throw new Error('accessToken argument not defined')
    }
    await this.#storage.set(this.#accessTokenKey(accountIdentity), accessToken)
  }

  async setCurrentAccountIdentity (accountIdentity) {
    if (!accountIdentity || typeof accountIdentity !== 'string') {
      throw new Error('accountIdentity argument not defined')
    }
    await this.#storage.set(this.#currentAccountIdKey(), accountIdentity)
  }

  async getCurrentAccountIdentity () {
    return (await this.#storage.get(this.#currentAccountIdKey())) ?? null
  }

  async getAccountCredentials () {
    const accountIdentity = await this.getCurrentAccountIdentity()
    if (!accountIdentity) {
      return null
    }
    const accessToken = await this.#storage.get(
      this.#accessTokenKey(accountIdentity)
    )
    if (!accessToken) {
      return null
    }
    return { accountIdentity, accessToken }
  }

  async removeAccessToken (accountIdentity) {
    if (!accountIdentity || typeof accountIdentity !== 'string') {
      throw new Error('accountIdentity argument not defined')
    }
    await this.#storage.remove(this.#accessTokenKey(accountIdentity))
  }

  async removeCurrentAccountIdentity () {
    await this.#storage.remove(this.#currentAccountIdKey())
  }

  #clientCredentialsKey (hostname) {
    return `securitystore:clientcredentials:${hostname}`
  }

  #accessTokenKey (accountIdentity) {
    return `securitystore:accesstoken:${accountIdentity}`
  }

  #currentAccountIdKey () {
    return `securitystore:current:accountid`
  }
}
