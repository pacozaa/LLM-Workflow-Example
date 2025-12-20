# BFF (Backend for Frontend)

A NestJS backend service that acts as an intermediary layer between the frontend and backend services.

## Port

- **Development**: 3003
- **Environment Variable**: `PORT` (defaults to 3003 if not set)

## API Endpoints

- `GET /` - Returns "Hello World!"

## Development

Start the development server:

```bash
npm run dev
```

## Build

Build the application:

```bash
npm run build
```

## Testing

Run unit tests:

```bash
npm test
```

Run e2e tests:

```bash
npm run test:e2e
```

## Linting

Lint and fix code:

```bash
npm run lint
```

## Tech Stack

- **Framework**: NestJS 11
- **Language**: TypeScript
- **Runtime**: Node.js
- **Testing**: Jest
