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

## Recent Changes

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