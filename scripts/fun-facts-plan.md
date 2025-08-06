# Fun Facts Feature Implementation Plan

This plan outlines the steps to add a "fun facts" feature that displays interesting facts about nails while users wait for AI image generation.

---

## Phase 1: Backend Setup (`newnails-be`)

-   [x] **1. Create Mongoose Model:**
    -   [x] Create a new file at `src/models/FunFact.ts`.
    -   [x] Define a Mongoose schema with a single `text` field of type `String`.
    -   [x] Export the `FunFact` model.

-   [x] **2. Create Seeder Script:**
    -   [x] Create a new script at `scripts/seed-fun-facts.ts`.
    -   [x] This script will read `scripts/fun.json`.
    -   [x] It will connect to the MongoDB database.
    -   [x] It will clear the existing `funfacts` collection to avoid duplicates.
    -   [x] It will insert the facts from the JSON file into the `funfacts` collection.
    -   [x] Add a script to `package.json` to run the seeder (e.g., `"seed:funfacts": "ts-node scripts/seed-fun-facts.ts"`).

-   [x] **3. Create API Endpoint:**
    -   [x] Create a new file at `src/app/api/fun-facts/route.ts`.
    -   [x] Implement a `GET` handler.
    -   [x] The handler should fetch a random document from the `funfacts` collection.
    -   [x] Return the fact as a JSON response.

---

## Phase 2: Frontend Implementation (`newnails-web-fe`)

-   [x] **1. Update API Library:**
    -   [x] Create a new file at `src/lib/api.ts` if it doesn't exist.
    -   [x] Add a new function `fetchRandomFunFact()` that calls the `/api/fun-facts` endpoint.
    -   [x] The function should handle the request and return the fun fact text.

-   [x] **2. Create Loading Component:**
    -   [x] Create a new component file, e.g., `src/pages/LoadingPage.tsx`.
    -   [x] This component will be displayed during image generation.
    -   [x] It should have a state to hold the current fun fact.
    -   [x] Use `useEffect` to fetch a new fun fact from the API every 10 seconds using a `setInterval`.
    -   [x] Display the fun fact with a loading indicator or animation.
    -   [x] Add a fade-in/fade-out transition for the text for a better user experience.

-   [x] **3. Integrate Loading Component:**
    -   [x] Identify the page/component where the image generation is triggered.
    -   [x] Add state to manage the loading status (e.g., `isLoading`).
    -   [x] When the "Generate" button is clicked, set `isLoading` to `true`.
    -   [x] Conditionally render the `LoadingPage` component when `isLoading` is `true`.
    -   [x] When the image generation is complete and results are received, set `isLoading` to `false` and navigate to the results page.

---

## Phase 3: Finalization & Testing

-   [x] **1. Run Database Seeder:**
    -   [x] Execute the seeder script to populate the MongoDB database with the fun facts.
-   [ ] **2. End-to-End Testing:**
    -   [ ] Start both the backend and frontend servers.
    -   [ ] Trigger the image generation process.
    -   [ ] Verify that the loading screen appears and displays fun facts, changing every 10 seconds.
    -   [ ] Verify that the results screen is shown correctly after the image generation is complete.
