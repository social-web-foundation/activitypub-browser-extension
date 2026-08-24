export class ResourceCache {
  constructor () {
    this.resources = new Map()
  }

  getActivityPubResource (documentId) {
    return this.resources.get(documentId) ?? null
  }

  storeActivityPubResource (documentId, resource) {
    this.resources.set(documentId, resource)
  }
}
