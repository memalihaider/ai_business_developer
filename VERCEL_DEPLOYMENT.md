# Vercel Deployment Guide

This guide will help you deploy your AI Business Developer application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Database**: Set up a production database (recommended: Vercel Postgres)

## Database Setup Options

### Option 1: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database → Postgres
3. Create a new Postgres database
4. Copy the connection string provided
5. Add it to your environment variables as `DATABASE_URL`

### Option 2: External Database (PlanetScale, Supabase, etc.)

1. Create a database on your preferred provider
2. Get the connection string
3. Add it to your environment variables as `DATABASE_URL`

## Environment Variables Setup

In your Vercel project settings, add these environment variables:

### Required Variables
```
DATABASE_URL=postgresql://username:password@hostname:port/database
NEXTAUTH_SECRET=your-nextauth-secret-key-here
NEXTAUTH_URL=https://your-domain.vercel.app
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Optional Variables (if using these services)
```
OPENROUTER_API_KEY=your-openrouter-api-key
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
GOOGLE_API_KEY=your-google-api-key-here
GOOGLE_SEARCH_ENGINE_ID=your-custom-search-engine-id-here
OPENAI_API_KEY=your-openai-api-key-here
```

## Deployment Steps

1. **Connect Repository**:
   - Go to Vercel dashboard
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run vercel-build` (automatically detected)
   - Output Directory: `.next` (automatically detected)
   - Install Command: `npm install` (automatically detected)

3. **Set Environment Variables**:
   - Add all required environment variables in the project settings
   - Make sure `DATABASE_URL` points to your production database

4. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

## Post-Deployment

1. **Database Migration**:
   - The `vercel-build` script will automatically run `prisma db push`
   - This will create/update your database schema

2. **Verify Deployment**:
   - Check that all API routes are working
   - Test database connectivity
   - Verify authentication flows

## Important Notes

- **SQLite Limitation**: SQLite (`file:./dev.db`) won't work in production on Vercel
- **Database Persistence**: Use Vercel Postgres or external database for data persistence
- **Environment Variables**: Never commit sensitive data to your repository
- **Build Optimization**: The app is configured to ignore TypeScript and ESLint errors during build

## Troubleshooting

### Common Issues:

1. **Database Connection Error**:
   - Verify `DATABASE_URL` is correctly set
   - Ensure database is accessible from Vercel

2. **Build Failures**:
   - Check build logs in Vercel dashboard
   - Verify all dependencies are in `package.json`

3. **API Routes Not Working**:
   - Check function timeout settings (configured for 30s)
   - Verify environment variables are set

## Support

For additional help:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)