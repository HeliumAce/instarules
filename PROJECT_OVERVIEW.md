# Project Overview

This document outlines the technical stack, project structure, and core functionality of the Instarules application.

## Tech Stack

**Frontend:**
*   **Framework:** React (`react`, `react-dom`)
*   **Build Tool:** Vite (`vite`, `@vitejs/plugin-react-swc`)
*   **Language:** TypeScript (`typescript`)
*   **Routing:** React Router (`react-router-dom`)
*   **UI Components:** shadcn/ui (various `@radix-ui/*` packages, `tailwind-merge`, `tailwindcss-animate`, `class-variance-authority`, `clsx`, `lucide-react`)
*   **State Management/Data Fetching:** TanStack Query (`@tanstack/react-query`)
*   **Forms:** React Hook Form (`react-hook-form`) with Zod (`zod`) for validation (`@hookform/resolvers`)
*   **Styling:** Tailwind CSS (`tailwindcss`, `postcss`, `autoprefixer`)
*   **Notifications:** Sonner (`sonner`), Toaster (`@radix-ui/react-toast`)
*   **Theming:** `next-themes`
*   **Charts:** Recharts (`recharts`)
*   **Markdown:** `react-markdown`
*   **Other UI:** `react-resizable-panels`, `cmdk`, `embla-carousel-react`, `input-otp`, `vaul`

**Backend/Services:**
*   **Database/Auth:** Supabase (`@supabase/supabase-js`) - Used via context providers (`SupabaseProvider`, `AuthProvider`).
*   **AI Completions (Frontend):** OpenRouter (`axios` to `https://openrouter.ai`) via `LLMService.ts`. Uses `VITE_OPENROUTER_API_KEY`.
*   **AI Models (via OpenRouter):** Configured to use `anthropic/claude-3-sonnet:beta` as default in `LLMService.ts`.
*   **AI Embeddings (Backend):** OpenAI (`openai`, `text-embedding-3-small`) - Used in `backend/scripts/ingestArcsRules.ts` for generating text embeddings.
*   **HTTP Client (Frontend):** Axios (`axios`) - Used in `LLMService.ts`.

**Development:**
*   **Linting:** ESLint (`

## Core Functionality

Based on the file structure and dependencies:

1.  **Authentication:** Uses Supabase for user authentication (`AuthProvider`, `Auth` page).
2.  **Dashboard:** A central dashboard page (`Dashboard` page).
3.  **Game Chat:** A feature likely involving interaction within a specific game context (`GameChat` page, `GameProvider`). Uses **OpenRouter** via `LLMService.ts` for AI-driven chat/rule explanations based on processed rule data.
4.  **Data Management:** Uses Supabase as a backend (`SupabaseProvider`) and TanStack Query for managing server state on the client.
5.  **Vector Search (Backend):** Backend includes functionality (`searchService.ts`, `ingestArcsRules.ts`) to generate **OpenAI embeddings** for rule chunks and perform vector similarity searches using Supabase PostgreSQL functions (`match_arcs_rules`).
6.  **UI:** Leverages shadcn/ui for building the user interface with Tailwind CSS for styling.
7.  **Backend Scripts:** Includes scripts for tasks like data ingestion/embedding generation (`ingest` script) and database migrations (`migrate` script).