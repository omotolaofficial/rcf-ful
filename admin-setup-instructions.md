# Admin Dashboard Setup Instructions

## Issue: Can't Access Admin Dashboard After Login

The admin dashboard requires specific email permissions. You need to configure which Google emails have admin access.

## Solution Steps:

### 1. Create Environment File
Create a `.env` file in your project root with:
```
VITE_ADMIN_EMAILS=your-email@gmail.com,another-admin@gmail.com
```

### 2. Add Admin Emails to Firebase
Go to Firebase Console → Firestore Database → Add documents:

**Collection:** `admins`
**Documents:**
```
Document ID: your-email@gmail.com
Fields:
  email: "your-email@gmail.com"
  role: "super_admin"
  displayName: "Your Name"
```

### 3. Restart Development Server
After creating the `.env` file, restart your dev server:
```bash
npm run dev
```

### 4. Test Login Flow
1. Go to http://localhost:3000/admin/login
2. Sign in with the Google email you configured
3. You should be redirected to /admin dashboard

## Notes:
- Replace `your-email@gmail.com` with your actual Google email
- You can add multiple emails separated by commas
- `super_admin` role gives full access including managing other admins
- Regular `admin` role gives content management only

## Troubleshooting:
- Clear browser cache after making changes
- Make sure Firebase Auth domains include localhost
- Check browser console for any authentication errors
