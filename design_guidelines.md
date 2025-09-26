# Design Guidelines for Pronto Mecânico

## Design Approach
**Selected Approach:** Reference-Based Design inspired by modern service platforms like Uber, Rappi, and iFood, combined with emergency service applications. The design prioritizes utility and real-time functionality while maintaining visual appeal for both customer trust and professional credibility.

## Core Design Principles
- **Reliability First:** Clean, professional interface that instills confidence in emergency situations
- **Real-time Clarity:** Clear visual indicators for status updates, location tracking, and live communications
- **Dual-User Experience:** Seamless interface adaptation for customers vs. service providers
- **Mobile-First:** Optimized for on-the-go usage with large touch targets and clear hierarchy

## Color Palette

### Dark Mode Primary
- **Background:** 220 15% 8% (deep charcoal)
- **Surface:** 220 12% 12% (elevated dark gray)
- **Primary Brand:** 200 100% 50% (vibrant blue - trustworthy and professional)
- **Secondary:** 220 8% 85% (light gray text)

### Status Colors
- **Success/Available:** 120 60% 45% (professional green)
- **Warning/In Transit:** 35 100% 55% (amber)
- **Emergency/Urgent:** 0 75% 55% (red)
- **Accent:** 280 60% 60% (subtle purple for notifications)

## Typography
**Primary Font:** Inter or Roboto via Google Fonts
- **Headers:** 600-700 weight for trust and authority
- **Body:** 400-500 weight for readability
- **Small Text:** 400 weight for secondary information
- **Scale:** 14px base with 1.125 ratio for mobile optimization

## Layout System
**Tailwind Spacing:** Use units of 2, 4, 6, and 8 for consistent rhythm
- **Container:** Max-width with responsive padding
- **Cards:** Consistent 4-6 unit padding with 2 unit radius
- **Buttons:** 3-4 unit vertical padding for touch-friendly targets

## Component Library

### Navigation
- **Mobile:** Bottom tab bar with 4-5 primary actions
- **Desktop:** Top horizontal navigation with user profile dropdown
- **Emergency Button:** Always-visible prominent CTA in brand color

### Service Request Cards
- **Layout:** Clean card design with clear service type icons
- **Status Indicators:** Color-coded progress bars and status badges
- **Provider Info:** Avatar, rating, and estimated arrival time
- **Map Integration:** Embedded mini-map with real-time location

### Chat Interface
- **Bubble Design:** Rounded message bubbles with sender differentiation
- **Timestamps:** Subtle, right-aligned time indicators
- **Status Indicators:** Message delivery and read receipts
- **Quick Actions:** Pre-defined response buttons for common updates

### Dashboard (Provider View)
- **Available Calls:** List view with distance, pay rate, and urgency indicators
- **Active Jobs:** Prominent current job card with navigation and communication tools
- **Status Controls:** Large, clear buttons for job status updates

## Real-time Elements
- **Live Location:** Animated vehicle icons with smooth movement
- **Status Updates:** Subtle animations for state changes
- **Notifications:** Non-intrusive toast notifications with sound toggle
- **Chat Indicators:** Typing indicators and unread message badges

## Images
- **Hero Section:** Professional mechanic/tow truck imagery (not too large - single viewport height)
- **Service Icons:** Clear, recognizable icons for different service types
- **Provider Avatars:** Circular profile images with online status indicators
- **Empty States:** Friendly illustrations for no active services or messages

## Responsive Behavior
- **Mobile:** Single-column layout with slide-up modals for details
- **Tablet:** Two-column layout with sidebar for navigation
- **Desktop:** Three-column layout with dedicated chat panel

## Accessibility & Dark Mode
- **Contrast:** Ensure WCAG AA compliance with high contrast ratios
- **Focus States:** Clear focus indicators for keyboard navigation
- **Text Size:** Scalable typography for various reading preferences
- **Color Independence:** Icons and status indicators don't rely solely on color

The design should feel professional yet approachable, instilling confidence during stressful breakdown situations while providing efficient tools for service providers to manage their work effectively.