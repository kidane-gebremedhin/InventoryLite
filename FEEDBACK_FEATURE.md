# Feedback Feature Documentation

## Overview

The feedback feature allows tenant users to rate the InventoryLite application and submit feedback, while admins can view, manage, and respond to all feedback submissions.

## Features

### For Users
- **Star Rating System**: Rate the app from 1-5 stars
- **Quick Feedback Form**: Submit feedback with subject and message
- **Dashboard Widget**: Easy access to rating from the main dashboard
- **Feedback History**: View all submitted feedback and admin responses

### For Admins/Managers
- **Feedback Management**: View all feedback from all users
- **Status Management**: Update feedback status (open, in progress, resolved, closed)
- **Admin Responses**: Respond to user feedback
- **Statistics Dashboard**: View feedback metrics and trends
- **Notification System**: Get notified of new feedback in the header

## Components

### 1. FeedbackRating Component
- **Location**: `components/feedback/FeedbackRating.tsx`
- **Purpose**: Star rating interface with feedback form
- **Features**:
  - Interactive star rating (1-5 stars)
  - Hover effects for better UX
  - Automatic subject suggestions based on rating
  - Form validation and submission

### 2. AdminFeedbackManager Component
- **Location**: `components/feedback/AdminFeedbackManager.tsx`
- **Purpose**: Admin interface for managing all feedback
- **Features**:
  - View all feedback with user details
  - Filter by status (all, open, in progress, resolved, closed)
  - Update feedback status
  - Respond to feedback
  - Statistics overview

### 3. FeedbackWidget Component
- **Location**: `components/feedback/FeedbackWidget.tsx`
- **Purpose**: Compact rating widget for dashboard
- **Features**:
  - Quick access to rating system
  - Collapsible interface
  - Dashboard integration

### 4. FeedbackSummary Component
- **Location**: `components/feedback/FeedbackSummary.tsx`
- **Purpose**: Admin dashboard overview of feedback metrics
- **Features**:
  - Total feedback count
  - Open issues count
  - Average rating
  - Recent feedback count
  - Alerts for open issues

### 5. FeedbackNotification Component
- **Location**: `components/feedback/FeedbackNotification.tsx`
- **Purpose**: Header notification for admins
- **Features**:
  - Shows unread feedback count
  - Only visible to admins/managers
  - Links to feedback management page

## Database Schema

The feedback feature uses the existing `feedback` table with the following structure:

```sql
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('bug', 'feature', 'improvement', 'general')),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Role-Based Access

### User Roles
- **Regular Users**: Can submit feedback and view their own feedback history
- **Managers**: Can view and manage all feedback within their tenant
- **Admins**: Full access to all feedback management features

### Access Control
- Users can only view their own feedback
- Admins and managers can view all feedback in their tenant
- Feedback submission is available to all authenticated users

## User Interface

### User Dashboard
- Feedback widget in the sidebar
- Quick rating access
- Feedback history view

### Admin Dashboard
- Feedback summary widget
- Statistics overview
- Notification badge in header

### Feedback Management Page
- Role-based view (user vs admin)
- Comprehensive feedback list
- Status management tools
- Response interface

## Usage Examples

### Submitting Feedback (User)
1. Click "Rate Now" in the dashboard widget
2. Select star rating (1-5)
3. Fill in subject and optional message
4. Submit feedback

### Managing Feedback (Admin)
1. Navigate to Feedback page
2. View all feedback with filters
3. Update status as needed
4. Respond to user feedback
5. Monitor feedback metrics

## Integration Points

### Dashboard Integration
- Feedback widget for users
- Feedback summary for admins
- Notification system in header

### Navigation
- Feedback page accessible from sidebar
- Role-based navigation items

### Authentication
- Integrates with existing Supabase auth
- User role detection for access control

## Future Enhancements

1. **Email Notifications**: Send email alerts for new feedback
2. **Feedback Categories**: Enhanced categorization system
3. **Analytics**: Detailed feedback analytics and reporting
4. **Bulk Actions**: Mass status updates for admins
5. **Feedback Templates**: Predefined response templates
6. **Rating Trends**: Track rating changes over time

## Technical Notes

- Uses Supabase for data storage and authentication
- Implements Row Level Security (RLS) for data protection
- Responsive design for mobile and desktop
- Real-time updates using Supabase subscriptions
- TypeScript for type safety
- Tailwind CSS for styling

