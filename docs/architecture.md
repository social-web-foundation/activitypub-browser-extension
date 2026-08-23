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

## Logical View

## Process View

## Development View

## Physical View
