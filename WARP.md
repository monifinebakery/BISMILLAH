# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a React TypeScript business management application built with Vite, featuring a comprehensive dashboard for inventory management, financial tracking, recipe calculations, and profit analysis. The application uses Supabase as a backend-as-a-service for real-time updates and authentication, with robust race condition protection in all authentication flows. It is optimized for both desktop and mobile devices with progressive loading strategies.

## Key Technologies

- **Frontend**: React 18.3, TypeScript 5.5, Vite 7
- **UI Framework**: shadcn/ui components, Tailwind CSS 3.4, Radix UI 1.x/2.x
- **State Management**: React Context API, TanStack Query 5.8
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Charts**: Recharts 3.1
- **Build Tool**: Vite 7 with SWC
- **Package Manager**: pnpm 10.15
- **Authentication**: Thread-safe implementation with race condition protection

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
# Production build (MUST run this before deployment)
pnpm build

# Development build (with source maps)
pnpm build:dev

# Debug build (no minification)
pnpm build:debug

# Simple build without minification (faster for testing)
pnpm build:simple

# Preview production build
pnpm preview
```

> **IMPORTANT**: Always run `pnpm build` before deployment to ensure the application is properly compiled with all optimizations.

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
│   │   └── contexts/   # Financial context providers
│   ├── warehouse/      # Inventory management
│   │   └── context/    # Warehouse context
│   ├── recipe/         # Recipe calculation system
│   ├── orders/         # Order management
│   │   └── context/    # Order context
│   ├── purchase/       # Purchase tracking
│   │   └── context/    # Purchase context
│   ├── operational-costs/ # Operational cost tracking
│   │   └── context/    # Operational cost context
│   ├── promoCalculator/ # Promotional calculations
│   │   └── context/    # Promo context
│   ├── chatbot/        # Built-in AI assistant
│   └── profitAnalysis/ # Profit analysis tools
│       └── contexts/   # Profit analysis context
├── contexts/           # Global React Context providers
│   ├── auth/           # Authentication context modules
│   └── AppProviders.tsx # Provider hierarchy
├── hooks/              # Reusable React hooks
│   └── auth/           # Authentication hooks
├── lib/                # Core utilities and logic
├── utils/              # Utility functions
│   └── auth/           # Authentication utilities with thread safety
├── services/           # Service layer
│   └── auth/           # Authentication services with race condition protection
│       └── core/       # Core auth implementation
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client configuration
├── config/             # App configuration
├── pages/              # Route-level components
└── types/              # TypeScript type definitions
```

### Context Architecture

The application uses a hierarchical Context Provider structure in `AppProviders.tsx` with progressive loading:

#### Critical Priority (Always Load First)
1. **SimpleNotificationProvider** - Toast notifications and alerts 
2. **AuthProvider** - Authentication state and user management
3. **PaymentProvider** - Subscription and payment handling

#### Core Priority (Load After Auth)
4. **UserSettingsProvider** - User preferences and configuration
5. **CurrencyProvider** - Currency formatting and calculations
6. **FinancialProvider** - Financial transaction management
7. **ActivityProvider** - User activity tracking

#### Application Priority (Load Progressively)
8. **RecipeProvider** - Recipe calculation logic
9. **WarehouseProvider** - Raw materials/warehouse management
10. **SupplierProvider** - Supplier data management
11. **PurchaseProvider** - Purchase order management
12. **OrderProvider** - Customer order processing

#### Secondary Priority (Load Last)
13. **OperationalCostProvider** - Operational cost tracking
14. **PromoProvider** - Promotional calculations
15. **FollowUpTemplateProvider** - Communication templates
16. **DeviceProvider** - Device-specific optimizations
17. **DeviceSyncProvider** - Cross-device synchronization
18. **ProfitAnalysisProvider** - Comprehensive profit analysis


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

The app uses Supabase Auth with email-based authentication and OTP verification:
1. Users authenticate via `/auth` route with EmailAuthPage
2. OTP is sent to user's email for verification
3. `AuthGuard` protects authenticated routes with race condition prevention
4. `PaymentGuard` handles subscription requirements
5. Thread-safe session management with automatic refresh
6. Periodic session validation in the background
7. Tab visibility detection for session refresh on tab activation

#### Race Condition Prevention

The authentication system is fully thread-safe with multiple protections:
1. **Mutex-Protected Session Refresh** - Serializes concurrent refresh requests
2. **Thread-Safe Storage** - Per-key mutex locking prevents corruption
3. **Atomic Auth State Updates** - Session and user state updated atomically
4. **Navigation Race Prevention** - Centralized navigation with duplicate prevention
5. **Event Handler Deduplication** - Prevents duplicate auth event processing

### Data Synchronization

- **Financial Transactions**: Real-time sync with Supabase triggers
- **Inventory Updates**: Optimistic updates with rollback on failure
- **Bulk Operations**: Background processing with progress indication using Web Workers
- **Authentication State**: Thread-safe synchronization with Supabase as single source of truth
- **Cross-Device Sync**: Session state preservation between devices
- **Offline Support**: Service worker for offline data access

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
- `VITE_GITHUB_TOKEN` - GitHub token for auto-update detection
- `VITE_DEV_BYPASS_AUTH` - Bypass authentication in dev mode
- `VITE_DEV_MOCK_USER_ID` - Mock user ID for dev mode
- `VITE_DEV_MOCK_USER_EMAIL` - Mock user email for dev mode

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
- If experiencing auth issues, check `AuthGuard.tsx` and `useAuthManager.ts`
- The system has comprehensive race condition protection - do not modify mutex implementations
- See `RACE_CONDITION_ELIMINATION_GUIDE.md` for details on auth race condition prevention

### Performance Issues
Use bundle analyzer: `pnpm analyze` to identify large dependencies

### Race Condition Debugging
Use tools from `src/services/auth/core/session.ts` to debug auth state:
```typescript
import { debugAuthState } from '@/services/auth/core/authentication';
import { getSessionCacheInfo } from '@/services/auth/core/session';

// Debug authentication state comprehensively
await debugAuthState();

// Check session cache status
console.log(getSessionCacheInfo());
```

### Service Worker Issues
If experiencing caching issues with service worker:
```bash
# Force clear SW cache
pnpm run force-clear-sw-cache
```

This application is built with production-grade practices including comprehensive error handling, performance optimization, thread-safe authentication, and real-time data synchronization.
