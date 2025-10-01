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
- Notifications system with unread message tracking, toast and browser notifications
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
- Location tracking fields (currentLat, currentLng) for real-time GPS tracking
- Base address system for mechanics (baseAddress, baseLat, baseLng) - used for distance/price calculations
- Online status tracking
- Rating system with average and total counts
- Bank account information for withdrawals (account name, number, bank, PIX key)
- Wallet balance for mechanics
- Stripe customer integration

**Mechanic Base Address System:**
- Mechanics must configure their base address during registration or in the Profile page
- Base address is captured using Google Places Autocomplete (Brazil-only)
- All distance and price calculations use the mechanic's base address as the origin point
- Route visualization on maps shows from base address to client location
- Mechanics cannot accept service requests without a configured base address
- Base address can be updated at any time in the Profile page
- System properly handles edge cases including zero coordinates (equator/Greenwich meridian)
- Backend filters pending service requests to show only those within 50km radius of mechanic's base address
- GPS location is only required for clients (to show nearby mechanics), not for mechanics to receive requests
- **Registration Flow (Fixed Oct 2025):**
  - Base address data now sent during initial registration (not separate API call)
  - Backend properly preserves baseAddress/baseLat/baseLng including zero values
  - Schema accepts optional base address fields (string | number)
  - Storage normalizes coordinates to strings consistently

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
- Type classification (mechanic_earnings, platform_fee, withdrawal, refund)
- Status tracking (pending, completed, failed)
- Service request association
- **12-Hour Availability Delay System:**
  - Earnings from completed services are marked with an `availableAt` timestamp (12 hours after service completion)
  - Saldo Pendente: earnings that haven't reached their `availableAt` time yet
  - Saldo Disponível: earnings that have passed their `availableAt` time and can be withdrawn
- **Withdrawal System:**
  - Two withdrawal methods: PIX and bank transfer
  - Full bank account details stored (bank name, account number, branch, account holder name)
  - Withdrawal requests include method and destination details
  - Processing time: up to 2 business days
  - Withdrawal transactions store method and destination details for audit trail

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

**Notifications System:**
- NotificationsProvider context managing unread message state
- Unread message badges displayed on chat buttons (ActiveRidePage and MobileNav)
- Toast notifications when new messages arrive (suppressed when on chat page)
- Browser notifications with click-to-navigate functionality
- Permission management in ProfilePage settings
- Messages automatically marked as read when ChatPage opens
- Uses wouter navigation for all notification actions (no page reloads)

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
- **Admin Withdrawal Processing System:**
  - Admin panel at `/admin/withdrawals` for manual payout processing
  - Lists pending withdrawals with mechanic details and bank/PIX information
  - Admins make manual transfers (PIX/TED) and confirm in system
  - Status updates from "pending" to "completed" after admin confirmation
  - Accessible from Profile page via "Processar Saques (Admin)" button
  - Currently: any authenticated user can access (to be restricted to admin role in future)

### Maps Integration

**Google Maps API:**
- Real-time location tracking and display
- Route calculation and visualization
- Distance and duration estimates
- Marker positioning for clients and mechanics
- Directions API for route path rendering
- API key configuration via environment variable (VITE_GOOGLE_MAPS_API_KEY)

**Address Input System (Uber-style):**
- Google Places Autocomplete for address search
- Fully typeable input with autocomplete suggestions
- Manual text entry with automatic geocoding fallback
- Country restriction to Brazil (BR)
- Real-time address validation and coordinate extraction
- No GPS button - simplified interface like Uber

**External Navigation Integration (Oct 2025):**
- Mechanics can open navigation in external apps from ActiveRidePage
- DropdownMenu button with Navigation icon (visible only for mechanics in 'accepted' or 'arrived' status)
- Two navigation options:
  - **Waze:** Opens Waze app with route from mechanic base address to client location
  - **Google Maps:** Opens Google Maps with turn-by-turn directions
- Route visualization on in-app map shows preview before opening external app
- Origin point: mechanic's base address (baseLat, baseLng)
- Destination: client's pickup location (pickupLat, pickupLng)
- URL format validation and proper parameter encoding
- Opens in new tab/window with window.open (mobile OS handlers launch native apps)

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