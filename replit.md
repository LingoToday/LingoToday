# LingoToday - Language Learning Application

## Overview
LingoToday is a full-stack language learning application designed to deliver micro-lessons through desktop notifications. It aims to provide passive language learning and interactive lessons using a modern tech stack. The project's vision is to make language acquisition seamless and integrated into daily routines, leveraging notifications as a primary learning mechanism.

## User Preferences
Preferred communication style: Simple, everyday language.
UI/UX preferences: Clear, descriptive instructions for user interactions (e.g., specify what to enter in typing exercises).

## Recent Changes (August 13, 2025)
- Added Italian Beginner Courses 9-13 to the database:
  - Course 9: Food and Drinks (22 lessons)
  - Course 10: Directions and Places (21 lessons) 
  - Course 11: Shopping (13 lessons)
  - Course 12: Expressing Likes and Dislikes (14 lessons)
  - Course 13: Basic Grammar Essentials (29 lessons)
- Total Italian Beginner content now: 13 courses with 282 lessons
- Updated seed-database.ts to include new course files

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