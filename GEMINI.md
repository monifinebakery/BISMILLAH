# GEMINI.md

## Project Overview

This is a web application built with Vite, React, TypeScript, and Tailwind CSS. It uses `shadcn-ui` for UI components and Supabase for the backend. The project is configured with a comprehensive build process that includes development and production builds, bundle analysis, and code linting.

## Building and Running

### Prerequisites

- Node.js and pnpm

### Development

To start the development server, run:

```bash
pnpm dev
```

This will start the development server on port 5174.

### Building

To build the project for production, run:

```bash
pnpm build
```

The build output will be in the `dist` directory.

### Linting

To lint the code, run:

```bash
pnpm lint
```

## Development Conventions

### Coding Style

The project uses ESLint to enforce a consistent coding style. The ESLint configuration can be found in the `eslint.config.js` file.

### Testing

There is no testing framework configured for this project.

### Backend

The project uses Supabase for the backend. The Supabase configuration can be found in the `supabase` directory.
