# Logical View

```mermaid
classDiagram
    class LoginComponent {
        +pressLogin()
        +submitServerName(serverName)
        +cancelLogin()
        +handleAuthorizationRedirect(request)
    }

    class LogoutComponent {
        +initiateLogout()
    }

    class DiscoveryObserver {
        -currentActivityPubResource ActivityPubResource
        -currentStatusId StatusId
        +handleDocumentChanged(document)
        +getCurrentActivityPubResource() ActivityPubResource
        +getCurrentStatusId() StatusId
        -clearCurrentActivityPubResource()
        -clearCurrentStatusId()
        -setCurrentActivityPubResource(resource)
        -setCurrentStatusId(statusId)
    }

    class LikeToggle {
        -likedState boolean
        +handleResourceChanged()
        +initiateLike()
        +initiateUndoLike()
        -setLikedState(likedState)
        -clearLikedState()
    }

    class SecurityStore {
        +getClientCredentials(serverName) ClientCredentials
        +storeClientCredentials(serverName, credentials)
        +storeAccessToken(accountIdentity, accessToken)
        +setCurrentAccountIdentity(accountIdentity)
        +getCurrentAccountIdentity() AccountIdentity
        +getAccountCredentials() AccountCredentials
        +removeAccessToken(accountIdentity)
        +removeCurrentAccountIdentity()
    }

    class ResourceCache {
        +getActivityPubResource(document) ActivityPubResource
        +storeActivityPubResource(document, resource)
    }

    class BrowserAdapter {
        +getResponseHeaders(document)
        +getDomDocument()
        +fetchWithActivityPubContentNegotiation(url) ActivityPubResource
        +fetchWebFingerResource(url) ActivityPubResource
    }

    class MastodonClient {
        +registerClientApplication(serverName) ClientCredentials
        +exchangeAuthorizationCode(code) AccessToken
        +verifyCredentials(accessToken) AccountIdentity
        +resolveActivityPubResource(resource, credentials) ActivityPubResource
        +resolveActivityPubResourceToStatusId(resource, credentials) StatusId
        +getLikedState(statusId, credentials) boolean
        +likeStatus(statusId, credentials) boolean
        +undoLikeStatus(statusId, credentials) boolean
    }

    class AccountCredentials {
        +accountIdentity AccountIdentity
        +accessToken AccessToken
    }

    class ClientCredentials {
        +clientId string
        +clientSecret string
    }

    class ActivityPubResource {
        +id string
        +url string
    }

    class StatusId {
        +value string
    }

    class AccountIdentity {
        +id string
        +serverName string
    }

    class AccessToken {
        +value string
    }

    LoginComponent --> SecurityStore
    LoginComponent --> MastodonClient
    LogoutComponent --> SecurityStore
    DiscoveryObserver --> BrowserAdapter
    DiscoveryObserver --> ResourceCache
    DiscoveryObserver --> SecurityStore
    DiscoveryObserver --> MastodonClient
    DiscoveryObserver --> ActivityPubResource
    DiscoveryObserver --> StatusId
    LikeToggle --> DiscoveryObserver
    LikeToggle --> SecurityStore
    LikeToggle --> MastodonClient
    SecurityStore --> ClientCredentials
    SecurityStore --> AccountCredentials
    AccountCredentials --> AccountIdentity
    AccountCredentials --> AccessToken
    MastodonClient --> ClientCredentials
    MastodonClient --> AccountCredentials
    MastodonClient --> ActivityPubResource
    MastodonClient --> StatusId
    ResourceCache --> ActivityPubResource
```
