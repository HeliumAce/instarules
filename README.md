
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
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

To get these values:
- Create a Supabase account and project at [supabase.com](https://supabase.com)
- Navigate to Project Settings > API
- Copy the URL and anon/public key

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
