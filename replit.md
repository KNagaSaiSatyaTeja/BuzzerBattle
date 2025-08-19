# replit.md

## Overview

This is a real-time quiz application designed for interactive classroom engagement. The system enables instructors to create and manage live quiz sessions while students participate using buzzer-style interactions and multiple-choice answers. Built as a full-stack web application, it features real-time synchronization between admin dashboards and student interfaces, supporting both individual and team-based quiz modes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built using **React with TypeScript** and follows a component-based architecture:
- **UI Framework**: Utilizes shadcn/ui components built on top of Radix UI primitives for consistent, accessible design
- **Styling**: TailwindCSS with custom CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live quiz interactions

The application is structured with distinct page components for different user roles:
- Admin dashboard for quiz creation and management
- Student interfaces for joining and participating in quizzes
- Display screens for quiz questions and leaderboards
- Results pages for poll analysis

### Backend Architecture
The server follows a **Node.js/Express** pattern with TypeScript:
- **Runtime**: Express.js server with middleware for JSON parsing and request logging
- **Real-time Features**: WebSocket server using 'ws' library for live communication between admin and participants
- **API Design**: RESTful endpoints for CRUD operations on quiz sessions, questions, participants, and responses
- **Build System**: Vite for development with hot module replacement, esbuild for production builds

### Data Storage Solutions
The application uses a **PostgreSQL database** with **Drizzle ORM**:
- **Schema Design**: Four main entities (quiz sessions, questions, participants, responses) with proper relationships
- **Database Driver**: Neon Database serverless connection for PostgreSQL
- **Migrations**: Drizzle-kit for schema management and database migrations
- **In-Memory Fallback**: Memory-based storage implementation for development/testing scenarios

### Real-time Communication Architecture
**WebSocket-based synchronization** enables live quiz interactions:
- Session-based client grouping for broadcasting updates
- Real-time buzzer press detection and ordering
- Live timer synchronization across all connected clients
- Automatic participant status updates and score tracking

### Quiz Flow Management
The system implements a **state machine pattern** for quiz progression:
- Quiz sessions progress through states: waiting → active → paused → ended
- Timer-based question transitions with configurable durations
- Buzzer-first and multiple-choice answer collection modes
- Automatic scoring and leaderboard updates

## External Dependencies

### UI and Styling
- **shadcn/ui**: Pre-built UI component library with Radix UI primitives
- **TailwindCSS**: Utility-first CSS framework for responsive design
- **Radix UI**: Accessible component primitives for complex UI interactions
- **class-variance-authority**: Type-safe variant management for component styling

### State and Data Management
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form state management with validation
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL support
- **Zod**: Schema validation for API requests and database operations

### Real-time and Communication
- **ws (WebSocket)**: WebSocket server implementation for real-time features
- **Neon Database**: Serverless PostgreSQL database hosting

### Development and Build Tools
- **Vite**: Frontend build tool with development server and HMR
- **TypeScript**: Type safety across frontend and backend
- **esbuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution environment for development

### Utility Libraries
- **date-fns**: Date manipulation and formatting utilities
- **nanoid**: Unique ID generation for sessions and entities
- **wouter**: Lightweight client-side routing solution