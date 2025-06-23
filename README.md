# LejeBoligNu - Danish Rental Property Platform

A modern, full-stack rental property platform built with React, Express.js, and PostgreSQL. Features user authentication, property listings, messaging system, and favorites functionality.

## Features

- **User Management**: Tenant and landlord registration/authentication
- **Property Listings**: Create, browse, and search rental properties
- **Messaging System**: Direct communication between tenants and landlords
- **Favorites**: Save and manage favorite properties
- **Responsive Design**: Mobile-first Danish interface
- **Real-time Updates**: Live messaging and notifications

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Radix UI components
- TanStack Query for data fetching
- Wouter for routing

### Backend
- Node.js with Express
- PostgreSQL database
- Drizzle ORM
- JWT authentication
- bcrypt for password hashing

## Quick Start

### Development
```bash
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

### Production Deployment
```bash
npm install
cp .env.example .env
# Configure your .env file
npm run build
npm start
```

## Environment Variables

Required environment variables (see `.env.example`):

```env
DATABASE_URL=postgresql://username:password@localhost:5432/leje_bolig_nu
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret
SESSION_SECRET=your-secure-session-secret
```

## Database Setup

```bash
# Push schema to database
npm run db:push

# Or use migrations
npm run db:generate
npm run db:migrate
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push database schema
- `npm run db:generate` - Generate migrations
- `npm run db:migrate` - Run migrations

## Production Deployment

This application is VPS-ready with:

- PM2 configuration for process management
- Nginx reverse proxy configuration
- SSL/TLS support
- Environment-based configuration
- Production optimizations

See `DEPLOYMENT.md` for complete deployment instructions.

## License

MIT License