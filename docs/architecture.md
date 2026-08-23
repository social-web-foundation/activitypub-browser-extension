# Architecture

## Scenario View

### Goals

The primary goal for milestone 1.0 is to let a user like and unlike ActivityPub objects from ordinary web pages, using their Mastodon account, in a Chromium-compatible browser extension.

The secondary goal is to serve as a test implementation for [ActivityPub HTML Discovery](https://swicg.github.io/activitypub-html-discovery/), exercising discovery from browser-accessible HTML pages to ActivityPub actors and objects.

### Non-Goals

The milestone 1.0 extension is not a full Mastodon or Fediverse client. It does not provide timelines, notifications, search, posting, sharing, following, replying, account management beyond login and logout, or general social-network navigation.

Milestone 1.0 targets the Chromium extension ecosystem only. Firefox compatibility, cross-browser abstraction, and browser-specific packaging for non-Chromium browsers are deferred.

Milestone 1.0 uses Mastodon-compatible APIs only. The standard [ActivityPub client-to-server API](https://www.w3.org/TR/activitypub/#client-to-server-interactions) is deferred.

### Persona

#### Mastodon User

A person with an account on a Mastodon-compatible server who wants to like and unlike ActivityPub objects encountered while browsing the web.

### Use Cases

Milestone 1.0 has seven use cases.

#### Log Into Mastodon Server

The user authenticates with their Mastodon server so the extension can perform social actions on their behalf.

#### Discover ActivityPub Resource On Current Page

The extension identifies whether the current page represents or links to an ActivityPub object using ActivityPub HTML Discovery mechanisms.

Actor discovery may be recognized as part of the discovery result model, but actor-specific actions are outside milestone 1.0.

#### See Whether I Already Liked Object On Current Page

The user sees whether they have already liked the ActivityPub object represented by the current page.

#### Like Object On Current Page

The user likes an ActivityPub object represented by the current browser page.

#### Undo Like Object On Current Page

The user removes their like from the ActivityPub object represented by the current browser page.

#### Log Out Of Mastodon Server

The user removes their authenticated session from the extension.

#### Use Extension In Chromium-Compatible Browser

The user installs and runs the extension in a Chromium-compatible browser using Manifest V3 extension APIs.

### Use-Case Diagram

```mermaid
flowchart LR
    user[Mastodon User]

    subgraph extension[ActivityPub Browser Extension]
        chromium([Use extension in Chromium-compatible browser])
        loginMastodon([Log into Mastodon server])
        discover([Discover ActivityPub resource on current page])
        alreadyLiked([See whether I already liked object on current page])
        like([Like object on current page])
        undoLike([Undo like object on current page])
        logoutMastodon([Log out of Mastodon server])
    end

    user --> chromium
    user --> loginMastodon
    user --> discover
    user --> alreadyLiked
    user --> like
    user --> undoLike
    user --> logoutMastodon

    loginMastodon -. runs in .-> chromium
    discover -. runs in .-> chromium
    alreadyLiked -. requires .-> loginMastodon
    alreadyLiked -. requires .-> discover
    like -. requires .-> discover
    like -. requires .-> loginMastodon
    undoLike -. requires .-> discover
    undoLike -. requires .-> loginMastodon
    logoutMastodon -. requires .-> loginMastodon
```

## Process View

### Log Into Mastodon Server

```mermaid
sequenceDiagram
    actor User as Mastodon User
    participant Login as Login Component
    participant Security as Security Store
    participant Mastodon as Mastodon Server

    User->>Login: Press login button
    Login-->>User: Show login modal with server name input

    alt User cancels
        User->>Login: Cancel login
        Login-->>User: Close login modal
    else User submits server name
        User->>Login: Submit server name
        Login->>Security: Get client credentials for server name
        Security-->>Login: Client credentials or none

        alt No client credentials exist
            Login->>Mastodon: Register client application
            Mastodon-->>Login: Client credentials
            Login->>Security: Store client credentials for server name
        else Client credentials exist
            Login-->>Login: Use stored client credentials
        end

        Login-->>User: Redirect to OAuth 2 authorization endpoint with client credentials
        User->>Mastodon: Request authorization endpoint

        alt User is not logged in to Mastodon
            Mastodon-->>User: Redirect to login page
            User->>Mastodon: Log in
            Mastodon-->>User: Show authorization prompt
        else User is already logged in to Mastodon
            Mastodon-->>User: Show authorization prompt
        end

        alt User cancels authorization
            User->>Mastodon: Cancel authorization
            Mastodon-->>User: Redirect without authorization code
            User->>Login: Request redirect URI without authorization code
            Login-->>User: Show login canceled state
        else User authorizes extension
            User->>Mastodon: Authorize extension
            Mastodon-->>User: Redirect with authorization code
            User->>Login: Request redirect URI with authorization code
            Note over User,Login: Redirect handling mechanism TBD
            Login->>Mastodon: Exchange authorization code for access token
            Mastodon-->>Login: Access token
            Login->>Mastodon: Verify credentials with access token
            Mastodon-->>Login: Account identity
            Login->>Security: Store access token for account identity
            Login->>Security: Set current account identity
            Login-->>User: Show logged-in state
        end
    end
```

### Discover ActivityPub Resource On Current Page

```mermaid
sequenceDiagram
    actor User as Mastodon User
    participant Browser
    participant Observer as Discovery Observer
    participant Cache as Resource Cache
    participant Document as DOM Document
    participant Security as Security Store
    participant Mastodon as Mastodon Server

    User->>Browser: Change current tab document or location
    Browser->>Observer: Notify document or location changed
    Observer->>Observer: Clear current ActivityPub resource
    Observer->>Cache: Get ActivityPub resource for document
    Cache-->>Observer: ActivityPub resource or none

    alt Resource is cached
        Observer->>Observer: Set current ActivityPub resource
    else Resource is not cached
        Observer->>Browser: Get response headers
        Browser-->>Observer: Response headers
        Observer->>Observer: Find ActivityPub Link header

        alt ActivityPub Link header found
            Observer->>Observer: Use Link header resource
        else No ActivityPub Link header found
            Observer->>Browser: Get DOM document
            Browser-->>Observer: DOM document
            Observer->>Document: Find ActivityPub link element
            Document-->>Observer: ActivityPub resource or none

            alt ActivityPub link element found
                Observer->>Observer: Use link element resource
            else No ActivityPub link element found
                Observer->>Document: Find ActivityPub anchor element
                Document-->>Observer: ActivityPub resource or none

                alt ActivityPub anchor element found
                    Observer->>Observer: Use anchor element resource
                else No ActivityPub anchor element found
                    Observer->>Document: Find embedded JSON-LD
                    Document-->>Observer: ActivityPub resource or none

                    alt Embedded JSON-LD found
                        Observer->>Observer: Use embedded JSON-LD resource
                    else No embedded JSON-LD found
                        Observer->>Browser: Fetch document using ActivityPub content negotiation
                        Browser-->>Observer: ActivityPub resource or none

                        alt Content negotiation found ActivityPub resource
                            Observer->>Observer: Use content negotiation resource
                        else Content negotiation did not find ActivityPub resource
                            Observer->>Browser: Fetch WebFinger resource
                            Browser-->>Observer: ActivityPub resource or none

                            alt WebFinger found ActivityPub resource
                                Observer->>Observer: Use WebFinger resource
                            end
                        end
                    end
                end
            end
        end

        alt ActivityPub resource found
            Observer->>Observer: Verify same-origin resource

            alt Same-origin verification succeeds
                Observer->>Observer: Mark resource verified
            else Same-origin verification does not succeed
                Observer->>Security: Get current account identity
                Security-->>Observer: Current account identity or none

                alt Current account identity exists
                    Observer->>Security: Get access token for account identity
                    Security-->>Observer: Access token
                    Observer->>Mastodon: Resolve ActivityPub resource with access token
                    Mastodon-->>Observer: ActivityPub object or none

                    alt ActivityPub object returned
                        Observer->>Observer: Verify object url matches current page
                        alt Object url matches current page
                            Observer->>Observer: Mark resource verified
                        else Object url does not match current page
                            Observer->>Observer: Mark resource not verified
                        end
                    else No ActivityPub object returned
                        Observer->>Observer: Mark resource not verified
                    end
                else No current account identity
                    Observer->>Observer: Mark resource not verified
                end
            end
        else No ActivityPub resource found
            Observer->>Observer: Mark resource not verified
        end

        alt Resource is verified
            Observer->>Cache: Store ActivityPub resource for document
            Note over Observer,Cache: Cache invalidation TBD
            Observer->>Observer: Set current ActivityPub resource
        else Resource is not verified
            Observer->>Observer: Clear current ActivityPub resource
        end
    end
```

### See Whether I Already Liked Object On Current Page

```mermaid
sequenceDiagram
    participant Observer as Discovery Observer
    participant Indicator as Liked Indicator
    participant Security as Security Store
    participant Mastodon as Mastodon Server

    Observer->>Indicator: Notify current ActivityPub resource changed

    alt Current ActivityPub resource exists
        Indicator->>Security: Get current account identity
        Security-->>Indicator: Current account identity or none

        alt Current account identity exists
            Indicator->>Security: Get access token for account identity
            Security-->>Indicator: Access token
            Indicator->>Mastodon: Resolve ActivityPub resource to status ID
            Mastodon-->>Indicator: Status ID or none

            alt Status ID exists
                Indicator->>Mastodon: Get liked state for status ID
                Mastodon-->>Indicator: Liked state
                Indicator->>Indicator: Set liked state
            else No status ID exists
                Indicator->>Indicator: Clear liked state
            end
        else No current account identity
            Indicator->>Indicator: Clear liked state
        end
    else No current ActivityPub resource
        Indicator->>Indicator: Clear liked state
    end
```

### Like Object On Current Page

### Undo Like Object On Current Page

### Log Out Of Mastodon Server

```mermaid
sequenceDiagram
    actor User as Mastodon User
    participant Logout as Logout Component
    participant Security as Security Store

    User->>Logout: Initiate logout
    Logout->>Security: Get current account identity
    Security-->>Logout: Current account identity
    Logout->>Security: Remove access token for account identity
    Logout->>Security: Remove current account identity
    Logout-->>User: Show logged-out state
```

## Logical View

## Development View

## Physical View
