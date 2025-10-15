# InventoryLite - Multi-Tenant SaaS Inventory Management System

A comprehensive, modern inventory management system built with Next.js 14, Supabase, and Tailwind CSS. Features Google Sign-In authentication, real-time data, and multi-tenant architecture.

## 🚀 Features

- **Google Sign-In Authentication** - Secure authentication using Google Identity Services
- **Multi-Tenant Architecture** - Complete data isolation per tenant
- **Real-time Inventory Management** - Track items, categories, and stock levels
- **Purchase & Sales Orders** - Manage purchase_orders and sales_orders
- **Advanced Reporting** - Charts, analytics, and export capabilities
- **Feedback System** - User feedback with ratings and admin responses
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Role-Based Access** - SUPER_ADMIN, TENANT_ADMIN, and USER roles

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI, Heroicons
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Authentication**: Google Sign-In (Google Identity Services)

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Cloud Console account

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd InventoryLite
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp env.example .env.local
```

Fill in your environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=InventoryLite
```

### 4. Set Up Google Sign-In

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:{{YOUR_PORT}}` (for development)
   - `https://yourdomain.com` (for production)
7. Add authorized redirect URIs:
   - `http://localhost:{{YOUR_PORT}}/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)

### 5. Set Up Supabase

1. Create a new project at [Supabase](https://supabase.com)
2. Go to Settings → API to get your project URL and anon key
3. Run the database schema:

```bash
# Copy the SQL from database_schema.sql and run it in your Supabase SQL editor
```

### 6. Run the Development Server

```bash
npm run dev
```

Open `http://localhost:{{YOUR_PORT}}` in your browser.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Clone the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
