export class SecurityStore {
  #storage

  constructor ({ storage }) {
    if (!storage) {
      throw new Error('storage argument not defined')
    }
    this.#storage = storage
  }

  async getClientCredentials (hostname) {
    if (!hostname || typeof hostname !== 'string') {
      throw new Error('hostname argument not defined')
    }
    const key = this.#clientCredentialsKey(hostname)
    const obj = await this.#storage.get(key)
    return obj[key] ?? null
  }

  async setClientCredentials (hostname, { clientId, clientSecret }) {
    if (!hostname || typeof hostname !== 'string') {
      throw new Error('hostname argument not defined')
    }
    if (!clientId) {
      throw new Error('clientId argument not defined')
    }
    if (!clientSecret) {
      throw new Error('clientSecret argument not defined')
    }
    const key = this.#clientCredentialsKey(hostname)
    await this.#storage.set({
      [key]: {
        clientId,
        clientSecret
      }
    })
  }

  async setAccessToken (accountIdentity, accessToken) {
    if (!accountIdentity || typeof accountIdentity !== 'string') {
      throw new Error('accountIdentity argument not defined')
    }
    if (!accessToken || typeof accessToken !== 'string') {
      throw new Error('accessToken argument not defined')
    }
    const key = this.#accessTokenKey(accountIdentity)
    await this.#storage.set({ [key]: accessToken })
  }

  async setCurrentAccountIdentity (accountIdentity) {
    if (!accountIdentity || typeof accountIdentity !== 'string') {
      throw new Error('accountIdentity argument not defined')
    }
    const key = this.#currentAccountIdKey()
    await this.#storage.set({ [key]: accountIdentity })
  }

  async getCurrentAccountIdentity () {
    const key = this.#currentAccountIdKey()
    const obj = await this.#storage.get(key)
    return obj[key] ?? null
  }

  async getAccountCredentials () {
    const accountIdentity = await this.getCurrentAccountIdentity()
    if (!accountIdentity) {
      return null
    }
    const key = this.#accessTokenKey(accountIdentity)
    const obj = await this.#storage.get(key)
    const accessToken = obj[key] ?? null
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
    return 'securitystore:current:accountid'
  }
}
