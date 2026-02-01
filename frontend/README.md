# Enrichify Frontend

Modern React/Next.js frontend for the Enrichify data enrichment platform.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: React Query
- **Forms**: React Hook Form + Zod
- **Theme**: next-themes (Dark/Light mode)
- **Data Visualization**: Recharts
- **WebSockets**: Socket.io-client
- **HTTP Client**: Axios

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard page
│   ├── login/            # Authentication pages
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components (Header, Sidebar)
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   └── protected-route.tsx
├── contexts/             # React contexts
│   └── auth-context.tsx
├── hooks/                # Custom React hooks
│   └── use-toast.ts
├── lib/                  # Utilities and configuration
│   ├── api-client.ts
│   ├── query-client.ts
│   └── utils.ts
└── types/                # TypeScript type definitions
    └── auth.ts

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   # Create .env.local file
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   npm start
   ```

## Features

### Core Infrastructure ✅

- **Authentication System**
  - Login/Register pages
  - Protected routes
  - Auth context and hooks
  - Token management

- **Layout System**
  - Responsive app layout
  - Header with user profile
  - Collapsible sidebar navigation
  - Mobile-friendly design

- **Theme System**
  - Dark/Light mode toggle
  - System theme detection
  - CSS variables for theming
  - Smooth transitions

- **UI Component Library**
  - Button, Input, Label, Card
  - Dialog, Dropdown, Select
  - Tabs, Toast notifications
  - Table, Avatar, Separator
  - Loading skeletons
  - Switch, and more

- **API Integration**
  - Axios client with interceptors
  - Auth token management
  - React Query for data fetching
  - Error handling

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run Biome linter
- `npm run format` - Format code with Biome

## API Integration

The frontend communicates with the backend API through the configured `NEXT_PUBLIC_API_URL`. The API client automatically:

- Adds authentication tokens to requests
- Handles token refresh
- Redirects to login on 401 errors
- Provides error handling

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Follow the component patterns
4. Test responsive design
5. Run linter before committing
