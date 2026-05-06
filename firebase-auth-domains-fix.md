# Fix Firebase Unauthorized Domain Error

## Problem
Getting `auth/unauthorized-domain` error when trying to sign in with Google on localhost:3000

## Solution
Add localhost domains to Firebase Authentication authorized domains:

### Manual Steps:
1. Go to https://console.firebase.google.com/
2. Select project: `rcf-clean`
3. Navigate to Authentication → Sign-in method
4. Scroll to "Authorized domains" section
5. Click "Add domain" and add:
   - `localhost`
   - `127.0.0.1`
   - `localhost:3000`
6. Save configuration

### After adding domains:
- Refresh your browser
- Try signing in again at http://localhost:3000/admin/login

## Notes
- This is required for local development
- In production, you'll need to add your actual domain
- Firebase requires explicit domain authorization for security
