# PriceScan - Barcode Price Comparison Application

## Overview

PriceScan is a full-stack web application that allows users to scan product barcodes and compare prices across different retailers. Users can scan a product, view detailed pricing information from various stores, and access their scan history.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern web architecture with the following components:

1. **Frontend**:
   - React-based single-page application
   - Tailwind CSS for styling with the shadcn/ui component library
   - Responsive design optimized for mobile devices

2. **Backend**:
   - Express.js server
   - RESTful API endpoints for product lookup and scan history
   - Integration with external barcode API services

3. **Database**:
   - PostgreSQL database (via Drizzle ORM)
   - Schema for products, stores, and prices

4. **State Management**:
   - React Query for server state management
   - Local component state for UI interactions

## Key Components

### Frontend Components

1. **Scanner Module**:
   - Camera access for barcode scanning
   - Manual barcode entry as a fallback
   - Visual overlay for guiding the scanning process

2. **Product Display**:
   - Product information card
   - Price comparison across stores
   - Best price highlighting

3. **History Module**:
   - List of previously scanned products
   - Quick access to past scan results
   - Option to clear history

4. **UI Components**:
   - Reusable UI components from shadcn/ui library
   - Toast notifications for user feedback
   - Loading and error states

### Backend Components

1. **API Routes**:
   - `/api/lookup/:barcode` - Fetches product info by barcode
   - `/api/history` - Manages scan history
   - External barcode lookup API integration

2. **Data Storage**:
   - Database models for products, stores, and prices
   - In-memory storage fallback for development

3. **Server Setup**:
   - Development server with hot reloading
   - Production build configuration

## Data Flow

1. **Barcode Scanning Process**:
   - User scans a barcode via camera or manually enters it
   - Frontend sends a request to the backend API
   - Backend checks if the product exists in the database
   - If not, it fetches data from an external barcode API
   - Product data is returned to the frontend and displayed
   - Scan history is updated

2. **Price Comparison**:
   - For each product, price data from multiple stores is shown
   - Best price is highlighted for quick comparison
   - Store details and stock information are displayed

3. **History Management**:
   - Scans are saved to history with timestamps
   - User can access history to view past scans
   - History can be cleared by the user

## External Dependencies

1. **UI Libraries**:
   - shadcn/ui (based on Radix UI) for accessible components
   - Tailwind CSS for styling
   - Lucide React for icons

2. **Data Management**:
   - TanStack React Query for server state
   - Zod for data validation
   - Axios for API requests

3. **Development Tools**:
   - Vite for development and building
   - TypeScript for type safety
   - ESBuild for server bundling

4. **Backend Libraries**:
   - Express for the server
   - Drizzle ORM for database operations
   - Neon Serverless PostgreSQL client

## Database Schema

The database uses three main tables:

1. **products**:
   - `id`: Primary key
   - `barcode`: Unique product identifier
   - `title`: Product name
   - `brand`: Brand name
   - `category`: Product category

2. **stores**:
   - `id`: Primary key
   - `name`: Store name
   - `logo`: Store logo URL

3. **prices**:
   - `id`: Primary key
   - `productId`: Foreign key to products
   - `storeId`: Foreign key to stores
   - `price`: Price value
   - `currency`: Currency code
   - `inStock`: Stock status
   - `updatedAt`: Last update timestamp

## Deployment Strategy

The application is configured for deployment on Replit with:

1. **Build Process**:
   - Frontend: Vite build process
   - Backend: ESBuild for bundling the server

2. **Runtime Environment**:
   - Node.js 20
   - PostgreSQL 16

3. **Startup Commands**:
   - Development: `npm run dev`
   - Production: `npm run start`

4. **Port Configuration**:
   - Application runs on port 5000
   - Mapped to port 80 for external access

## Getting Started

1. Ensure the PostgreSQL database is provisioned (via Replit's database feature)
2. Set the required environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `BARCODE_LOOKUP_API_KEY`: API key for barcode lookup service
3. Run `npm run dev` to start the development server
4. Run `npm run db:push` to push the database schema

## Next Steps

1. Implement the barcode scanning functionality using a library like quagga.js or zbar.wasm
2. Complete the API integration with actual barcode lookup services
3. Add user authentication to personalize history
4. Implement offline capabilities with service workers