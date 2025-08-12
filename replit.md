# DeskLingo - Language Learning Application

## Overview

DeskLingo is a full-stack language learning application that delivers micro-lessons through desktop notifications. The application uses a modern tech stack with React for the frontend, Express.js for the backend, and PostgreSQL with Drizzle ORM for data persistence. The system is designed to provide passive language learning through notifications and interactive lessons.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### August 12, 2025 - User Dashboard & Database Integration
- Created comprehensive user dashboard with learning statistics, progress tracking, and next lesson recommendations
- Enhanced authentication system to save user course selection (language/level) to PostgreSQL database during registration
- Updated database schema to include selectedLanguage, selectedLevel, and completedOnboarding fields in users table
- Added dashboard API endpoints (/api/dashboard, /api/next-lesson) for personalized user data
- Implemented user progress visualization with recent lessons, streak counters, and learning goals
- Fixed authentication system to handle missing OAuth credentials gracefully with fallback error handling
- Users now see personalized dashboard after registration/login showing their selected language and level

### August 12, 2025 - Replaced Replit Auth with Standard OAuth Providers
- Replaced Replit authentication with Google and GitHub OAuth for broader user accessibility
- Added Google OAuth integration with red-branded button and official Google icon
- Added GitHub OAuth integration with dark-themed button and GitHub logo
- Implemented proper OAuth callback handling and user profile creation
- Maintained email registration option alongside OAuth providers
- Updated authentication middleware to handle multiple OAuth providers
- Enhanced onboarding page with professional OAuth buttons and clear provider options
- Users can now sign in with existing Google or GitHub accounts

### August 12, 2025 - Enhanced Authentication UX & Simplified Registration  
- Redesigned onboarding page to show both OAuth and email registration on same screen (no tabs)
- Removed last name requirement from email registration form for simplified user experience
- Updated registration schema and API to make lastName optional
- Added visual separation with "OR" divider between authentication methods
- Improved form layout with better spacing and clear section headings
- Users can now easily choose between OAuth sign-in or email account creation

### August 11, 2025 - Email Registration System Added
- Added complete email/password registration alongside existing Replit OAuth
- Extended database schema with password and authProvider fields for dual authentication support
- Implemented local authentication strategy using passport-local with bcrypt password hashing
- Added comprehensive registration API endpoints (/api/auth/register and /api/auth/login)
- Enhanced onboarding page with toggle between "Continue with Replit" and "Register with Email" options
- Added full form validation with field-level error handling for email registration
- Updated authentication middleware to handle both OAuth and local authentication sessions
- Users can now choose between secure Replit OAuth or traditional email/password registration

### August 1, 2025 - Duplicate Notification Fix & Enhanced Deduplication
- Fixed critical duplicate notification issue caused by multiple notification system instances
- Added isNotificationSystemActive global flag to prevent concurrent notification systems
- Implemented 30-second deduplication window with lastNotificationId tracking
- Enhanced stopNotifications function to properly reset all deduplication flags
- Added initialization guard to prevent multiple initializeNotifications calls
- Notifications now have comprehensive duplicate prevention at multiple levels
- System maintains single active notification instance across page refreshes

### August 1, 2025 - Notification Persistence & 404 Fix
- Removed auto-close timeout from notifications to prevent premature closure
- Set requireInteraction: true for better notification persistence
- Fixed 404 error on lesson completion redirect by adding /dashboard route
- Changed redirect URL from /dashboard?completed=true to /?completed=true
- Enhanced user feedback with success toast on lesson completion return
- Notifications now stay open until user explicitly clicks or dismisses them

### July 30, 2025 - Daily Session Control & Notification Management Overhaul
- Implemented controlled daily session management to prevent automatic notification restarts
- Added "Start Today's Lessons" master button on dashboard for user-initiated learning sessions
- Fixed notification frequency issue (was firing every 30 seconds instead of 15 minutes) 
- Added lesson rotation logic to prevent showing the same lesson repeatedly in notifications
- Sessions now start with 10-second delay, then follow user's preferred interval (15 or 30 minutes)
- Notifications only activate when user explicitly starts daily session, not on page navigation
- Enhanced session persistence tracking to maintain state across page reloads within same day
- Removed automatic notification initialization from settings changes to give users full control
- Added visual session status indicators showing when daily learning session is active
- Sessions automatically recover if page is refreshed (maintains state throughout the day)
- Fixed notification timing issue where notifications fired immediately after lesson completion
- Added auto-redirect to dashboard after lesson completion with proper timer reset
- Enhanced cooldown system to respect notification intervals even when session is restarted
- Notifications now properly wait for the full interval (15/30 minutes) after lesson completion

### July 30, 2025 - Fixed A1 Lesson Progression in Notifications
- Fixed critical issue where notifications showed random lessons instead of following A1 progression order
- Implemented proper A1 lesson ordering: starts with "Greetings & Politeness" then "Introducing Yourself & Others"
- Added automatic notification initialization when app loads (fixes morning restart issue)
- Enhanced notification system with recovery mechanism to restore notifications after page reloads
- Added health check system to ensure notifications stay running throughout the day
- Improved lesson API mapping to handle category-based structure with week/day URL compatibility
- Notifications now select the FIRST available A1 lesson instead of random selection
- Added persistence tracking to prevent notification loss during browser sessions

### July 28, 2025 - Notification System & Session Management Fixes
- Fixed critical notification system issue where localStorage was inaccessible in notification context
- Notifications now fetch lesson data directly from API instead of relying on localStorage
- Fixed API file path resolution issue preventing lesson data loading (changed from import.meta.dirname to process.cwd())
- Confirmed API endpoints working correctly with 200 status responses
- Extended user session duration from 1 week to 24 hours with rolling sessions
- Added 5-minute buffer before token expiry to prevent premature logouts
- Notifications now display actual Italian lesson content instead of motivational messages
- Enhanced session management to keep users logged in during notification interactions

### July 25, 2025 - Desktop Notification Fixes & API Route Completion
- Fixed CSP (Content Security Policy) issues preventing notifications in production
- Removed unsupported `actions` property from browser notifications
- Changed anonymous functions to named function references for CSP compliance
- Fixed all string-based setTimeout/setInterval calls causing CSP violations
- Added missing API route GET /api/lessons/:language/:week/:day for dynamic lesson content
- Enhanced notification debugging with clear success/error indicators
- Added unique notification tags to prevent browser grouping
- Improved macOS compatibility with better notification settings
- Added comprehensive test buttons ("Simple Test" and "Full Test") for debugging
- Updated lesson data structure to support week 2, day 3 lesson requests

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful API with JSON responses
- **Error Handling**: Centralized error middleware

### Database Architecture
- **Database**: PostgreSQL (using Neon Database serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Authentication System
- **Provider**: Replit Auth using OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Management**: Automatic user creation/updates on login
- **Security**: HTTP-only cookies with secure flags

### Learning System
- **Lesson Content**: JSON-based lesson structure with multilingual support
- **Progress Tracking**: User progress stored per language, week, and day
- **Statistics**: Streak tracking and words learned counters
- **Notifications**: Browser notifications for learning reminders

### Data Models
- **Users**: Core user information from Replit Auth
- **User Settings**: Language preferences and notification settings
- **User Progress**: Lesson completion tracking with scores
- **User Stats**: Aggregated learning statistics and streaks
- **Sessions**: Authentication session storage

### UI/UX Design
- **Design System**: Material-inspired with custom color palette
- **Responsive**: Mobile-first design with breakpoint considerations
- **Accessibility**: Built on Radix UI primitives for accessibility compliance
- **Theme**: Light theme with CSS custom properties

## Data Flow

### Authentication Flow
1. User clicks login → Redirects to Replit OAuth
2. OAuth callback → Creates/updates user in database
3. Session established → User redirected to dashboard
4. Protected routes check authentication via session

### Learning Flow
1. User accesses dashboard → Loads user settings and progress
2. Notification system → Schedules browser notifications based on preferences
3. Lesson interaction → Updates progress and statistics
4. Data persistence → Real-time updates to database

### Notification Flow
1. User enables notifications → Browser permission requested
2. Settings saved → Notification interval configured
3. Scheduled notifications → Show learning prompts at intervals
4. Notification click → Opens application to lesson

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **express**: Web server framework
- **passport**: Authentication middleware

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Production build bundling
- **tailwindcss**: CSS framework
- **@replit/***: Replit-specific tooling

### Authentication Dependencies
- **openid-client**: OpenID Connect implementation
- **connect-pg-simple**: PostgreSQL session store
- **memoizee**: Function memoization for OIDC config

## Deployment Strategy

### Development Environment
- **Server**: Node.js with tsx for TypeScript execution
- **Client**: Vite development server with HMR
- **Database**: Neon Database with environment-based connection
- **Authentication**: Replit Auth with development domains

### Production Build
- **Client**: Vite production build to `dist/public`
- **Server**: esbuild bundle to `dist/index.js`
- **Static Serving**: Express serves built client files
- **Environment**: NODE_ENV=production configuration

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SESSION_SECRET**: Session encryption key (required)
- **REPLIT_DOMAINS**: Allowed authentication domains (required)
- **ISSUER_URL**: OpenID Connect issuer (optional, defaults to Replit)

### Database Management
- **Schema**: Shared schema definition in `shared/schema.ts`
- **Migrations**: Drizzle Kit generates and applies migrations
- **Connection**: Pool-based connections for scalability