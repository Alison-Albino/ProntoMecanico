# Pronto Mecânico

## Overview

Pronto Mecânico is a mobile-first emergency automotive service platform that connects vehicle owners with mechanics and tow truck operators in real-time. The application provides a dual-sided marketplace where clients can request emergency services (mechanics, tow trucks) and service providers can accept and fulfill these requests. The platform features real-time location tracking, live chat communication, integrated payments via Stripe, and a wallet system for service providers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with a custom dark-mode-first design system

**Design System:**
- Dark mode primary with custom color palette inspired by service platforms like Uber and Rappi
- Mobile-first responsive design with bottom tab navigation
- Custom theme system using CSS variables for dynamic theming
- Component library follows the "New York" style from shadcn/ui

**Key Frontend Patterns:**
- Context-based authentication (AuthProvider) managing user sessions with JWT tokens stored in localStorage
- WebSocket provider for real-time updates (service requests, location tracking, chat messages)
- Custom hooks for mobile detection, toast notifications, and form validation
- Protected routes using authentication guard components

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- WebSocket Server (ws library) for real-time bidirectional communication
- Session-based authentication using in-memory Map storage
- Bcrypt for password hashing

**API Design:**
- RESTful endpoints under `/api` prefix
- Bearer token authentication via Authorization headers
- WebSocket connection for real-time features with token-based authentication
- Middleware for request logging and error handling

**Authentication Flow:**
- Username/password login generating session tokens
- Tokens stored in-memory Map on server
- Client sends token via Authorization header or WebSocket query parameter
- Middleware validates tokens and attaches user to request object

**Data Storage:**
- In-memory storage implementation (MemStorage class) as the current data layer
- Designed with interface (IStorage) for future database integration
- Schema definitions using Drizzle ORM for PostgreSQL (prepared but not yet connected)

### Database Schema (Drizzle ORM - PostgreSQL Ready)

**User Management:**
- Users table with dual user types (client/mechanic)
- Location tracking fields (currentLat, currentLng)
- Online status tracking
- Rating system with average and total counts
- Bank account information for withdrawals (account name, number, bank, PIX key)
- Wallet balance for mechanics
- Stripe customer integration

**Service Requests:**
- Complete service lifecycle tracking (pending → accepted → completed/cancelled)
- Pickup location and optional destination
- Service type categorization (mechanic, tow_truck, emergency)
- Distance-based pricing calculation (base fee + distance fee)
- Platform fee and mechanic earnings separation
- Payment integration with Stripe (payment intent tracking)
- Rating and feedback system

**Communication:**
- Chat messages linked to service requests
- Sender identification and timestamps
- Real-time delivery via WebSocket

**Financial Transactions:**
- Transaction history for wallet operations
- Type classification (payment, withdrawal, refund)
- Status tracking (pending, completed, failed)
- Service request association

### Real-Time Communication

**WebSocket Implementation:**
- Single WebSocket connection per authenticated user
- Event-based messaging system with typed events:
  - Service request lifecycle (created, accepted, completed, cancelled)
  - Location updates from mechanics
  - Chat messages
  - Mechanic arrival notifications
- Client-side event listeners using custom events
- Automatic reconnection on token refresh

### Payment Integration

**Stripe Integration:**
- Payment intents for service payments
- Automatic payment methods enabled
- BRL currency support
- Server-side payment intent creation and confirmation
- Client-side integration using @stripe/react-stripe-js
- Payment status tracking in service requests

**Wallet System:**
- Service providers accumulate earnings in platform wallet
- Bank account or PIX key required for withdrawals
- Transaction history tracking
- Platform fee calculation (deducted from mechanic earnings)

### Maps Integration

**Google Maps API:**
- Real-time location tracking and display
- Route calculation and visualization
- Distance and duration estimates
- Marker positioning for clients and mechanics
- Directions API for route path rendering
- API key configuration via environment variable (VITE_GOOGLE_MAPS_API_KEY)

**GPS Precision System:**
- Progressive accuracy improvement using `watchPosition` API
- **REJECTS completely** IP/WiFi-based locations (accuracy > 500m are discarded)
- Only accepts true GPS readings with accuracy ≤ 500m
- Real-time feedback: Precise (<30m), Good (30-100m), Acceptable (100-500m)
- Shows rejection messages for IP-based attempts with attempt counter
- Automatic cleanup on dialog close and component unmount
- Protection against memory leaks with ref-based watch/timeout management
- Maximum 30-second timeout with up to 10 position attempts
- Guard against multiple simultaneous GPS requests
- Falls back to manual address input if only IP-based locations available

## External Dependencies

### Third-Party Services

**Stripe:**
- Payment processing for service fees
- Configuration via STRIPE_SECRET_KEY environment variable
- API version: 2025-08-27.basil
- Handles payment intents, confirmations, and refunds

**Google Maps:**
- Location services and mapping
- Requires VITE_GOOGLE_MAPS_API_KEY
- Uses @vis.gl/react-google-maps for React integration
- Provides geocoding, directions, and distance matrix services

### Database

**Neon Serverless PostgreSQL:**
- Primary database provider (@neondatabase/serverless)
- Drizzle ORM for schema management and queries
- Configuration via DATABASE_URL environment variable
- Migration files stored in /migrations directory
- Current implementation uses in-memory storage but schema is production-ready

### UI Component Libraries

**Radix UI:**
- Comprehensive set of unstyled, accessible components
- All interactive components (dialogs, dropdowns, tooltips, etc.)
- Keyboard navigation and ARIA compliance built-in

**shadcn/ui:**
- Pre-styled components built on Radix UI
- Customizable via Tailwind CSS
- "New York" style variant selected

### Development Tools

**Replit:**
- Development environment integration
- Hot module replacement support
- Runtime error modal plugin
- Cartographer plugin for development mode
- Banner injection for non-Replit environments

### Font Libraries

**Google Fonts:**
- Architects Daughter (decorative)
- DM Sans (primary UI font)
- Fira Code (monospace)
- Geist Mono (monospace alternative)
- Loaded via CDN in index.html