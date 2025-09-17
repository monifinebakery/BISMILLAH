# Project Context for Qwen Code

This document provides essential context about the BISMILLAH project for use in future interactions with Qwen Code.

## Project Overview

**Name**: Business Management System BISMILLAH
**Type**: Progressive Web Application (PWA) for culinary SMEs
**Tech Stack**: 
- Frontend: React 18.3.1 + TypeScript + Vite
- UI: Tailwind CSS + Shadcn/ui components
- State Management: React Query (TanStack Query)
- Backend: Supabase (PostgreSQL)
- Package Manager: pnpm

## Project Purpose

This is a comprehensive business management system designed specifically for small and medium-sized culinary businesses (UMKM). It provides an all-in-one platform to manage recipes, inventory, orders, finances, suppliers, and more with a responsive interface that works on desktop, tablet, and mobile devices.

## Key Features

1. **Dashboard** - Business command center with real-time statistics
2. **Recipe Management** - Comprehensive recipe database with HPP calculator
3. **Warehouse Management** - Advanced inventory tracking with WAC (Weighted Average Cost) system
4. **Supplier Management** - Supplier database and purchase order management
5. **Order Management** - Multi-channel order processing system
6. **Financial Management** - Transaction recording and financial reporting
7. **Profit Analysis** - Sophisticated profit analysis module
8. **Asset Management** - Fixed and current asset registry
9. **Payment Management** - Integrated payment processing
10. **Promotion Calculator** - Promotion effectiveness analysis
11. **Invoice Management** - Professional invoice creation
12. **Operational Costs** - Detailed operational cost tracking
13. **Settings** - Comprehensive configuration panel
14. **Device Management** - Multi-device access control
15. **Tutorials & Help** - Interactive learning system

## Project Structure

```
src/
├── components/          # React components organized by feature
├── config/              # Configuration files
├── contexts/            # React contexts
├── data/                # Data utilities
├── docs/                # Documentation
├── hooks/               # Custom React hooks
├── integrations/        # Third-party integrations (Supabase)
├── lib/                 # Library utilities
├── middleware/          # Application middleware
├── pages/               # Page components
├── providers/           # React providers
├── routes/              # Route configurations
├── services/            # API services
├── styles/              # CSS/SCSS files
├── types/               # TypeScript types
└── utils/               # Utility functions
```

## Development Environment

- **Node.js** and **pnpm** are required
- Environment variables must be set (see `.env.example`)
- Supabase account needed for backend services

## Key Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Run linting
pnpm run lint

# Analyze bundle size
pnpm run analyze

# Clean build artifacts
pnpm run clean
```

## Architecture Patterns

1. **Component-Based Architecture** - Reusable UI components
2. **Context API** - State management for authentication and global state
3. **React Query** - Server state management and caching
4. **Protected Routes** - Authentication-guarded routes
5. **Code Splitting** - Lazy loading for performance optimization
6. **Error Boundaries** - Graceful error handling
7. **Service Workers** - PWA functionality with offline support

## Key Technical Features

- **Progressive Web App (PWA)** - Installable like native apps
- **Real-time Updates** - Supabase realtime subscriptions
- **Responsive Design** - Mobile-first approach
- **Performance Monitoring** - Built-in performance tracking
- **Dark Mode Support** - Theme customization
- **Web Workers** - Background processing
- **Virtual Scrolling** - Efficient handling of large datasets

## Supabase Integration

The application uses Supabase for:
- Authentication (email/password, OAuth)
- Database (PostgreSQL)
- Realtime subscriptions
- Storage (for receipts, images)
- Edge Functions (serverless functions)

## Profit Analysis Module

A key feature of the application with:
- Revenue tracking
- COGS (Cost of Goods Sold) calculation
- Operational cost management
- Net profit calculation
- Data visualization with charts

To seed sample data for testing:
1. Open browser console
2. Run `seedProfitAnalysisData()` from `profit-analysis-seeder.js`

## Common Development Tasks

1. **Adding New Features** - Create components in appropriate directories
2. **API Integration** - Use services/api.ts for backend communication
3. **State Management** - Use React Query for server state, Context for global UI state
4. **Routing** - Add new routes in src/routes/ and import in src/config/routes.tsx
5. **Styling** - Use Tailwind CSS classes with shadcn/ui components
6. **Testing** - Use browser console for debugging, add unit tests where appropriate

## Deployment

The application is configured for deployment on Vercel with:
- Automatic builds on git push
- Environment variable management
- Preview deployments for pull requests
- Custom domain support

## Important Files

- `src/main.tsx` - Application entry point
- `src/App.tsx` - Main application component
- `src/config/routes.tsx` - Route configuration
- `src/services/api.ts` - API service layer
- `src/integrations/supabase/client.ts` - Supabase client configuration
- `vite.config.ts` - Build configuration
- `tailwind.config.ts` - Styling configuration
- `package.json` - Dependencies and scripts