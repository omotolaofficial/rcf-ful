<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# RCF Fellowship Website

This project includes the public fellowship website and a role-based multi-admin dashboard.

## Admin Architecture (Refactored)

- `src/features/admin/pages/AdminLoginPage.tsx`: secure admin login screen
- `src/features/admin/components/ProtectedRoute.tsx`: route guard for authenticated admins
- `src/features/admin/pages/AdminDashboardPage.tsx`: modular dashboard for content CRUD
- `src/features/admin/pages/AdminUsersPage.tsx`: super-admin-only admin management
- `src/features/admin/services/adminApi.ts`: data and upload service layer (backend logic boundary)
- `src/features/admin/collections.ts`: configurable content schemas for posts/events/etc
- `src/contexts/AuthContext.tsx`: centralized auth + role resolution (`admin` / `super_admin`)

## Role-Based Access Control

- `super_admin`: full access, including admin user management
- `admin`: content management access only

Roles are resolved from Firestore `admins/{email}` with shape:

```json
{
  "email": "admin@example.com",
  "role": "admin",
  "displayName": "Optional Name"
}
```

## Run Locally

Prerequisites: Node.js 20+

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Open `http://localhost:3000`

## How To Test Admin System

1. Ensure Firebase Auth has a user for each admin email/password.
2. In Firestore, create `admins/{email}` documents with `role` set to `admin` or `super_admin`.
3. Visit `/admin/login` and sign in.
4. Verify route protection:
   - Logged-out user visiting `/admin` is redirected to `/admin/login`
   - Non-admin authenticated users cannot access admin screens
5. Verify RBAC:
   - `admin` can manage content tabs
   - only `super_admin` can access `/admin/admins`
6. Verify CRUD:
   - create/edit/delete entries in posts, announcements, events, media, and site sections
   - upload media from dashboard forms

## Security Rules

Firestore and Storage rules were tightened:

- no hardcoded email bypass
- admin access checks via `admins/{email}`
- only `super_admin` can create/update/delete docs in `admins` collection
- admin-only writes for content collections and uploads
