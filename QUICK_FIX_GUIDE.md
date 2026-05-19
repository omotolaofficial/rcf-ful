# Quick Fix Guide - Critical Issues Only

This document shows ONLY the critical issues that must be fixed before deployment.

---

## 1️⃣ FIX: TypeScript Compilation Errors

**Status:** ❌ BLOCKING BUILD  
**File:** `src/pages/admin/Dashboard.tsx`  
**Lines:** 224, 498, 501, 505, 510  

**Error:** `Property 'isUploading' does not exist on type 'unknown'`

### Action Items:

```typescript
// Find this code (around line 220):
const uploading = Object.values(uploadState).some(s => s.isUploading);

// Replace with:
const uploading = Object.values(uploadState).some((s) => 
  (s as UploadState)?.isUploading ?? false
);

// And in renderUpload function (line 498+), change:
const isUploading = uploadState[key]?.isUploading;

// To:
const state = uploadState[key] as UploadState | undefined;
const isUploading = state?.isUploading ?? false;
```

**Verify:** Run `npm run lint` - should pass

---

## 2️⃣ FIX: Add Error Boundary

**Status:** ❌ APP CRASHES  
**File:** `src/App.tsx`  

Create new file: `src/components/ErrorBoundary.tsx`

```typescript
import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md shadow-lg">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h1>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

Update `src/App.tsx`:
```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          {/* ... rest of app ... */}
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

---

## 3️⃣ FIX: Firebase Storage Rules (Authentication)

**Status:** ❌ UPLOAD FAILURES  
**File:** `storage.rules`  

Replace entire file with:

```firestore
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() &&
        firestore.exists(/databases/(default)/documents/admins/$(request.auth.uid));
    }

    match /uploads/{collectionName}/{fileName} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

**Verify:** 
1. Deploy rules: `firebase deploy --only storage`
2. Check Firestore `admins` collection uses document IDs as UIDs, not emails

---

## 4️⃣ FIX: Remove Gemini API Key from Client

**Status:** ❌ SECURITY BREACH  
**File:** `vite.config.ts`  

Replace lines 6-10 with:

```typescript
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
```

**Important:** Remove the `define` block entirely. No API keys in frontend!

---

## 5️⃣ FIX: Secure Cloudinary Uploads

**Status:** ❌ SECURITY BREACH  
**File:** `src/features/admin/services/adminApi.ts`  

Replace the `uploadAdminFile` function with:

```typescript
export async function uploadAdminFile(collectionName: string, file: File) {
  // Step 1: Get signed parameters from backend
  const response = await fetch('/api/cloudinary/sign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      folder: 'rcf-images',
      resource_type: 'auto'
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get upload signature');
  }

  const { cloudName, apiKey, timestamp, signature } = await response.json();

  // Step 2: Upload with signature (secure)
  const formData = new FormData();
  formData.append('file', file);
  formData.append('cloud_name', cloudName);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', 'rcf-images');

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!uploadResponse.ok) {
    const err = await uploadResponse.json();
    throw new Error(err.error?.message || 'Upload failed');
  }

  const data = await uploadResponse.json();
  return data.secure_url;
}
```

**Also needed:** Create backend endpoint `/api/cloudinary/sign-upload`

```typescript
// backend/routes/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import { authenticateUser } from './auth'; // Your auth middleware

app.post('/api/cloudinary/sign-upload', authenticateUser, (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: 'rcf-images',
      resource_type: 'auto',
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  res.json({
    cloudName: process.env.VITE_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
  });
});
```

---

## ✅ TESTING CHECKLIST

After applying fixes:

```bash
# 1. TypeScript check
npm run lint
# Should output: No errors

# 2. Build test
npm run build
# Should complete without errors

# 3. Firebase rules deployment
firebase deploy --only firestore,storage
# Should deploy successfully

# 4. Manual test
- Open http://localhost:3000
- Login with admin account
- Test file upload
- Try to edit/create content
- Verify no crashes in console
```

---

## 🚀 DEPLOYMENT STEPS

1. **Fix all 5 issues above**
2. **Run tests:** `npm run lint && npm run build`
3. **Deploy Firebase rules:** `firebase deploy --only firestore,storage`
4. **Deploy backend** (if using Node.js backend)
5. **Deploy frontend:** `npm run build && firebase deploy --only hosting`
6. **Verify production:**
   - Check admin dashboard works
   - Test file upload
   - Verify no console errors
   - Check browser DevTools for exposed secrets

---

## ❌ WHAT NOT TO DEPLOY

Remove before deploying to production:

- ❌ `console.log()` statements with data
- ❌ `.env` file (never commit!)
- ❌ `localhost` in CORS
- ❌ API keys in code
- ❌ Test data in Firestore

---

