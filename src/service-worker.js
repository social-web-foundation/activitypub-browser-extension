import { DiscoveryObserver } from './discovery/discovery-observer.js'
import { ResourceCache } from './discovery/resource-cache.js'
import { BrowserAdapter } from './discovery/browser-adapter.js'
import { MastodonClient } from './mastodon/mastodon-client.js'
import { SecurityStore } from './security/security-store.js'
import { LoginComponent } from './ui/login-component.js'
import { LogoutComponent } from './ui/logout-component.js'
import { LikeToggle } from './ui/like-toggle.js'

const securityStore = new SecurityStore()
const mastodonClient = new MastodonClient()
const browserAdapter = new BrowserAdapter()
const resourceCache = new ResourceCache()
const discoveryObserver = new DiscoveryObserver({
  browserAdapter,
  mastodonClient,
  resourceCache,
  securityStore
})

const loginComponent = new LoginComponent({
  mastodonClient,
  securityStore
})

const logoutComponent = new LogoutComponent({
  securityStore
})

const likeToggle = new LikeToggle({
  discoveryObserver,
  mastodonClient,
  securityStore
})

globalThis.activityPubExtension = {
  discoveryObserver,
  likeToggle,
  loginComponent,
  logoutComponent
}
