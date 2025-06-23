# replit.md

## Overview

This is a Danish rental property platform ("Lejebolig Nu") built as a full-stack web application. The system connects tenants with landlords, allowing property listings, search functionality, messaging, and favorites management. The application uses a modern tech stack with React frontend, Express backend, and PostgreSQL database with Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom Danish-themed design system
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Session Management**: Express sessions with PostgreSQL session store
- **Database Connection**: Neon serverless PostgreSQL with connection pooling

### Database Schema
The application uses a relational database with the following core entities:
- **Users**: Stores user information with role-based access (tenant/landlord)
- **Properties**: Property listings with details like price, location, size, and availability
- **Messages**: Direct messaging system between users regarding properties
- **Favorites**: User's saved property listings

## Key Components

### Authentication System
- JWT token-based authentication
- Role-based access control (tenant vs landlord)
- Password hashing with bcrypt
- Session persistence with local storage

### Property Management
- CRUD operations for property listings
- Image upload support (configured but not fully implemented)
- Search and filtering capabilities
- Availability tracking

### Messaging System
- Direct messages between tenants and landlords
- Property-specific conversations
- Read/unread status tracking

### User Interface
- Responsive design optimized for mobile and desktop
- Danish language interface
- Custom design system with Danish blue theme
- Comprehensive component library based on Radix UI

## Data Flow

1. **Authentication Flow**: Users register/login → JWT token stored → Token sent with API requests → Server validates token → User data attached to requests

2. **Property Search Flow**: User searches → Frontend sends filters to API → Backend queries database with filters → Results returned and displayed

3. **Messaging Flow**: User sends message → API creates message record → Recipient can view in messages page → Real-time updates through polling

4. **Favorites Flow**: User clicks favorite → API toggles favorite status → Frontend updates UI optimistically → Database updated

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT token management
- **express**: Web server framework
- **react**: Frontend framework

### UI Dependencies
- **@radix-ui/react-***: Headless UI components
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20
- **Development Server**: Vite dev server with Express API
- **Database**: PostgreSQL 16 module in Replit
- **Port Configuration**: Local port 5000, external port 80

### Production Build
- **Frontend Build**: Vite builds React app to `dist/public`
- **Backend Build**: esbuild bundles Express server to `dist/index.js`
- **Deployment Target**: Replit Autoscale
- **Environment Variables**: DATABASE_URL required for database connection

### Build Commands
- `npm run dev`: Development server with hot reload
- `npm run build`: Production build for both frontend and backend
- `npm run start`: Production server
- `npm run db:push`: Database schema deployment

## Changelog

- June 23, 2025: VPS deployment preparation completed
  - Added complete environment variable configuration
  - Implemented PM2 and Nginx configuration files
  - Created automated deployment scripts
  - Enhanced security with production JWT handling
  - Added comprehensive deployment documentation
- June 22, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.