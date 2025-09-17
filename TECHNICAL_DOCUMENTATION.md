# AI Business Developer - Complete Technical Documentation

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [File Structure](#file-structure)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Authentication System](#authentication-system)
7. [Frontend Components](#frontend-components)
8. [Backend Services](#backend-services)
9. [Development Setup](#development-setup)
10. [Production Configuration](#production-configuration)
11. [Performance Optimizations](#performance-optimizations)
12. [Security Measures](#security-measures)

---

## Technology Stack

### Frontend Technologies
- **Framework**: Next.js 14.x (React-based full-stack framework)
- **Language**: TypeScript 5.x
- **Styling**: 
  - Tailwind CSS 3.x (Utility-first CSS framework)
  - CSS Modules
  - PostCSS for processing
- **UI Components**: 
  - Radix UI (Headless UI components)
  - Shadcn/ui (Pre-built component library)
  - Lucide React (Icon library)
- **State Management**: 
  - React Context API
  - React Hooks (useState, useEffect, useReducer)
  - Custom hooks for business logic

### Backend Technologies
- **Runtime**: Node.js 18.x LTS
- **Framework**: Next.js API Routes (Server-side)
- **Language**: TypeScript
- **Database ORM**: Prisma 5.x
- **Database**: 
  - PostgreSQL (Production)
  - SQLite (Development)
- **Authentication**: NextAuth.js 4.x
- **File Upload**: Multer middleware
- **Validation**: Zod schema validation

### AI/ML Integration
- **OpenAI API**: GPT-4 for business analysis and recommendations
- **AI Services**: Custom business intelligence algorithms
- **Data Processing**: Natural language processing for business insights

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint with TypeScript support
- **Code Formatting**: Prettier
- **Type Checking**: TypeScript compiler
- **Build Tool**: Next.js built-in Webpack configuration
- **Version Control**: Git

### Production Infrastructure
- **Process Manager**: PM2
- **Web Server**: Nginx (Reverse proxy)
- **SSL**: Let's Encrypt certificates
- **Monitoring**: Custom monitoring scripts
- **Backup**: Automated database and file backups

---

## Architecture Overview

### Application Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                        │
├─────────────────────────────────────────────────────────────┤
│                 Next.js Frontend                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Pages     │ │ Components  │ │   Hooks     │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│                 Next.js API Routes                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Auth Routes │ │ API Routes  │ │ Middleware  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│                   Business Logic                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  Services   │ │ Utilities   │ │ Validators  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Prisma    │ │  Database   │ │ External    │          │
│  │    ORM      │ │(PostgreSQL) │ │   APIs      │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow
1. **Client Request** → Next.js Router
2. **Authentication** → NextAuth.js middleware
3. **API Processing** → Next.js API routes
4. **Business Logic** → Custom services and utilities
5. **Data Access** → Prisma ORM
6. **Database** → PostgreSQL/SQLite
7. **Response** → JSON/HTML back to client

---

## File Structure

```
AI-Business-Developer/
├── 📁 .next/                          # Next.js build output
├── 📁 .git/                           # Git repository
├── 📁 backups/                        # Database backups
│   ├── database-backup-*.backup
│   └── ...
├── 📁 docs/                           # Documentation
│   ├── custom-platforms.md
│   └── ...
├── 📁 node_modules/                   # Dependencies
├── 📁 prisma/                         # Database configuration
│   ├── 📄 schema.prisma              # Database schema
│   ├── 📄 seed.ts                    # Database seeding
│   ├── 📄 dev.db                     # SQLite database (dev)
│   └── 📁 migrations/                # Database migrations
├── 📁 public/                         # Static assets
│   ├── 📄 next.svg
│   ├── 📄 vercel.svg
│   ├── 📄 file.svg
│   ├── 📄 globe.svg
│   └── 📄 window.svg
├── 📁 scripts/                        # Deployment scripts
│   ├── 📄 deploy.sh                  # Deployment automation
│   ├── 📄 monitor.sh                 # System monitoring
│   └── 📄 setup-server.sh            # Server setup
├── 📁 src/                           # Source code
│   ├── 📁 app/                       # Next.js App Router
│   │   ├── 📁 (auth)/               # Authentication routes
│   │   │   ├── 📁 login/
│   │   │   └── 📁 register/
│   │   ├── 📁 api/                   # API routes
│   │   │   ├── 📁 auth/             # Authentication APIs
│   │   │   ├── 📁 business-analysis/ # Business analysis APIs
│   │   │   ├── 📁 team-management/   # Team management APIs
│   │   │   ├── 📁 projects/         # Project management APIs
│   │   │   └── 📁 users/            # User management APIs
│   │   ├── 📁 dashboard/            # Dashboard pages
│   │   ├── 📁 business-analysis/    # Business analysis pages
│   │   ├── 📁 team-management/      # Team management pages
│   │   ├── 📁 projects/             # Project pages
│   │   ├── 📄 layout.tsx            # Root layout
│   │   ├── 📄 page.tsx              # Home page
│   │   ├── 📄 globals.css           # Global styles
│   │   └── 📄 loading.tsx           # Loading component
│   ├── 📁 components/               # Reusable components
│   │   ├── 📁 ui/                   # UI components (Shadcn)
│   │   │   ├── 📄 button.tsx
│   │   │   ├── 📄 input.tsx
│   │   │   ├── 📄 card.tsx
│   │   │   ├── 📄 dialog.tsx
│   │   │   └── ...
│   │   ├── 📁 forms/                # Form components
│   │   ├── 📁 charts/               # Chart components
│   │   ├── 📁 navigation/           # Navigation components
│   │   └── 📁 layout/               # Layout components
│   ├── 📁 contexts/                 # React contexts
│   │   ├── 📄 AuthContext.tsx
│   │   ├── 📄 ThemeContext.tsx
│   │   └── 📄 BusinessContext.tsx
│   ├── 📁 hooks/                    # Custom React hooks
│   │   ├── 📄 useAuth.ts
│   │   ├── 📄 useLocalStorage.ts
│   │   ├── 📄 useDebounce.ts
│   │   └── 📄 useBusiness.ts
│   └── 📁 lib/                      # Utility libraries
│       ├── 📄 auth.ts               # Authentication utilities
│       ├── 📄 db.ts                 # Database connection
│       ├── 📄 utils.ts              # General utilities
│       ├── 📄 validations.ts        # Zod schemas
│       ├── 📄 openai.ts             # OpenAI integration
│       └── 📄 constants.ts          # Application constants
├── 📄 .env.example                   # Environment variables template
├── 📄 .env.production.example        # Production environment template
├── 📄 .gitignore                     # Git ignore rules
├── 📄 components.json                # Shadcn/ui configuration
├── 📄 eslint.config.mjs              # ESLint configuration
├── 📄 middleware.ts                  # Next.js middleware
├── 📄 next.config.js                 # Next.js configuration
├── 📄 next.config.ts                 # TypeScript Next.js config
├── 📄 package.json                   # Dependencies and scripts
├── 📄 package-lock.json              # Dependency lock file
├── 📄 postcss.config.mjs             # PostCSS configuration
├── 📄 README.md                      # Project documentation
├── 📄 tsconfig.json                  # TypeScript configuration
├── 📄 DEPLOYMENT_GUIDE.md            # Deployment instructions
├── 📄 DEPLOYMENT_CHECKLIST.md        # Deployment checklist
└── 📄 TECHNICAL_DOCUMENTATION.md     # This file
```

---

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "emailVerified" DATETIME,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
```

#### Business Analysis Table
```sql
CREATE TABLE "BusinessAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "industry" TEXT,
    "targetMarket" TEXT,
    "analysis" TEXT,
    "recommendations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id")
);
```

#### Projects Table
```sql
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "budget" DECIMAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("ownerId") REFERENCES "User"("id")
);
```

#### Team Management Tables
```sql
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "leaderId" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("leaderId") REFERENCES "User"("id"),
    FOREIGN KEY ("projectId") REFERENCES "Project"("id")
);

CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("teamId") REFERENCES "Team"("id"),
    FOREIGN KEY ("userId") REFERENCES "User"("id")
);
```

### Prisma Schema Configuration
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or "sqlite" for development
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?
  role          Role      @default(USER)
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  accounts         Account[]
  sessions         Session[]
  businessAnalyses BusinessAnalysis[]
  ownedProjects    Project[] @relation("ProjectOwner")
  teamMemberships  TeamMember[]
  ledTeams         Team[] @relation("TeamLeader")
}

enum Role {
  USER
  ADMIN
  MANAGER
}
```

---

## API Endpoints

### Authentication Endpoints
```typescript
// Authentication routes (NextAuth.js)
POST   /api/auth/signin          // Sign in user
POST   /api/auth/signout         // Sign out user
GET    /api/auth/session         // Get current session
POST   /api/auth/signup          // Register new user
GET    /api/auth/providers       // Get auth providers
```

### Business Analysis Endpoints
```typescript
// Business Analysis API
GET    /api/business-analysis     // Get all analyses
POST   /api/business-analysis     // Create new analysis
GET    /api/business-analysis/[id] // Get specific analysis
PUT    /api/business-analysis/[id] // Update analysis
DELETE /api/business-analysis/[id] // Delete analysis
POST   /api/business-analysis/generate // Generate AI analysis
```

### Project Management Endpoints
```typescript
// Project Management API
GET    /api/projects             // Get all projects
POST   /api/projects             // Create new project
GET    /api/projects/[id]        // Get specific project
PUT    /api/projects/[id]        // Update project
DELETE /api/projects/[id]        // Delete project
GET    /api/projects/[id]/tasks  // Get project tasks
POST   /api/projects/[id]/tasks  // Create project task
```

### Team Management Endpoints
```typescript
// Team Management API
GET    /api/team-management/teams        // Get all teams
POST   /api/team-management/teams        // Create new team
GET    /api/team-management/teams/[id]   // Get specific team
PUT    /api/team-management/teams/[id]   // Update team
DELETE /api/team-management/teams/[id]  // Delete team
GET    /api/team-management/assignments // Get assignments
POST   /api/team-management/assignments // Create assignment
```

### User Management Endpoints
```typescript
// User Management API
GET    /api/users               // Get all users
GET    /api/users/[id]          // Get specific user
PUT    /api/users/[id]          // Update user
DELETE /api/users/[id]          // Delete user
GET    /api/users/profile       // Get current user profile
PUT    /api/users/profile       // Update current user profile
```

---

## Authentication System

### NextAuth.js Configuration
```typescript
// src/lib/auth.ts
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./db"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Custom authentication logic
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
    signUp: "/register"
  }
}
```

### Middleware Protection
```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Additional middleware logic
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Authorization logic
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/business-analysis/:path*",
    "/team-management/:path*",
    "/projects/:path*"
  ]
}
```

---

## Frontend Components

### Component Architecture
```typescript
// Component hierarchy
App
├── Layout
│   ├── Header
│   │   ├── Navigation
│   │   ├── UserMenu
│   │   └── ThemeToggle
│   ├── Sidebar
│   │   ├── NavigationMenu
│   │   └── QuickActions
│   └── Footer
├── Pages
│   ├── Dashboard
│   │   ├── StatsCards
│   │   ├── RecentActivity
│   │   └── QuickActions
│   ├── BusinessAnalysis
│   │   ├── AnalysisList
│   │   ├── AnalysisForm
│   │   └── AnalysisDetails
│   └── TeamManagement
│       ├── TeamList
│       ├── TeamForm
│       └── MemberManagement
└── UI Components
    ├── Forms
    ├── Tables
    ├── Charts
    └── Modals
```

### Key Component Examples
```typescript
// Button Component (Shadcn/ui)
import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes, forwardRef } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

---

## Backend Services

### Service Layer Architecture
```typescript
// Business Analysis Service
export class BusinessAnalysisService {
  async createAnalysis(data: CreateAnalysisInput): Promise<BusinessAnalysis> {
    // Validation
    const validatedData = createAnalysisSchema.parse(data)
    
    // Business logic
    const analysis = await prisma.businessAnalysis.create({
      data: {
        ...validatedData,
        userId: data.userId
      }
    })
    
    // AI processing
    if (data.generateAI) {
      await this.generateAIAnalysis(analysis.id)
    }
    
    return analysis
  }
  
  async generateAIAnalysis(analysisId: string): Promise<void> {
    const analysis = await this.getAnalysis(analysisId)
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a business analysis expert..."
        },
        {
          role: "user",
          content: `Analyze this business: ${analysis.description}`
        }
      ]
    })
    
    await prisma.businessAnalysis.update({
      where: { id: analysisId },
      data: {
        analysis: aiResponse.choices[0].message.content,
        status: "COMPLETED"
      }
    })
  }
}
```

---

## Development Setup

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager
- PostgreSQL (for production) or SQLite (for development)
- Git

### Installation Steps
```bash
# Clone repository
git clone https://github.com/memalihaider/ai_business_developer.git
cd ai_business_developer

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Setup database
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

### Development Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  }
}
```

---

## Production Configuration

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_business_dev"

# NextAuth.js
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Application
NODE_ENV="production"
PORT="3000"
```

### Build Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'yourdomain.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
```

---

## Performance Optimizations

### Frontend Optimizations
- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Next.js Image component
- **Font Optimization**: Next.js Font optimization
- **Bundle Analysis**: webpack-bundle-analyzer
- **Caching**: Browser caching and CDN integration

### Backend Optimizations
- **Database Indexing**: Proper database indexes
- **Query Optimization**: Prisma query optimization
- **Caching**: Redis for session and data caching
- **Connection Pooling**: Database connection pooling
- **API Rate Limiting**: Request rate limiting

### Monitoring
```typescript
// Performance monitoring
import { performance } from 'perf_hooks'

export function withPerformanceMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  name: string
) {
  return async (...args: T): Promise<R> => {
    const start = performance.now()
    try {
      const result = await fn(...args)
      const end = performance.now()
      console.log(`${name} took ${end - start} milliseconds`)
      return result
    } catch (error) {
      const end = performance.now()
      console.error(`${name} failed after ${end - start} milliseconds`, error)
      throw error
    }
  }
}
```

---

## Security Measures

### Authentication Security
- **Password Hashing**: bcrypt for password hashing
- **JWT Tokens**: Secure JWT token implementation
- **Session Management**: Secure session handling
- **CSRF Protection**: Built-in CSRF protection
- **Rate Limiting**: API rate limiting

### Data Security
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM protection
- **XSS Prevention**: React built-in XSS protection
- **HTTPS Enforcement**: SSL/TLS encryption
- **Environment Variables**: Secure environment variable handling

### API Security
```typescript
// API route protection
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }
  
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (!rateLimitResult.success) {
    return new Response("Too Many Requests", { status: 429 })
  }
  
  // API logic here
}
```

---

## Deployment Architecture

### Production Stack
```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                           │
├─────────────────────────────────────────────────────────────┤
│                    Nginx (Reverse Proxy)                  │
├─────────────────────────────────────────────────────────────┤
│                    SSL Termination                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   PM2       │ │   PM2       │ │   PM2       │          │
│  │ Instance 1  │ │ Instance 2  │ │ Instance 3  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│                    PostgreSQL Database                    │
├─────────────────────────────────────────────────────────────┤
│                    Redis Cache (Optional)                 │
├─────────────────────────────────────────────────────────────┤
│                    File Storage                           │
└─────────────────────────────────────────────────────────────┘
```

### Monitoring and Logging
- **Application Monitoring**: PM2 monitoring
- **System Monitoring**: Custom monitoring scripts
- **Error Tracking**: Console logging and file logging
- **Performance Metrics**: Response time and resource usage
- **Backup System**: Automated database and file backups

---

## API Documentation

### Request/Response Format
```typescript
// Standard API Response Format
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

// Error Response Format
interface APIError {
  success: false
  error: string
  details?: any
  timestamp: string
}
```

### Example API Usage
```typescript
// Create Business Analysis
POST /api/business-analysis
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "E-commerce Business Analysis",
  "description": "Analysis of online retail business",
  "industry": "E-commerce",
  "targetMarket": "Young adults 18-35"
}

// Response
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "title": "E-commerce Business Analysis",
    "status": "DRAFT",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Testing Strategy

### Testing Framework
- **Unit Tests**: Jest and React Testing Library
- **Integration Tests**: Supertest for API testing
- **E2E Tests**: Playwright or Cypress
- **Type Checking**: TypeScript compiler

### Test Structure
```typescript
// Example unit test
import { render, screen } from '@testing-library/react'
import { BusinessAnalysisCard } from '@/components/BusinessAnalysisCard'

describe('BusinessAnalysisCard', () => {
  it('renders analysis title correctly', () => {
    const mockAnalysis = {
      id: '1',
      title: 'Test Analysis',
      status: 'COMPLETED'
    }
    
    render(<BusinessAnalysisCard analysis={mockAnalysis} />)
    
    expect(screen.getByText('Test Analysis')).toBeInTheDocument()
  })
})
```

---

This technical documentation provides a comprehensive overview of the AI Business Developer application's architecture, technologies, and implementation details. The application is built with modern web technologies and follows best practices for scalability, security, and maintainability.