# Backend Architecture Diagrams (Mermaid Syntax)

This file contains Mermaid.js diagrams for the `newnails-be` backend architecture.

## 1. High-Level Component Diagram

This diagram shows the overall architecture, including the client, the Next.js application, external services, and the database.

```mermaid
graph TD
    subgraph "External Services"
        Imagerouter["imagerouter.io API"]
        VercelBlob["Vercel Blob Storage"]
        MongoDB["MongoDB Atlas"]
        FirebaseService["Firebase Authentication Service"]
    end

    subgraph "Client"
        MobileApp["Mobile App (newnails-fe)"]
    end

    subgraph "Next.js Backend (newnails-be)"
        FirebaseMiddleware["Firebase Middleware"]
        
        subgraph "API Routes"
            GenerateAPI["/api/generate"]
            SaveDesignAPI["/api/save-design"]
            MyDesignsAPI["/api/my-designs"]
            DesignsAPI["/api/designs/[designId]"]
            WebhooksAPI["/api/webhooks/firebase"]
        end

        subgraph "Core Logic"
            RateLimiter["utils/rateLimiter.ts"]
            ImageRouterUtil["utils/imageRouter.ts"]
            DBConnector["lib/db.ts"]
        end
    end

    %% Connections
    MobileApp --> FirebaseMiddleware
    FirebaseMiddleware --> API_Routes
    
    subgraph API_Routes
        GenerateAPI
        SaveDesignAPI
        MyDesignsAPI
        DesignsAPI
        WebhooksAPI
    end

    GenerateAPI --> RateLimiter
    GenerateAPI --> ImageRouterUtil
    
    SaveDesignAPI --> RateLimiter
    SaveDesignAPI --> DBConnector
    SaveDesignAPI --> VercelBlob

    MyDesignsAPI --> DBConnector
    DesignsAPI --> DBConnector
    DesignsAPI -- Deletes from --> VercelBlob

    ImageRouterUtil --> Imagerouter
    DBConnector --> MongoDB
    
    FirebaseService --> WebhooksAPI
```

## 2. Sequence Diagram: Generate & Save Design Flow

This diagram details the step-by-step process from a user requesting a design to it being saved in their collection.

```mermaid
sequenceDiagram
    participant User as "User (Mobile App)"
    participant Backend as "Next.js Backend"
    participant Firebase as "Firebase Middleware"
    participant RateLimit as "Rate Limiter"
    participant ImageRouter as "ImageRouter.io"
    participant VercelBlob as "Vercel Blob"
    participant MongoDB as "MongoDB Atlas"

    User->>+Backend: POST /api/generate (with design params & auth token)
    Backend->>+Firebase: Verify auth token
    Firebase-->>-Backend: Token valid
    Backend->>+RateLimit: Check daily generation limit for user
    RateLimit-->>-Backend: Limit OK
    Backend->>+ImageRouter: Request image generation
    ImageRouter-->>-Backend: Return temporary image URLs
    Backend-->>-User: Here are your generated designs

    User->>+Backend: POST /api/save-design (with temp URL & auth token)
    Backend->>+Firebase: Verify auth token
    Firebase-->>-Backend: Token valid
    Backend->>+RateLimit: Check total storage limit for user
    RateLimit-->>-Backend: Limit OK
    Backend->>+VercelBlob: Upload image from temporary URL
    VercelBlob-->>-Backend: Return new permanent URL
    Backend->>+MongoDB: Save design with permanent URL and user ID
    MongoDB-->>-Backend: Confirm save
    Backend-->>-User: Design saved successfully!
```
