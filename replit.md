# CodeClassroom - Java Programming Education Platform

## Overview

CodeClassroom is a comprehensive Java programming education platform that combines classroom management with interactive coding challenges. The system features auto-grading capabilities, gamified student progress tracking, and real-time collaboration tools for both teachers and students.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state
- **UI Components**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Replit OAuth integration with session management
- **Code Execution**: Java compilation and execution via child processes
- **WebSocket Support**: Planned for real-time features

### Database Layer
- **ORM**: Drizzle ORM with TypeScript-first schema
- **Database**: PostgreSQL (Neon serverless)
- **Migrations**: Drizzle Kit for schema management
- **Session Storage**: PostgreSQL-based session store

## Key Components

### Authentication System
- Replit OAuth integration for seamless authentication
- Role-based access control (teacher/student)
- Session management with PostgreSQL storage
- User profile management with avatar support

### Classroom Management
- Teacher-created classrooms with invite codes
- Student enrollment system
- Real-time leaderboards and progress tracking
- Assignment distribution and management

### Code Execution Engine
- Java compilation and execution in isolated processes
- Test case validation with timeout handling
- Security measures for code sandboxing
- Result caching and performance optimization

### Gamification System
- Point-based scoring system
- Level progression mechanics
- Achievement tracking
- Streak counters and engagement metrics

### UI Component System
- Consistent design language using shadcn/ui
- Responsive design for mobile and desktop
- Dark/light theme support
- Accessible components following ARIA standards

## Data Flow

### User Authentication Flow
1. User initiates login through Replit OAuth
2. Server validates OAuth token and creates/updates user record
3. Session established with PostgreSQL storage
4. Client receives user data and role information

### Problem Solving Flow
1. Teacher creates problem with test cases and metadata
2. Students access problems through classroom interface
3. Code submission triggers compilation and testing
4. Results processed and points awarded
5. Leaderboard and progress updated in real-time

### Classroom Management Flow
1. Teacher creates classroom with unique invite code
2. Students join using invite code
3. Teacher assigns problems and tracks progress
4. Real-time updates provided to all participants

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **wouter**: Lightweight React routing

### Development Tools
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for Node.js
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-***: Replit-specific development tools

### Authentication & Security
- **openid-client**: OAuth 2.0/OpenID Connect client
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development Environment
- Vite development server with HMR
- TypeScript compilation with strict mode
- Real-time error overlay for debugging
- Replit integration for seamless development

### Production Build
- Vite production build for optimized client assets
- esbuild for server-side bundling
- Static asset serving with proper caching
- Environment-based configuration

### Database Management
- Drizzle migrations for schema versioning
- Connection pooling for scalability
- Environment-based database URL configuration
- Backup and recovery procedures

### Security Considerations
- Code execution sandboxing
- Input validation and sanitization
- Rate limiting for API endpoints
- Secure session management

## User Preferences

Preferred communication style: Simple, everyday language.

## Local Development Setup

### Prerequisites for Local Development
- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **PostgreSQL database** (local or remote)
- **Java JDK** (for code execution features)

### Environment Setup for Local Development
1. **Database Configuration**: 
   - Set `DATABASE_URL` environment variable with your PostgreSQL connection string
   - Example: `postgresql://username:password@localhost:5432/database_name`

2. **Optional Environment Variables**:
   - `SESSION_SECRET`: Custom session secret (defaults to development secret if not provided)
   - OAuth variables are not required for local development

3. **Database Schema Setup**:
   ```bash
   npm run db:push
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   
   Application runs on http://localhost:5000

### Authentication in Local Development
- **OAuth Authentication**: Disabled automatically when Replit environment variables are not detected
- **Email Authentication**: Fully functional for creating accounts and logging in
- **Session Management**: Uses PostgreSQL session storage with local-friendly settings

### Key Differences from Production
- OAuth/SSO authentication is disabled
- Session cookies use `secure: false` for HTTP development
- Default session secret provided for convenience
- Console logging indicates local development mode

## Recent Changes

- July 11, 2025: Enhanced local development support
  - Made Replit OAuth authentication optional for local development environments
  - Added automatic detection of Replit environment variables
  - Configured session management to work with both HTTP (local) and HTTPS (production)
  - Added fallback session secret for local development
  - Email authentication system remains fully functional for local use
  - Application now starts successfully without OAuth configuration errors

- July 8, 2025 (5:50 PM): Updated problem statement view to show 2 example test cases
  - Modified problem solver page to display up to 2 example test cases instead of 1
  - Updated code editor modal to consistently show 2 examples
  - Changed headings from "Example:" to "Examples:" for clarity
  - Added proper numbering (Example 1, Example 2) with consistent styling
  - Both views now use .slice(0, 2) to show first 2 test cases when available

- July 8, 2025 (4:30 PM): Added comprehensive classroom submissions viewing for teachers
  - Created new API endpoint `/api/classrooms/:id/submissions` with teacher-only authorization
  - Built ClassroomSubmissions component with search, filtering, and detailed viewing
  - Added toggle interface between Problems and All Submissions views
  - Fixed React hooks error by replacing Tabs component with custom toggle buttons
  - Teachers can now view all student submissions in their classrooms with full details
  - Includes search by student name/email/problem, filter by status and problem
  - Detailed submission modal shows code, output, errors, and execution metadata
  - Successfully tested and deployed with proper permission controls

- July 8, 2025 (4:10 PM): Completed teacher-exclusive classroom management features
  - Enhanced edit modal to exactly match problem creation form
  - Integrated CodeMirror with Java syntax highlighting for starter code editing
  - Added Switch component for scheduling toggle matching original design
  - Implemented proper datetime-local input with timezone information
  - Updated test cases layout to match original form styling with proper grid
  - Fixed form structure to use consistent shadcn/ui components
  - Teachers can now edit, copy, and delete problems with unified interface
  - All forms maintain exact visual and functional consistency
  - Successfully tested and ready for production deployment

- July 8, 2025 (3:50 PM): Added problem copying functionality between classrooms
  - Added `copyProblem` method to storage interface for duplicating problems
  - Created `/api/problems/:id/copy` API endpoint with proper teacher authorization
  - Built CopyProblemModal component with classroom selection and schedule options
  - Added copy button next to delete button for problem creators in classroom view
  - Teachers can copy problems they created to any of their other classrooms
  - Modal provides option to copy with or without original schedule timing
  - Includes problem preview showing title, description, difficulty, points, and time limit
  - Validates permissions ensuring only problem creators can copy their own problems
  - Successfully tested and deployed to production

- January 7, 2025 (3:05 AM): Added scheduled problem functionality
  - Added `scheduledAt` timestamp field to problems table for scheduling release times
  - Updated problem creation form with scheduling toggle and datetime picker
  - Modified classroom view to show scheduled problems with countdown timers
  - Scheduled problems display as locked with countdown until available
  - Added visual indicators (lock icon, orange badges) for scheduled problems
  - Implemented server-side access control to prevent early access to scheduled problems
  - Teachers who created the problem can still view it before scheduled time
  - Used date-fns library for countdown formatting in user's local timezone
  - Fixed timezone handling to use client's local timezone for scheduling
  - Fixed Zod validation to accept string dates and convert to proper timestamps
  - Successfully deployed to production

- July 3, 2025 (3:22 PM): Added clickable recent submissions with detailed modal view
  - Made recent submission items clickable with hover effects and cursor pointer
  - Created comprehensive SubmissionDetails modal showing submission code, output, errors, and metadata
  - Added proper date formatting, status indicators, and accessibility features
  - Modal displays problem details, student info, execution time, and complete submission context
  - Fixed accessibility warning by adding dialog description

- July 3, 2025 (2:19 AM): Fixed Drizzle ORM query syntax error in classroom student filtering
  - Replaced invalid `.and()` method with proper `and()` function for combining WHERE conditions
  - Fixed TypeScript compilation error in server/storage.ts
  - Application now properly filters out test users from classroom student lists

- July 2, 2025 (10:10 PM): Added classroom editing and deletion functionality for teachers
  - Teachers can now edit classroom names and descriptions through a modal dialog
  - Teachers can delete entire classrooms with cascading deletion of all related data
  - Added proper permission checks ensuring only classroom creators can edit/delete
  - Implemented confirmation dialogs for destructive actions
  - Fixed form reset issues that prevented editing in modal dialogs

- July 2, 2025 (9:08 PM): Added test user functionality to exclude users from leaderboards
  - Added `test_user` boolean column to users table with default value false
  - Updated leaderboard queries to filter out test users
  - Created API endpoint PATCH `/api/users/:id/test-status` for teachers to toggle test status
  - Added storage method `updateUserTestStatus` for database operations
  - Test users can still participate in classrooms but won't appear on leaderboards

- July 2, 2025 (8:35 PM): Implemented one-time point earning system for problem solving
  - Added functionality to prevent users from earning points multiple times for the same problem
  - Users can still submit solutions for practice after earning points once
  - Added visual indicators showing when a problem has been solved
  - Updated backend to track which problems users have solved successfully
  - Enhanced problem solver interface with solved status badges and informational messages
  - Modified achievement tracking to count unique problems solved instead of total submissions

- July 2, 2025 (8:30 PM): Added optional test case inputs and problem deletion functionality
  - Modified problem creation form to allow optional inputs for test cases
  - Updated Java code executor to handle empty inputs properly
  - Added problem deletion API endpoint with proper authorization checks
  - Implemented delete buttons in classroom view for teachers who created problems
  - Added confirmation dialogs and error handling for delete operations
  - Updated problem display to conditionally show input examples only when provided

- July 2, 2025 (8:18 PM): Added email signup and authentication system
  - Added password and authType fields to user database schema
  - Created email signup API routes (/api/auth/signup, /api/auth/login, /api/auth/logout)
  - Built comprehensive auth page with form validation and mode switching
  - Updated landing page with signup/signin options
  - Added combined authentication supporting both OAuth and email
  - Fixed authentication polling issues and form editability problems
  - Fixed error handling for null authentication errors

- June 30, 2025 (11:42 PM): Fixed syntax highlighting in code editor
  - Replaced basic textarea with CodeMirror editor in problem solver page
  - Added Java syntax highlighting with proper language extensions
  - Configured editor features: line numbers, bracket matching, auto-completion
  - Added test functionality with loading states
  - Fixed React hooks compatibility issues and user loading states
  - Syntax highlighting now working properly for Java code

## Changelog

Changelog:
- June 30, 2025. Initial setup
- June 30, 2025. Enhanced code editor with Java syntax highlighting