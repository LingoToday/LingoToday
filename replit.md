# LingoToday - Language Learning Application

## Overview
LingoToday is a full-stack language learning application designed to deliver micro-lessons through desktop notifications. It aims to provide passive language learning and interactive lessons using a modern tech stack. The project's vision is to make language acquisition seamless and integrated into daily routines, leveraging notifications as a primary learning mechanism.

## User Preferences
Preferred communication style: Simple, everyday language.
UI/UX preferences: Clear, descriptive instructions for user interactions (e.g., specify what to enter in typing exercises).

## Recent Changes (September 3, 2025)
- **Updated Italian Course 9 (Food and Drinks) with Inline Reviews**:
  - Replaced the existing Italian Food and Drinks course with enhanced version that includes reviews after every 4 lessons
  - Added 7 checkpoint reviews throughout the course (6 regular reviews + 1 final review)
  - Successfully imported 22 lessons with 66 lesson steps plus 7 checkpoints
  - Reviews include multiple-choice questions covering beverages, food items, and restaurant phrases
  - Course now covers comprehensive food and drink vocabulary with structured review intervals
- **Updated Italian Course 8 (Weather and Seasons) with Inline Reviews**:
  - Replaced the existing Italian Weather and Seasons course with enhanced version that includes reviews after every 4 lessons
  - Added 6 checkpoint reviews throughout the course (5 regular reviews + 1 final review)
  - Successfully imported 18 lessons with 54 lesson steps plus 6 checkpoints
  - Reviews include multiple-choice questions covering weather expressions, seasonal vocabulary, and personal temperature feelings
  - Course now covers comprehensive weather and season vocabulary with structured review intervals
- **Updated Italian Course 7 (Describing Things - Colors & Adjectives) with Inline Reviews**:
  - Replaced the existing Italian Colors & Adjectives course with enhanced version that includes reviews after every 4 lessons
  - Added 7 checkpoint reviews throughout the course (6 regular reviews + 1 final review)
  - Successfully imported 22 lessons with 66 lesson steps plus 7 checkpoints
  - Reviews include multiple-choice questions covering colors with gender agreement and basic descriptive adjectives
  - Course now covers essential color vocabulary and adjective usage with structured review intervals
- **Updated Italian Course 6 (Travel Basics) with Inline Reviews**:
  - Replaced the existing Italian Travel Basics course with enhanced version that includes reviews after every 4 lessons
  - Added 10 checkpoint reviews throughout the course (9 regular reviews + 1 final review)
  - Successfully imported 34 lessons with 102 lesson steps plus 10 checkpoints
  - Reviews include multiple-choice questions covering travel phrases, directions, transportation, and emergency needs
  - Course now covers essential travel vocabulary with structured review intervals for better retention
- **Updated Italian Course 5 (Time and Date) with Inline Reviews**:
  - Replaced the existing Italian Time and Date course with enhanced version that includes reviews after every 4 lessons
  - Added 11 checkpoint reviews throughout the course (10 regular reviews + 1 final review)
  - Successfully imported 38 lessons with 114 lesson steps plus 11 checkpoints
  - Reviews include multiple-choice questions covering days of the week, months, time expressions, and date phrases
  - Course now covers comprehensive time and date vocabulary with structured review intervals
- **Updated Italian Course 4 (Numbers) with Inline Reviews**:
  - Replaced the existing Italian Numbers course with enhanced version that includes reviews after every 4 lessons
  - Added 9 checkpoint reviews throughout the course (8 regular reviews + 1 final review)
  - Updated database storage system to handle both regular lessons and review checkpoints during course import
  - Enhanced `importCourseFromJSON` method to process review sections and create checkpoint records
  - Successfully imported 32 lessons with 96 lesson steps plus 9 checkpoints
  - Reviews include multiple-choice questions with pass/fail rules and retry logic

## Previous Changes (August 13, 2025)
- Added Italian Beginner Courses 9-13 to the database:
  - Course 9: Food and Drinks (22 lessons)
  - Course 10: Directions and Places (21 lessons) 
  - Course 11: Shopping (13 lessons)
  - Course 12: Expressing Likes and Dislikes (14 lessons)
  - Course 13: Basic Grammar Essentials (29 lessons)
- Total Italian Beginner content now: 13 courses with 282 lessons
- Updated seed-database.ts to include new course files
- **Added Complete German Beginner Course Collection**:
  - Added German language to database (code: 'de')
  - Imported 7 complete German beginner courses with 110 total lessons:
    - Course 1: Greetings (13 lessons)
    - Course 2: Introducing Yourself (13 lessons)
    - Course 3: Noun Gender & Articles (8 lessons)
    - Course 4: Essential Courtesy Phrases (13 lessons)
    - Course 5: Numbers (6 lessons)
    - Course 6: Days, Months, Seasons (46 lessons)
    - Course 7: Telling Time (11 lessons)
  - Users who sign up for German Beginner will now access this complete curriculum
- **Implemented Checkpoint Review System**:
  - Added checkpoint reviews that appear after every 4 lessons completed
  - New API endpoint `/api/available-checkpoints` tracks user eligibility 
  - Dashboard displays checkpoint availability prominently
  - Integrated checkpoint notifications into existing notification system (30% of notifications when available)
  - Checkpoint notifications are clickable and direct users to review quizzes
- **Fixed Notification Loading Issue**:
  - Identified root cause: notifications were creating URLs for non-existent courses (course3)
  - Fixed client-side URL mapping to use actual existing course files (course1, course2, course4)
  - Fixed server-side getNextLesson logic to only return existing course numbers
  - Improved error handling in lesson component for failed notification scenarios
  - Added debugging logs for better notification tracking

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
- **Checkpoint Review System**: Automatic checkpoint reviews after every 4 lessons completed, with progress tracking and quiz functionality.
- **Notifications**: Browser notifications for learning reminders and checkpoint reviews, with controlled daily sessions and robust deduplication.
- **Data Models**: Users, User Settings, User Progress, User Stats, Sessions, Checkpoints, Checkpoint Progress.

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