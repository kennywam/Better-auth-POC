# Better Auth POC

A monorepo project demonstrating better-auth authentication implementation.

## Project Structure

```
packages/
  ├── backend/    # Backend API service
  └── frontend/   # Frontend application
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
pnpm install
```

### Available Scripts

```bash
# Backend Development
pnpm start:backend     # Start backend in development mode
pnpm build:backend     # Build backend
pnpm migrate:dev       # Run Prisma migrations
pnpm generate:dev      # Generate Prisma client
pnpm seed              # Run database seeding
pnpm studio            # Open Prisma Studio
pnpm db:push           # Push database changes

# Frontend Development
pnpm start:frontend    # Start frontend in development mode
pnpm build:frontend    # Build frontend
pnpm generate-types    # Generate TypeScript types

# Monorepo Commands
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm prisma:generate  # Generate Prisma client
```

### Development Workflow

1. Start the backend:
```bash
pnpm start:backend
```

2. Start the frontend in a new terminal:
```bash
pnpm start:frontend
```

3. For database changes:
```bash
pnpm migrate:dev      # Create and apply migrations
pnpm db:push         # Or push changes directly
pnpm studio          # Open Prisma Studio to view/edit data
```
