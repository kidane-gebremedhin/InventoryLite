# InventoryLite - Multi-Tenant SaaS Inventory Management System

A comprehensive, modern inventory management system built with Next.js 14, Supabase, and Tailwind CSS. Features Google Sign-In authentication, real-time data, and multi-tenant architecture.

## 🚀 Features

- **Google Sign-In Authentication** - Secure authentication using Google Identity Services
- **Multi-Tenant Architecture** - Complete data isolation per tenant
- **Real-time Inventory Management** - Track items, categories, and stock levels
- **Purchase & Sales Orders** - Manage receivables and issuables
- **Advanced Reporting** - Charts, analytics, and export capabilities
- **Feedback System** - User feedback with ratings and admin responses
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Role-Based Access** - Admin, Manager, and User roles

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI, Heroicons
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Authentication**: Google Sign-In (Google Identity Services)
- **Charts**: Recharts
- **Forms**: React Hook Form, Zod validation
- **Notifications**: React Hot Toast
- **Animations**: Framer Motion

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
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
7. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)
8. Copy the Client ID to your `.env.local` file

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

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄 Database Schema

The application uses the following main tables:

- **tenants** - Multi-tenant organization data
- **users** - User accounts with Google authentication
- **inventory_items** - Product inventory with SKU tracking
- **categories** - Product categorization
- **vendors** - Supplier information
- **customers** - Customer information
- **purchase_orders** - Incoming inventory orders
- **sales_orders** - Outgoing inventory orders
- **transactions** - Inventory movement tracking
- **feedback** - User feedback and ratings

### Row Level Security (RLS)

All tables have RLS policies ensuring data isolation between tenants:

```sql
-- Example RLS policy for inventory items
CREATE POLICY "Users can view inventory items in their tenant" ON inventory_items
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );
```

## 🔐 Authentication

The application uses Google Sign-In for authentication:

- **Google Identity Services** - Modern, secure authentication
- **Automatic User Creation** - Users are created automatically on first sign-in
- **Profile Pictures** - Displays Google profile pictures
- **Session Management** - Automatic session handling with Supabase

## 🏗 Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── dashboard/         # Dashboard pages
│   ├── auth/             # Authentication routes
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── layout/          # Layout components
│   └── inventory/       # Inventory components
├── lib/                 # Utility libraries
│   └── supabase.ts      # Supabase client and types
├── database_schema.sql  # Complete database schema
└── env.example          # Environment variables template
```

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

## 🔧 Configuration

### Customization

- **Branding**: Update colors in `tailwind.config.js`
- **Features**: Enable/disable features in components
- **Roles**: Modify role permissions in database policies

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | No |
| `NEXT_PUBLIC_APP_URL` | Application URL | No |
| `NEXT_PUBLIC_APP_NAME` | Application name | No |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the code comments and this README
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

## 🔄 Updates

- **v1.0.0**: Initial release with Google Sign-In
- **v1.1.0**: Added feedback system and ratings
- **v1.2.0**: Enhanced reporting and analytics

---

Built with ❤️ using Next.js, Supabase, and Tailwind CSS
