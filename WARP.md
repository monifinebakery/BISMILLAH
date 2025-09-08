# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a React TypeScript business management application built with Vite, featuring a comprehensive dashboard for inventory management, financial tracking, recipe calculations, and profit analysis. The application uses Supabase as a backend-as-a-service and is optimized for both desktop and mobile devices.

## Key Technologies

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui components, Tailwind CSS, Radix UI
- **State Management**: React Context API, TanStack Query
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Charts**: Recharts, Chart.js
- **Build Tool**: Vite with SWC
- **Package Manager**: pnpm

## Common Development Commands

### Development
```bash
# Start development server on port 5174
pnpm dev

# Start development server on port 5173 (alternative)
pnpm dev:5173

# Clean development cache
pnpm clean
```

### Building
```bash
# Production build
pnpm build

# Development build (with source maps)
pnpm build:dev

# Debug build (no minification)
pnpm build:debug

# Preview production build
pnpm preview
```

### Code Quality
```bash
# Lint code
pnpm lint

# Bundle analysis
pnpm analyze

# Run bundle analyzer with preview server
pnpm analyze:server
```

### Testing & Debugging
```bash
# Debug payment issues
pnpm debug:payment

# Fix payment linking issues
pnpm fix:payment
```

### Git Automation
```bash
# Quick push with automated commit message
pnpm push:quick

# Push with custom message (interactive)
pnpm push
```

## Architecture Overview

### Application Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── dashboard/      # Dashboard-specific components
│   ├── financial/      # Financial management modules
│   ├── warehouse/      # Inventory management
│   ├── recipe/         # Recipe calculation system
│   ├── orders/         # Order management
│   ├── purchase/       # Purchase tracking
│   └── profitAnalysis/ # Profit analysis tools
├── contexts/           # React Context providers
├── pages/              # Route-level components
├── config/             # App configuration
├── utils/              # Utility functions
├── integrations/       # External service integrations
├── types/              # TypeScript type definitions
└── styles/             # Global styles
```

### Context Architecture

The application uses a hierarchical Context Provider structure in `AppProviders.tsx`:

1. **AuthProvider** - Authentication state and user management
2. **PaymentProvider** - Subscription and payment handling
3. **NotificationProvider** - Toast notifications and alerts
4. **UserSettingsProvider** - User preferences and configuration
5. **ActivityProvider** - User activity tracking
6. **FinancialProvider** - Financial transaction management
7. **BahanBakuProvider** - Raw materials/warehouse management
8. **SupplierProvider** - Supplier data management
9. **RecipeProvider** - Recipe calculation logic
10. **PurchaseProvider** - Purchase order management
11. **OrderProvider** - Customer order processing
12. **OperationalCostProvider** - Operational cost tracking
13. **PromoProvider** - Promotional calculations
14. **FollowUpTemplateProvider** - Communication templates
15. **DeviceProvider** - Device-specific optimizations
16. **ProfitAnalysisProvider** - Comprehensive profit analysis
17. **UpdateProvider** - Application update management

### Key Business Logic Modules

#### Financial System (`src/components/financial/`)
- Transaction management with Supabase sync
- Real-time financial data processing
- Bulk operations support
- Currency formatting and calculations

#### Recipe Calculator (`src/components/recipe/`)
- Ingredient cost calculations
- Portion sizing and scaling
- HPP (Cost of Goods Sold) calculations
- Material usage optimization

#### Warehouse Management (`src/components/warehouse/`)
- Inventory tracking
- Stock level monitoring
- Critical stock alerts
- Supplier integration

#### Profit Analysis (`src/components/profitAnalysis/`)
- Comprehensive profit margin calculations
- Cost-benefit analysis
- Performance metrics and trends
- Financial reporting

### Data Flow Patterns

1. **Supabase Integration**: All data operations use Supabase client with optimistic updates
2. **React Query**: Server state management with caching and background refetching
3. **Context Providers**: Global state for business domain logic
4. **Real-time Updates**: Supabase subscriptions for live data synchronization

### Performance Optimizations

- **Code Splitting**: Lazy loading with React.lazy() and Suspense
- **Bundle Optimization**: Conservative chunk splitting to avoid React issues
- **Caching**: React Query with stale-while-revalidate patterns
- **Mobile Optimization**: iPad-specific breakpoints and responsive design
- **PWA Support**: Service worker for offline functionality

## Development Guidelines

### Component Patterns

**Context Usage**: Always use the specific context hook (e.g., `useAuth()`, `useFinancial()`) rather than accessing context directly.

**Error Boundaries**: All major sections wrapped in `ErrorBoundary` components with proper fallback UI.

**Loading States**: Use consistent loading patterns with skeleton components and suspense boundaries.

### State Management

**Server State**: Use TanStack Query for all server-side data
**Client State**: Use React Context for business logic state
**Form State**: Use react-hook-form with zod validation

### Authentication Flow

The app uses Supabase Auth with email-based authentication:
1. Users authenticate via `/auth` route
2. `AuthGuard` protects authenticated routes  
3. `PaymentGuard` handles subscription requirements
4. Session management with automatic refresh

### Data Synchronization

- **Financial Transactions**: Real-time sync with Supabase triggers
- **Inventory Updates**: Optimistic updates with rollback on failure
- **Bulk Operations**: Background processing with progress indication

## Common Patterns & Utilities

### Date Handling
Use `src/utils/unifiedDateUtils.ts` for all date operations to ensure consistency across timezone handling and database normalization.

### Logging
The application includes comprehensive logging via `src/utils/logger.ts` with different levels for development vs production.

### Error Handling
Centralized error handling through:
- Global error boundaries
- React Query error handling
- Supabase error normalization

### Mobile Responsiveness
- Use `useIsMobile()` hook for responsive behavior
- iPad-specific breakpoints defined in Tailwind config
- Bottom tab navigation for mobile users

## Environment Configuration

Required environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

Optional variables:
- `VITE_FORCE_LOGS` - Keep console logs in production builds
- `VITE_ANALYZE` - Enable bundle analysis

## Database Schema

The application works with a Supabase PostgreSQL database with the following key tables:
- `financial_transactions` - All monetary transactions
- `bahanbaku` - Raw materials/inventory items
- `recipes` - Recipe definitions and calculations
- `suppliers` - Supplier information
- `purchases` - Purchase orders and tracking
- `orders` - Customer orders
- `operational_costs` - Business operational expenses

## Troubleshooting Common Issues

### Payment Integration Issues
Use the debug scripts: `pnpm debug:payment` or `pnpm fix:payment`

### Build Issues
Try cleaning the build cache: `pnpm clean` or `pnpm clean:all`

### Authentication Problems
Check Supabase environment variables and session validation in browser dev tools

### Performance Issues
Use bundle analyzer: `pnpm analyze` to identify large dependencies

This application is built with production-grade practices including comprehensive error handling, performance optimization, and real-time data synchronization.
