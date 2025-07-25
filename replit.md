# DeskLingo - Language Learning Application

## Overview

DeskLingo is a full-stack language learning application that delivers micro-lessons through desktop notifications. The application uses a modern tech stack with React for the frontend, Express.js for the backend, and PostgreSQL with Drizzle ORM for data persistence. The system is designed to provide passive language learning through notifications and interactive lessons.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### July 25, 2025 - Desktop Notification Fixes
- Fixed CSP (Content Security Policy) issues preventing notifications in production
- Removed unsupported `actions` property from browser notifications
- Changed anonymous functions to named function references for CSP compliance
- Added automatic notification initialization when dashboard loads if notifications already enabled
- Improved user interface with clear instructions for blocked notification permissions
- Added debugging logs and "Test Notification" button for troubleshooting

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