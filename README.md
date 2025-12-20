# LLM-Workflow-Example

A modern monorepo project featuring React frontend and NestJS backends.

## Project Structure

```
.
├── apps/
│   ├── frontend/          # React + Vite + TypeScript frontend
│   ├── task-publisher/    # NestJS backend service (Port 3001)
│   ├── task-listener/     # NestJS backend service (Port 3002)
│   └── bff/               # NestJS backend for frontend (Port 3003)
├── packages/              # Shared packages (if any)
└── package.json           # Root workspace configuration
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: NestJS 11, TypeScript, Express
- **Package Manager**: npm with workspaces
- **Testing**: Jest (backend), Vitest (frontend)

## Prerequisites

- Node.js >= 20.x
- npm >= 10.x

## Getting Started

### Install Dependencies

Install all dependencies for the entire monorepo:

```bash
npm install
```

### Development

Run all applications in development mode:

```bash
npm run dev
```

Or run individual applications:

```bash
# Frontend (default port: 5173)
cd apps/frontend
npm run dev

# Task Publisher Backend (port: 3001)
cd apps/task-publisher
npm run dev

# Task Listener Backend (port: 3002)
cd apps/task-listener
npm run dev

# BFF Backend (port: 3003)
cd apps/bff
npm run dev
```

### Build

Build all applications:

```bash
npm run build
```

Or build individual applications:

```bash
cd apps/frontend && npm run build
cd apps/task-publisher && npm run build
cd apps/task-listener && npm run build
cd apps/bff && npm run build
```

### Testing

Run tests for all applications:

```bash
npm test
```

Run tests for individual applications:

```bash
cd apps/task-publisher && npm test
cd apps/task-listener && npm test
cd apps/bff && npm test
```

### Linting

Lint all applications:

```bash
npm run lint
```

## Application Details

### Frontend (React + Vite)
- **Port**: 5173 (default Vite dev server)
- **Build Output**: `apps/frontend/dist`
- **Technology**: React 19, TypeScript, Vite

### Task Publisher (NestJS)
- **Port**: 3001
- **Build Output**: `apps/task-publisher/dist`
- **API Endpoint**: http://localhost:3001
- **Purpose**: Publishes tasks to be consumed by task-listener

### Task Listener (NestJS)
- **Port**: 3002
- **Build Output**: `apps/task-listener/dist`
- **API Endpoint**: http://localhost:3002
- **Purpose**: Listens for and processes tasks published by task-publisher

### BFF (Backend for Frontend)
- **Port**: 3003
- **Build Output**: `apps/bff/dist`
- **API Endpoint**: http://localhost:3003
- **Purpose**: Backend for frontend - intermediary layer between frontend and backend services

## Project Scripts

- `npm run build` - Build all applications
- `npm run dev` - Run all applications in development mode
- `npm run start` - Start all applications in production mode
- `npm test` - Run tests for all applications
- `npm run lint` - Lint all applications
- `npm run clean` - Clean all build artifacts and node_modules

## Contributing

1. Make changes in the appropriate app/package
2. Test your changes locally
3. Ensure all tests pass
4. Submit a pull request

## License

UNLICENSED
