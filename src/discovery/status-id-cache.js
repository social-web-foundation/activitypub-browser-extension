export class StatusIdCache {
  #storage

  constructor ({ storage }) {
    if (!storage) {
      throw new Error('storage argument missing')
    }
    this.#storage = storage
  }

  async setStatusId (hostname, resource, statusId) {
    if (!hostname || typeof hostname !== 'string') {
      throw new Error('invalid hostname argument')
    }
    if (
      !resource ||
      typeof resource !== 'object' ||
      !resource.id ||
      typeof resource.id !== 'string'
    ) {
      throw new Error('invalid resource argument')
    }
    if (!statusId || typeof statusId !== 'string') {
      throw new Error('invalid statusId argument')
    }
    const key = this.#statusIdKey(hostname, resource)
    await this.#storage.set({ [key]: statusId })
  }

  async getStatusId (hostname, resource) {
    if (!hostname || typeof hostname !== 'string') {
      throw new Error('invalid hostname argument')
    }
    if (
      !resource ||
      typeof resource !== 'object' ||
      !resource.id ||
      typeof resource.id !== 'string'
    ) {
      throw new Error('invalid resource argument')
    }
    const key = this.#statusIdKey(hostname, resource)
    const obj = await this.#storage.get(key)
    return obj[key] ?? null
  }

  #statusIdKey (hostname, resource) {
    return `statusidcache:statusid:${hostname}:${resource.id}`
  }
}
