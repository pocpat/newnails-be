# 💅 Dipsy API: The Backend for the AI Nail Art Studio

Welcome to the server-side of **Dipsy**, the AI-powered nail art design application. This backend is built with Next.js and serves as the brain for both the mobile and web frontends.

---

### ✨ Core Technologies

-   **Framework**: ▲ Next.js (App Router)
-   **Language**: 🔵 TypeScript
-   **Database**: 🍃 MongoDB with Mongoose
-   **Authentication**: 🔥 Firebase Authentication
-   **Image Storage**: ▲ Vercel Blob
-   **AI Generation**: 🤖 imagerouter.io

---

### 🚀 Key Features

-   **User Management**: Secure user registration and login handled by Firebase.
-   **AI-Powered Generation**: Takes raw user selections (length, shape, style, color) and constructs detailed prompts to generate unique nail art images.
-   **Design Management**: A full suite of CRUD APIs to create, retrieve, and manage user-saved designs.
-   **Rate Limiting**: Built-in limits to ensure fair usage (20 generations/day, 40 saved designs/user).
-   **Fun Facts**: An extra endpoint to provide entertaining facts to users during loading states.

---

### 🔌 API Endpoints

All endpoints are protected and require a valid Firebase JWT.

-   `POST /api/generate`
    -   **Action**: Generates a set of nail art images based on user selections.
    -   **Body**: `{ "length": "short", "shape": "round", "style": "french", "color": "contrast", "baseColor": "#ff0000" }`
-   `POST /api/save-design`
    -   **Action**: Saves a generated image to the user's collection.
    -   **Body**: `{ "imageUrl": "https://temp-url.com/image.png" }`
-   `GET /api/my-designs`
    -   **Action**: Fetches all saved designs for the authenticated user.
-   `DELETE /api/designs/:designId`
    -   **Action**: Deletes a specific design.
-   `PATCH /api/designs/:designId/favorite`
    -   **Action**: Toggles the `isFavorite` status of a design.
-   `GET /api/fun-facts/random`
    -   **Action**: Returns a random fun fact from the database.

---

### 🛠️ Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd newnails-be
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    -   Create a `.env.local` file in the root directory.
    -   Add the following required variables:
        ```env
        # Firebase
        NEXT_PUBLIC_FIREBASE_API_KEY="..."
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
        NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
        NEXT_PUBLIC_FIREBASE_APP_ID="..."
        FIREBASE_CLIENT_EMAIL="..."
        FIREBASE_PRIVATE_KEY="..."

        # MongoDB
        MONGODB_URI="..."

        # Image Generation & Storage
        IMAGEROUTER_API_KEY="..."
        BLOB_READ_WRITE_TOKEN="..."
        ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The API will be available at `http://localhost:3000`.

---

### 🖼️ Screenshots

*(Placeholder for architecture diagrams or backend service dashboards)*

`[-------------------------]`

`[   Architecture Diagram  ]`

`[-------------------------]`