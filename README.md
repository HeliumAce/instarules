# Instarules - Board Game Rules Assistant

Instarules is a web application that provides instant access to board game rules and answers to common questions without consulting rulebooks. This application allows users to browse games and get instant answers about rules and gameplay.

## Features

- User authentication (sign up, sign in, sign out)
- Browse available board games
- Access game rules and get answers to game-related questions
- Favorite games for quick access

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **State Management**: React Context API, TanStack Query
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Routing**: React Router

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd instarules
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Environment Setup:

Create a `.env` file in the root directory with the following variables:

```
# For backend scripts (dotenv reads these into process.env)
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Keep these for your Vite frontend (Vite reads these into import.meta.env)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

To get these values:
- Create a Supabase account and project at [supabase.com](https://supabase.com)
- Navigate to Project Settings > API
- Copy the URL, anon/public key, and service role key
- Get an OpenRouter API key from [openrouter.ai](https://openrouter.ai/)

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:8080`.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/          # Layout components
│   └── ui/              # shadcn/ui components
├── context/             # React context providers
├── data/                # Static data and mock data
├── hooks/               # Custom React hooks
├── integrations/        # Third-party integrations (Supabase)
├── lib/                 # Utility functions
├── pages/               # Page components
└── types/               # TypeScript type definitions
```

## Development Workflow

1. Create a new branch for your feature or bug fix
2. Make your changes
3. Test your changes locally
4. Create a pull request
5. After review, merge into the main branch

## Deployment

The application can be deployed using any static site hosting service (Netlify, Vercel, etc.).

To build the application for production:

```bash
npm run build
# or
yarn build
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Lovable](https://lovable.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

## Text Embeddings and Game Rules

Instarules uses Supabase native embeddings to provide semantic search capabilities for game rules:

1. Rules are stored in Markdown format in the `src/data/games` directory.
2. The Supabase Edge Functions process these rules and generate embeddings using the `Supabase/gte-small` model.
3. The embeddings are stored in the Supabase database with pgvector for efficient semantic search.

To ingest game rules and generate embeddings:

```bash
npm run ingest
```

This will:
1. Read the Markdown rule files
2. Process them into semantic chunks
3. Generate Supabase native embeddings (384-dimensional vectors) for each chunk
4. Store the content and embeddings in the Supabase database
