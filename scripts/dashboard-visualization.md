# Admin Dashboard Architecture (Mermaid Syntax)

This file contains Mermaid.js syntax for visualizing the architecture of a potential admin dashboard for the `newnails-be` service.

## Admin Dashboard Data Flow

This diagram shows how data from different sources flows through the backend API to populate the components of a web-based admin dashboard.

```mermaid
graph TD
    subgraph "Data Sources"
        MongoDB["MongoDB Atlas (Designs & Users)"]
        Firebase["Firebase API (User Auth Data)"]
        AppLogs["Application Logs (e.g., Vercel)"]
    end

    subgraph "Backend API Endpoints"
        A1["/api/admin/stats"]
        A2["/api/admin/recent-designs"]
        A3["/api/admin/users"]
        A4["/api/admin/logs"]
    end

    subgraph "Admin Dashboard UI (Web Interface)"
        C1["Component: Key Metrics (Total Users, Designs Generated)"]
        C2["Component: Recent Activity Feed"]
        C3["Component: User Management Table"]
        C4["Component: Error & Performance Logs"]
    end

    %% Data Flow Connections
    MongoDB -- "Aggregates design & user counts" --> A1
    Firebase -- "Fetches total user count" --> A1
    A1 --> C1

    MongoDB -- "Fetches latest designs" --> A2
    A2 --> C2

    MongoDB -- "Fetches user list" --> A3
    Firebase -- "Fetches user details" --> A3
    A3 --> C3

    AppLogs -- "Streams logs" --> A4
    A4 --> C4
```

### How to Use This

1.  Go to [Mermaidchart.com](https://www.mermaidchart.com/).
2.  Create a new diagram.
3.  Copy the code block above (the part inside the ```mermaid ... ```).
4.  Paste it into the code editor on Mermaidchart.
5.  The site will automatically generate the visual flowchart diagram for you.
