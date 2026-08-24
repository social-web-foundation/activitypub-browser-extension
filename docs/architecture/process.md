# Process View

## Log Into Mastodon Server

```mermaid
sequenceDiagram
    actor User as Mastodon User
    participant Login as Login Component
    participant Security as Security Store
    participant Mastodon as Mastodon Server

    User->>Login: Select login menu item
    Login-->>User: Show login dialog with server name input

    alt User cancels
        User->>Login: Cancel login
        Login-->>User: Close login dialog
    else User submits server name
        User->>Login: Submit server name
        Login->>Security: Get client credentials for server name
        Security-->>Login: Client credentials or none

        alt No client credentials exist
            Login->>Mastodon: Register client application
            Mastodon-->>Login: Client credentials
            Login->>Security: Set client credentials for server name
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
            Login->>Security: Set access token for account identity
            Login->>Security: Set current account identity
            Login-->>User: Show logged-in state
        end
    end
```

## Discover ActivityPub Resource On Current Page

```mermaid
sequenceDiagram
    actor User as Mastodon User
    participant Browser
    participant Observer as Discovery Observer
    participant Cache as Resource Cache
    participant Document as DOM Document
    participant Security as Security Store
    participant Mastodon as Mastodon Server

    Note over Observer: Precondition: current account identity exists
    User->>Browser: Change current tab document or location
    Browser->>Observer: Notify document or location changed
    Observer->>Observer: Clear current ActivityPub resource
    Observer->>Observer: Clear current status ID
    Observer->>Cache: Get ActivityPub resource for document
    Cache-->>Observer: ActivityPub resource or none

    alt Resource is cached
        Observer->>Security: Get account credentials
        Security-->>Observer: Account credentials
        Observer->>Mastodon: Resolve ActivityPub resource to status ID
        Mastodon-->>Observer: Status ID or none
        Observer->>Observer: Set current status ID

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
                Observer->>Security: Get account credentials
                Security-->>Observer: Account credentials

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
            end
        else No ActivityPub resource found
            Observer->>Observer: Mark resource not verified
        end

        alt Resource is verified
            Observer->>Security: Get account credentials
            Security-->>Observer: Account credentials

            Observer->>Mastodon: Resolve ActivityPub resource to status ID
            Mastodon-->>Observer: Status ID or none
            Observer->>Observer: Set current status ID

            Observer->>Cache: Store ActivityPub resource for document
            Note over Observer,Cache: Cache invalidation TBD
            Observer->>Observer: Set current ActivityPub resource
        else Resource is not verified
            Observer->>Observer: Clear current ActivityPub resource
            Observer->>Observer: Clear current status ID
        end
    end
```

## See Whether I Already Liked Object On Current Page

```mermaid
sequenceDiagram
    participant Observer as Discovery Observer
    participant Toggle as Like Toggle
    participant Security as Security Store
    participant Mastodon as Mastodon Server

    Note over Toggle: Precondition: current account identity exists
    Observer->>Toggle: Notify current ActivityPub resource changed

    Toggle->>Observer: Get current status ID
    Observer-->>Toggle: Current status ID or none

    alt Current status ID exists
        Toggle->>Security: Get account credentials
        Security-->>Toggle: Account credentials
        Toggle->>Mastodon: Get liked state for current status ID
        Mastodon-->>Toggle: Liked state
        Toggle->>Toggle: Set liked state
    else No current status ID
        Toggle->>Toggle: Clear liked state
    end
```

## Like Object On Current Page

```mermaid
sequenceDiagram
    actor User as Mastodon User
    participant Toggle as Like Toggle
    participant Observer as Discovery Observer
    participant Security as Security Store
    participant Mastodon as Mastodon Server

    Note over Toggle: Preconditions: liked state == false, current account identity exists, current status ID exists
    User->>Toggle: Initiate like
    Toggle->>Observer: Get current status ID
    Observer-->>Toggle: Current status ID
    Toggle->>Security: Get account credentials
    Security-->>Toggle: Account credentials
    Toggle->>Mastodon: Like current status ID
    Mastodon-->>Toggle: Liked state
    Toggle->>Toggle: Set liked state
```

## Undo Like Object On Current Page

```mermaid
sequenceDiagram
    actor User as Mastodon User
    participant Toggle as Like Toggle
    participant Observer as Discovery Observer
    participant Security as Security Store
    participant Mastodon as Mastodon Server

    Note over Toggle: Preconditions: liked state == true, current account identity exists, current status ID exists
    User->>Toggle: Initiate undo like
    Toggle->>Observer: Get current status ID
    Observer-->>Toggle: Current status ID
    Toggle->>Security: Get account credentials
    Security-->>Toggle: Account credentials
    Toggle->>Mastodon: Undo like for current status ID
    Mastodon-->>Toggle: Liked state
    Toggle->>Toggle: Set liked state
```

## Log Out Of Mastodon Server

```mermaid
sequenceDiagram
    actor User as Mastodon User
    participant Logout as Logout Component
    participant Security as Security Store

    User->>Logout: Select logout menu item
    Logout->>Security: Get current account identity
    Security-->>Logout: Current account identity
    Logout->>Security: Remove access token for account identity
    Logout->>Security: Remove current account identity
    Logout-->>User: Show logged-out state
```
