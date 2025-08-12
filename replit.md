# LingoToday - Language Learning Application

## Overview
LingoToday is a full-stack language learning application designed to deliver micro-lessons through desktop notifications. It aims to provide passive language learning and interactive lessons using a modern tech stack. The project's vision is to make language acquisition seamless and integrated into daily routines, leveraging notifications as a primary learning mechanism.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **UI Components**: Radix UI primitives with shadcn/ui
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Google, GitHub OAuth, and Email/Password registration
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful API with JSON responses
- **Error Handling**: Centralized error middleware

### Database Architecture
- **Database**: PostgreSQL (Neon Database serverless)
- **ORM**: Drizzle ORM
- **Schema Management**: Drizzle Kit

### Key Components
- **Authentication System**: Supports Google, GitHub, and email/password login, with PostgreSQL-backed sessions.
- **Learning System**: JSON-based lesson structure, tracks user progress (per language, week, day), streaks, and words learned.
- **Notifications**: Browser notifications for learning reminders, with controlled daily sessions and robust deduplication.
- **Data Models**: Users, User Settings, User Progress, User Stats, Sessions.

### UI/UX Design
- **Design System**: Material-inspired with custom color palette.
- **Responsiveness**: Mobile-first design.
- **Accessibility**: Built on Radix UI primitives.
- **Theme**: Light theme using CSS custom properties.

### Data Flow
- **Authentication Flow**: User signs in via OAuth or email/password, session is established, and user is redirected to the dashboard.
- **Learning Flow**: Dashboard loads user data, notification system schedules prompts, lesson interaction updates progress in the database.
- **Notification Flow**: User enables notifications, settings are saved, scheduled notifications display learning prompts, and clicking opens the app to the lesson.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **express**: Web server framework
- **passport**: Authentication middleware
- **connect-pg-simple**: PostgreSQL session store
- **openid-client**: OpenID Connect implementation

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution
- **esbuild**: Production build bundling
- **tailwindcss**: CSS framework