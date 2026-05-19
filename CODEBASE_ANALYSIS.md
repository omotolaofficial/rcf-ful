# RCF Fellowship Website - Comprehensive Codebase Analysis

**Analysis Date:** May 19, 2026  
**Project:** React + TypeScript + Firebase Web Application  
**Technology Stack:** React 19, Vite 6, TypeScript 5.8, Firebase 12, Tailwind CSS 4

---

## 1. PROJECT STRUCTURE & DEPENDENCIES

### 1.1 Dependency Overview

**Production Dependencies:**
- **React 19.0.0** - UI framework with latest hooks support
- **Firebase 12.12.0** - Backend services (Auth, Firestore, Storage)
- **React Router 7.14.1** - Client-side routing
- **Tailwind CSS 4.1.14** - Utility-first CSS framework
- **React Hook Form 7.72.1** - Form state management
- **Lucide React 0.546.0** - Icon library
- **Motion 12.23.24** - Animation library (Framer Motion alternative)
- **@google/genai 1.29.0** - Google Gemini AI integration
- **date-fns 4.1.0** - Date formatting and manipulation
- **Express 4.21.2** - Backend server (appears to be for development/admin purposes)
- **Clsx + Tailwind Merge** - Utility functions for conditional className handling
- **Dotenv 17.2.3** - Environment variable management

**Dev Dependencies:**
- **TypeScript ~5.8.2** - Type safety
- **Vite 6.2.0** - Fast build tool and dev server
- **@vitejs/plugin-react 5.0.4** - JSX support for Vite
- **@tailwindcss/vite 4.1.14** - Tailwind CSS Vite plugin
- **Autoprefixer 10.4.21** - CSS vendor prefixes
- **TSX 4.21.0** - TypeScript execution tool
- **TypeScript type packages** for Express and Node

### 1.2 Project Scripts

```json
{
  "dev": "vite --port=3000 --host=0.0.0.0",     // Dev server on port 3000
  "build": "vite build",                         // Production build
  "preview": "vite preview",                     // Preview production build
  "clean": "rm -rf dist",                        // Clean build artifacts
  "lint": "tsc --noEmit"                         // Type-check only (no emit)
}
```

### 1.3 Project Structure

```
src/
├── pages/                    # Public-facing pages
│   ├── Home.tsx            # Landing page with hero carousel
│   ├── Events.tsx
│   ├── Media.tsx
│   ├── Executives.tsx
│   ├── Announcements.tsx
│   ├── About.tsx
│   ├── Contact.tsx
│   ├── Join.tsx
│   ├── Posts.tsx
│   └── NotAuthorized.tsx
├── features/admin/         # Admin dashboard system (modular)
│   ├── pages/
│   │   ├── AdminDashboardPage.tsx    # Main admin CRUD interface
│   │   ├── AdminLoginPage.tsx        # Google OAuth login
│   │   └── AdminUsersPage.tsx        # Super-admin user management
│   ├── components/
│   │   └── ProtectedRoute.tsx        # Route guard with role checks
│   ├── services/
│   │   └── adminApi.ts               # Data layer (Firestore + Cloudinary)
│   ├── collections.ts                # Collection schema definitions
│   └── types.ts                      # Type definitions
├── contexts/
│   └── AuthContext.tsx              # Central auth state + role resolution
├── components/
│   ├── Layout.tsx                   # Main layout wrapper
│   └── ExpandableText.tsx           # Reusable text component
├── config/
│   └── cloudinary.ts                # Cloudinary CDN configuration
├── lib/
│   ├── firebase.ts                  # Firebase SDK initialization
│   └── utils.ts                     # Utility functions (cn for className)
├── App.tsx                          # Route definitions
└── main.tsx                         # React entry point

public/                              # Static assets
images/                              # Hero carousel images
dist/                                # Build output (generated)
```

---

## 2. FIREBASE CONFIGURATION & SETUP

### 2.1 Firebase Initialization ([lib/firebase.ts](src/lib/firebase.ts))

**Configuration Source:** `firebase-applet-config.json`

```typescript
// Multi-database support
const firestoreDatabaseId = 
  typedFirebaseConfig.firestoreDatabaseId?.trim() || '(default)';

// Exports
- auth          // Firebase Authentication
- db            // Firestore Database (with custom database ID support)
- storage       // Cloud Storage
- googleAuthProvider  // Pre-configured Google OAuth provider
```

**Storage Configuration:**
```typescript
storage.maxUploadRetryTime = 60_000    // 60 seconds
storage.maxOperationRetryTime = 15_000 // 15 seconds (short windows for UX)
```

**Auth Persistence:**
- Uses `browserLocalPersistence` for persistent login sessions
- Promise-based: `authReady` waits for persistence setup before auth operations

### 2.2 Firebase Rules

**firestore.rules:**
- **Default deny:** All access blocked unless explicitly allowed
- **Admin-controlled collections:**
  - `schedules`, `announcements`, `events`, `media`, `executives`, `posts`, `siteSections`
  - Public read, admin-only create/update/delete
  - Uses `serverTimestamp()` and `createdBy`/`updatedBy` audit fields
  
- **Admin management:** `admins/{uid}` collection
  - Super-admin only can create/update/delete admin accounts
  - Role-based access control (admin vs. super_admin)
  
- **Validation functions:**
  - Each collection has strict data shape validation
  - ID format validation: `^[a-zA-Z0-9_\-]+$` (max 128 chars)
  - Field type and size restrictions (e.g., title ≤100 chars)
  
- **Visitors collection:** Public create, admin read/manage
  - Public sign-ups, stored in `visitors/{visitorId}`

**storage.rules:**
```firestore
match /uploads/{collectionName}/{fileName} {
  allow read: if true;
  allow write: if isAdmin();
}
```

⚠️ **ISSUE:** Storage admin check uses `request.auth.token.email`, but Firestore uses `request.auth.uid`. Inconsistency could cause auth failures.

### 2.3 Firebase Configuration Files

- **firebase.json:** Deployment config + Firestore database ID
- **firebase-applet-config.json:** SDK credentials (should be in .gitignore)
- **firebase-blueprint.json:** Backup/template of Firestore schema

---

## 3. AUTHENTICATION FLOW

### 3.1 Central Auth Context ([contexts/AuthContext.tsx](src/contexts/AuthContext.tsx))

**State Management:**
```typescript
- user: Firebase User object (null when logged out)
- loading: boolean (true during auth check)
- adminProfile: AdminProfile | null
- isAdmin: boolean (derived from adminProfile presence)
- isSuperAdmin: boolean (role === 'super_admin')
```

**Role Resolution (Dual-source):**
1. **Primary:** Check Firestore `admins/{currentUser.uid}` document
2. **Fallback:** Check environment variable `VITE_ADMIN_EMAILS` (comma-separated list)
   - Fallback users automatically assigned `super_admin` role
   - Useful for initial setup

**Authentication Flow:**

```
User logs in
    ↓
Google OAuth popup
    ↓
Firebase Auth updates
    ↓
onAuthStateChanged listener fires
    ↓
Check if admin:
  1. Query Firestore admins/{uid}
  2. If not found, check VITE_ADMIN_EMAILS
    ↓
Set adminProfile (or null if not admin)
    ↓
Set loading = false
    ↓
Routes render protected components
```

**Connection Test:**
- On mount, attempts `getDocFromServer(doc(db, 'test', 'connection'))`
- Catches and logs offline errors for debugging

**Cleanup:**
- Proper cleanup with `isMounted` flag to prevent memory leaks
- Unsubscribes from auth listener on unmount

⚠️ **ISSUE:** Auth persistence promise error handling only logs to console. Silent failures could leave auth state inconsistent.

### 3.2 Login Implementation ([features/admin/pages/AdminLoginPage.tsx](src/features/admin/pages/AdminLoginPage.tsx))

- Simple Google Sign-In button
- Uses `signInWithPopup(auth, googleAuthProvider)`
- Shows error messages if sign-in fails
- Redirects authenticated admins to `/admin` or referrer
- Redirects non-admin authenticated users to `/not-authorized`

### 3.3 Session Persistence

- Relies on Firebase's `browserLocalPersistence`
- Session survives browser refresh and app reload
- No manual logout cleanup beyond `signOut(auth)`

---

## 4. STATE MANAGEMENT & CONTEXT USAGE

### 4.1 Architecture

**Single Context Pattern:**
- One `AuthContext` for global authentication state
- No Redux/Zustand - minimal state management overhead
- All auth-derived data flows from AuthContext

**Data Fetching:**
- Components use Firebase SDK directly (Firestore queries)
- `subscribeCollectionItems()` provides real-time listeners
- No caching layer - subscriptions are per-component

### 4.2 Real-time Subscriptions

[features/admin/services/adminApi.ts](src/features/admin/services/adminApi.ts):

```typescript
subscribeCollectionItems(
  collectionName,
  onItems,      // Callback when data changes
  onError       // Optional error handler
)
```

- Orders results by `updatedAt` descending
- Falls back to unordered query if index missing
- Error resilience: Warns instead of crashing on missing indexes

---

## 5. API SERVICES ARCHITECTURE

### 5.1 Admin API Service Layer

**File:** [features/admin/services/adminApi.ts](src/features/admin/services/adminApi.ts)

**Core Operations:**

| Function | Purpose |
|----------|---------|
| `fetchCollectionItems()` | One-time fetch of collection items |
| `subscribeCollectionItems()` | Real-time listener with fallback |
| `saveCollectionItem()` | Create or update item with audit fields |
| `removeCollectionItem()` | Delete item from Firestore |
| `uploadAdminFile()` | Upload to Cloudinary CDN |
| `fetchAdmins()` | List all admins |
| `upsertAdmin()` | Create/update admin with role |
| `deleteAdmin()` | Remove admin account |

**Audit Trail:**
- All saves include: `updatedAt` (serverTimestamp), `updatedBy` (user.uid)
- New items include: `createdAt`, `createdBy`
- Field filtering: `undefined` values excluded before save

### 5.2 File Upload (Cloudinary Integration)

```typescript
uploadAdminFile(collectionName: string, file: File)
```

**Process:**
1. Get Cloudinary credentials from environment vars
2. Create FormData with file + upload preset
3. POST to `https://api.cloudinary.com/v1_1/{cloudName}/image/upload`
4. Returns `data.secure_url`

**Environment Variables Required:**
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

⚠️ **ISSUE:** Cloudinary secrets exposed in frontend. Upload presets should use signed URLs or backend proxy for production.

**Error Handling:**
- Throws error with Cloudinary error message if upload fails
- Logs environment debug info to console

---

## 6. PAGE COMPONENTS & POTENTIAL ISSUES

### 6.1 Public Pages

**Home Page ([pages/Home.tsx](src/pages/Home.tsx)):**
- Hero carousel with 10 images from `/images/` folder
- Auto-rotates every 4 seconds (configurable)
- Manual controls: prev/next buttons, dot indicators
- Preloads images on mount to reduce visible flicker
- Carousel pauses when user interacts

**Other Pages:**
- Events, Media, Executives, Announcements, About, Contact, Posts
- Likely fetch from Firestore collections
- Not fully analyzed (outside current review scope)

### 6.2 Admin Dashboard ([features/admin/pages/AdminDashboardPage.tsx](src/features/admin/pages/AdminDashboardPage.tsx))

**Features:**
- Tab-based interface for different collections
- Real-time subscription to active collection
- CRUD forms with image upload
- User identity display (email + role)

**Collections Managed:**
1. **Posts/Blog** - title, description, media (image/video/audio)
2. **Events** - title, date, location, time, image
3. **Announcements** - title, content, priority (low/regular/high), date
4. **Media/Sermons** - title, speaker, type, media URL
5. **Website Sections** - reusable content blocks
6. **Admins** (super-admin only) - manage user access

### 6.3 Admin Users Page ([features/admin/pages/AdminUsersPage.tsx](src/features/admin/pages/AdminUsersPage.tsx))

- Super-admin only
- CRUD for `admins` collection
- Manage roles and permissions

### 6.4 Route Protection ([features/admin/components/ProtectedRoute.tsx](src/features/admin/components/ProtectedRoute.tsx))

**Logic:**
- Check `loading` state → show "Authenticating..."
- No user → redirect to `/admin/login`
- User not admin → redirect to `/not-authorized`
- User is admin but requires super_admin → show "Super Admin Required" message

**Props:**
```typescript
interface ProtectedRouteProps {
  requireRole?: 'super_admin';  // Optional role requirement
}
```

⚠️ **ISSUE:** Uses `<Outlet />` pattern - requires nested route structure in React Router

---

## 7. CONFIGURATION FILES

### 7.1 TypeScript Configuration

**Target:** ES2022  
**Module:** ESNext  
**JSX:** react-jsx (automatic JSX transform)

**Key Settings:**
```json
{
  "paths": {
    "@/*": ["./*"]  // @ alias for project root imports
  },
  "allowImportingTsExtensions": true,
  "isolatedModules": true,
  "skipLibCheck": true,
  "noEmit": true  // Only type-check, no code generation
}
```

⚠️ **ISSUE:** `noEmit: true` means TypeScript doesn't generate output. Vite handles compilation.

### 7.2 Vite Configuration

**Key Setup:**
```typescript
plugins: [react(), tailwindcss()]  // React + Tailwind support

define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
  // Exposes API key to bundle - accessible in client code!
}

resolve.alias:
  '@': project root  // For imports like @/src/...

server.hmr:
  conditional based on DISABLE_HMR env var
  // AI Studio specific optimization
```

⚠️ **CRITICAL ISSUE:** `GEMINI_API_KEY` is exposed to browser via `process.env`. This is a security vulnerability - API keys should never be client-side.

### 7.3 Cloudinary Configuration

**File:** [src/config/cloudinary.ts](src/config/cloudinary.ts)

- Reads from environment: `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`
- Throws error if missing
- Pre-configured upload preset (unsecured - should use signed uploads)

⚠️ **ISSUE:** Upload preset is exposed in frontend - enables anyone to upload to your Cloudinary account.

### 7.4 Environment Variables

**Expected Variables:**
```
VITE_ADMIN_EMAILS=admin1@example.com,admin2@example.com
VITE_CLOUDINARY_CLOUD_NAME=your-cloud
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset
VITE_GEMINI_API_KEY=your-api-key  // CRITICAL: Should not be exposed
GEMINI_API_KEY=your-api-key       // AI Studio injection
APP_URL=https://your-domain.com   // AI Studio injection
```

**Status:** `.env` file exists but appears encrypted/corrupted in this analysis

---

## 8. BUILD CONFIGURATION & POTENTIAL ISSUES

### 8.1 Build Output

- **Output directory:** `dist/`
- **Build command:** `vite build`
- **Dev server:** Vite on port 3000 with HMR support
- **Host:** `0.0.0.0` (accessible from any network interface)

### 8.2 Build Process

1. TypeScript type-checking: `tsc --noEmit`
2. Vite bundling with React + Tailwind plugins
3. Tree-shaking and code splitting
4. Asset optimization (images, fonts)
5. CSS extraction and minification

### 8.3 Potential Build Issues

**Issue 1: Missing Environment Variables**
- Build will fail if `VITE_CLOUDINARY_*` not set
- `cloudinary.ts` throws error at module load time
- CI/CD must provide these before build

**Issue 2: GEMINI_API_KEY Exposure**
- Defined in `vite.config.ts` via `process.env.GEMINI_API_KEY`
- Gets bundled into client code
- Visible in browser dev tools

**Issue 3: Import Path Confusion**
- `@` alias resolves to project root
- Can cause circular dependency issues
- Example: `@/src/lib/firebase` vs `./src/lib/firebase`

**Issue 4: Conditional HMR**
- `DISABLE_HMR` environment variable affects dev experience
- AI Studio specific - may cause confusion in normal dev

---

## 9. NETWORK REQUESTS & API CALLS

### 9.1 Firebase SDK Calls

**Authentication:**
- `signInWithPopup()` - OAuth flow
- `signOut()` - Logout
- `onAuthStateChanged()` - Auth listener
- `getDocFromServer()` - Server-read for connection test

**Database (Firestore):**
- `getDocs()` - Fetch batch of documents
- `getDocFromServer()` - Force server read (bypass cache)
- `onSnapshot()` - Real-time listener
- `setDoc()`, `updateDoc()`, `addDoc()` - Writes
- `deleteDoc()` - Deletes
- `orderBy()`, `query()`, `collection()` - Query builders
- `serverTimestamp()` - Server-generated timestamps

**Storage:**
- File upload listeners (implicit in SDK)

### 9.2 Third-Party API Calls

**Cloudinary Upload:**
```
POST https://api.cloudinary.com/v1_1/{cloudName}/image/upload
```
- Multipart form data
- Contains: file, upload_preset, folder
- Returns: `{ secure_url: "https://..." }`

### 9.3 CORS Configuration

**Root CORS** ([cors.json](cors.json)):
```json
{
  "origin": ["http://localhost:3000", "http://localhost:5173"],
  "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
  "maxAgeSeconds": 3600
}
```

**Source CORS** ([src/cors.json](src/cors.json)):
```json
{
  "origin": [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://rcf-ful.netlify.app",
    "https://rcf-ful.web.app"
  ],
  "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
  "responseHeader": ["Content-Type", "Authorization"]
}
```

⚠️ **ISSUE:** Two different CORS configs - unclear which is used. Likely for different deployment environments.

---

## 10. SECURITY & CONFIGURATION ISSUES

### 🔴 CRITICAL ISSUES

1. **Exposed Gemini API Key in Client Code**
   - Location: `vite.config.ts` `define` property
   - Risk: Anyone can extract and abuse API quota
   - Fix: Move to backend endpoint or use restricted API key

2. **Cloudinary Upload Preset in Frontend**
   - Location: `src/config/cloudinary.ts`
   - Risk: Unauthenticated file uploads possible
   - Fix: Use signed URLs or server-side upload handling

3. **Admin Email Hardcoded in Environment**
   - Visibility: Exposed in `.env` and bundled if used in client
   - Risk: Admin emails discoverable via network inspection
   - Fix: Use Firestore-only for admin role source

### 🟡 MEDIUM ISSUES

4. **Storage Rules Auth Inconsistency**
   - Firestore uses `request.auth.uid`
   - Storage uses `request.auth.token.email`
   - Risk: Auth failures, permission mismatches
   - Fix: Standardize to `uid` in both

5. **No Input Validation Before Firestore Write**
   - Client validates, but rules also validate
   - Duplicate logic could diverge
   - Risk: Invalid data if rules change
   - Fix: Single source of truth for validation

6. **Real-time Listeners Per Component**
   - Each collection tab creates new listener
   - No deduplication if same collection viewed multiple times
   - Risk: Memory leaks, excessive database reads
   - Fix: Implement global cache/context

7. **Error Handling in Auth**
   - Persistence errors only console-logged
   - Could silently fail to enable local storage
   - Risk: Lost sessions if localStorage denied
   - Fix: Provide user feedback or graceful degradation

### 🟢 MINOR ISSUES

8. **Hardcoded Collection Schemas**
   - `ADMIN_COLLECTIONS` in `collections.ts`
   - Changes require code redeploy
   - Fix: Load from Firestore or CMS

9. **Missing Error Boundaries**
   - No React Error Boundary in App.tsx
   - Errors crash entire app
   - Fix: Add Error Boundary wrapper

10. **Limited Logging**
    - No structured logging/analytics
    - Hard to debug production issues
    - Fix: Integrate monitoring (Sentry, App Insights)

11. **Gemini AI Integration Unclear**
    - `@google/genai` imported but not used in analyzed code
    - Potential dead code or incomplete feature
    - Fix: Verify if this is used anywhere

---

## ARCHITECTURE SUMMARY

### Strengths ✅

1. **Clean Separation of Concerns**
   - Admin features isolated in `features/admin/`
   - Service layer abstracts Firebase calls
   - Context handles cross-cutting auth concerns

2. **Type Safety**
   - Full TypeScript with strict config
   - Defined interfaces for data models
   - Type-checked environment variables

3. **Real-time Capabilities**
   - Firestore listeners for live updates
   - Carousel animations with Motion library
   - Responsive UI with Tailwind CSS

4. **Role-Based Access Control**
   - Two-level hierarchy (admin/super_admin)
   - Enforced in both client (ProtectedRoute) and server (Firestore rules)
   - Fallback admin email resolution

5. **Modular Collections**
   - Configurable admin dashboard
   - Generic CRUD logic applicable to any collection
   - Field-level configuration (type, required, options)

### Weaknesses ❌

1. **Client-Side API Secrets**
   - Gemini API key, Cloudinary preset exposed
   - Breaks security best practices

2. **Limited State Management**
   - No caching between requests
   - Each component makes fresh Firestore queries
   - Potential N+1 query problems

3. **Incomplete Error Handling**
   - Silent failures in auth persistence
   - Generic error messages to users
   - Missing error boundaries

4. **Scalability Concerns**
   - No pagination in admin dashboard
   - Real-time listeners could overwhelm on large datasets
   - No query optimization (indexes recommended)

5. **Untested Components**
   - No mention of unit/integration tests
   - Critical auth flow not testable
   - Admin API relies on live Firestore

---

## RECOMMENDATIONS

### High Priority

1. **Move API Keys to Backend**
   - Create backend endpoints for Gemini/Cloudinary calls
   - Use secure API key management (encrypted env vars)
   - Implement rate limiting and auth checks

2. **Fix Storage Rules**
   - Standardize to `request.auth.uid` in both Firestore and Storage
   - Add integration tests for rules

3. **Add Error Boundaries & Monitoring**
   - Implement React Error Boundary
   - Add Sentry/Application Insights integration
   - Provide user-facing error messages

### Medium Priority

4. **Implement Global Data Caching**
   - Add service layer with deduplication
   - Consider React Query or SWR for cache management
   - Reduce unnecessary Firestore reads

5. **Add Pagination to Admin Dashboard**
   - Implement `limit()` and `startAfter()` in queries
   - Support large datasets without performance degradation

6. **Standardize Collection Schema**
   - Move schema definitions to Firestore (config document)
   - Allow dynamic updates without redeployment

7. **Add Comprehensive Tests**
   - Unit tests for utility functions
   - Integration tests for auth flow
   - E2E tests for admin workflows
   - Firestore rules testing

### Low Priority

8. **Optimize Image Loading**
   - Add lazy loading for hero carousel
   - Optimize image sizes for mobile
   - Consider CDN/image optimization service

9. **Add Analytics**
   - Track user behavior, admin actions
   - Monitor performance metrics
   - Measure engagement

10. **Documentation**
    - Add JSDoc comments to services
    - Document Firestore schema version history
    - Create architecture decision records (ADRs)

---

## DEPLOYMENT CHECKLIST

- [ ] Verify `.env` file with all required variables
- [ ] Test Cloudinary upload permissions
- [ ] Verify Firebase Auth authorized domains
- [ ] Check Storage and Firestore rules are deployed
- [ ] Confirm admin emails in Firestore `admins/{uid}` collection
- [ ] Test login flow with admin account
- [ ] Verify CORS configuration for deployment domain
- [ ] Check build output includes no console logs with secrets
- [ ] Verify pagination for large collections
- [ ] Monitor initial production metrics

---

## FILE DEPENDENCY GRAPH

```
App.tsx
├── AuthProvider (contexts/AuthContext.tsx)
│   ├── firebase.ts (lib/firebase.ts)
│   └── adminApi.ts (features/admin/services/adminApi.ts)
├── Layout.tsx (components/Layout.tsx)
├── Pages (pages/*.tsx)
│   ├── Home.tsx
│   │   ├── firebase.ts
│   │   └── Motion animations
│   └── Others...
└── ProtectedRoute (features/admin/components/ProtectedRoute.tsx)
    ├── AdminDashboardPage.tsx
    │   ├── AuthContext
    │   ├── adminApi.ts
    │   ├── collections.ts
    │   └── Form handling
    ├── AdminLoginPage.tsx
    └── AdminUsersPage.tsx
```

---

**End of Analysis**
