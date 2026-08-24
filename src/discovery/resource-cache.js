export class ResourceCache {
  #storage

  constructor ({ storage }) {
    if (!storage) {
      throw new Error('storage argument missing')
    }
    this.#storage = storage
  }

  async getActivityPubResource ({ url, hash }) {
    if (!url || typeof url !== 'string') {
      throw new Error('invalid url argument')
    }
    if (!hash || typeof hash !== 'string') {
      throw new Error('invalid hash argument')
    }
    const key = this.#resourceKey(url, hash)
    const obj = await this.#storage.get(key)
    return obj[key] ?? null
  }

  async setActivityPubResource ({ url, hash }, resource) {
    if (!url || typeof url !== 'string') {
      throw new Error('invalid url argument')
    }
    if (!hash || typeof hash !== 'string') {
      throw new Error('invalid hash argument')
    }
    if (!resource || typeof resource !== 'object') {
      throw new Error('invalid resource argument')
    }
    const key = this.#resourceKey(url, hash)
    await this.#storage.set({ [key]: resource })
  }

  #resourceKey (url, hash) {
    return `resourcecache:resource:${url}:${hash}`
  }
}
