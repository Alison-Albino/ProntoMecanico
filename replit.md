# Pronto Mecânico

## Overview

Pronto Mecânico is a mobile-first emergency automotive service platform connecting vehicle owners with mechanics and tow truck operators in real-time. It functions as a dual-sided marketplace for requesting and fulfilling emergency services, featuring real-time tracking, live chat, integrated payments via Mercado Pago PIX, and a mechanic wallet system. The project aims to provide quick, efficient, and transparent automotive assistance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

**Technology Stack:** React with TypeScript, Vite, Wouter for routing, TanStack Query for state management, shadcn/ui (Radix UI) for components, and Tailwind CSS for styling.
**Design System:** Mobile-first, dark mode primary with custom color palette, bottom tab navigation, and a custom theme system using CSS variables.
**Key Patterns:** Context-based authentication (JWT), WebSocket for real-time updates, notifications system (toasts, browser), custom hooks, and protected routes.

### Backend

**Technology Stack:** Express.js with TypeScript, WebSocket Server (ws library), and Bcrypt for password hashing.
**API Design:** RESTful endpoints, Bearer token authentication, WebSocket for real-time features, and middleware for logging/error handling.
**Authentication:** Session-based with in-memory token storage.
**Data Storage:** PostgreSQL database (Neon Serverless) with Drizzle ORM, supporting full CRUD for users, service requests, chat, and transactions.

### Core Features

**User Management:** Dual user types (client/mechanic), real-time location tracking, online status, rating system, bank account integration for mechanics, and wallet balance.
**Mechanic Base Address System:** Mechanics configure a base address for distance/price calculations, and service requests are filtered by a 50km radius from this base.
**Service Requests:** Full lifecycle tracking, fixed pricing based on time of day (R$50.00 regular, R$100.00 after-hours), 20% platform fee, dual confirmation by client and mechanic, mutual rating system, and immediate payment release to mechanic's wallet after ratings.
**Real-time Communication:** WebSocket for service updates, location tracking, chat messages, and notifications.
**Notifications System:** Unread message tracking, toast and browser notifications, and permission management.
**Payment Integration (Mercado Pago PIX):** PIX for service fees, QR code generation, real-time status verification, automatic refunds on cancellation, and a test mode simulator.
**Wallet System:** Three-tab interface (Ganhos, Aguardando, Saques) showing available, pending, and total earnings. PIX-only withdrawal flow with minimum balance validation and admin processing system for payouts.
**Maps Integration (Google Maps API):** Real-time location display, route calculation, address input with Google Places Autocomplete, and external navigation integration (Waze, Google Maps) for mechanics.

## Recent Changes

**October 2, 2025 - Mobile Notification Fix:**
- **Black Screen Fix:** Browser notifications now only trigger when app is in background (document.hidden)
- **Auto-dismiss:** Notifications automatically close after 5 seconds
- **Error Handling:** Added try-catch to prevent notification errors from breaking the app
- **Page Detection:** Improved detection to prevent notifications when user is on active ride or chat pages

**October 2, 2025 - Privacy & Display Enhancements:**
- **First Name Only:** Chat and service requests now display only the first name of users (not full name)
- **Private Data Protection:** Email, phone, and CPF/CNPJ are hidden from public profile views
- **Profile Privacy:** Personal data (email, phone, username) only visible on user's own profile

**October 2, 2025 - Login System Enhancement:**
- **Flexible Login:** Users can now login with CPF, CNPJ, or Email (all validated against password)
- **CPF/CNPJ Validation:** Implemented Brazilian document validation with automatic formatting
- **Enhanced Registration:** Added CPF/CNPJ, birth date, and phone fields to user registration
- **Smart Identifier Detection:** Backend automatically detects if login identifier is CPF/CNPJ or email
- **Security:** All inputs validated with Zod schemas, username auto-generated from CPF/CNPJ for backend compatibility

**October 2, 2025 - PIX Withdrawal Flow Enhancement:**
- **Direct PIX Input:** Removed pre-configuration requirement - mechanics now enter PIX key directly during withdrawal
- **Simplified Flow:** Single-step withdrawal with immediate PIX key input (CPF, CNPJ, email, phone, or random key)
- **Removed Settings:** Eliminated bank data configuration dialog for cleaner UX
- **Backend Update:** Withdrawal endpoint now accepts pixKey and pixKeyType parameters directly

**October 2, 2025 - Database Migration & Payment System Overhaul:**
- **PostgreSQL Migration:** Migrated from in-memory storage to PostgreSQL database for complete data persistence
- **Fixed Pricing System:** Implemented fixed service pricing - R$50.00 (6h-18h) and R$100.00 (18h-6h) with 20% platform fee automatically calculated
- **Dual Confirmation Flow:** Both client and mechanic must confirm service completion before ratings
- **Mutual Rating System:** Both parties rate each other (1-5 stars) after dual confirmation, calculated as cumulative average
- **Immediate Payment Release:** Funds credited to mechanic wallet IMMEDIATELY after mutual ratings (removed 12-hour delay)
- **Security Enhancement:** All service creation inputs validated with insertServiceRequestSchema to prevent privilege escalation
- **Payment Flow:** Service creation → mechanic accepts → service complete → dual confirmation → mutual ratings → immediate payment release to wallet

## External Dependencies

**Mercado Pago:** PIX payment processing and refund system.
**Google Maps API:** Geocoding, directions, and location services.
**Neon Serverless PostgreSQL:** Primary cloud-hosted database.
**Radix UI:** Unstyled, accessible UI primitives.
**shadcn/ui:** Styled components built on Radix UI and Tailwind CSS.
**Google Fonts:** Custom fonts (Architects Daughter, DM Sans, Fira Code, Geist Mono).