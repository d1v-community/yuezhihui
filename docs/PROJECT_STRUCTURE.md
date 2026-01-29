# Project Structure Guide

This document explains the project structure of the Remix + Neon Email Authentication Template.

## Table of Contents

- [Overview](#overview)
- [Directory Tree](#directory-tree)
- [Root Files](#root-files)
- [App Directory](#app-directory)
- [Database](#database)
- [Routes](#routes)
- [Services](#services)
- [Utilities](#utilities)
- [Styling](#styling)
- [Drizzle Migration Files](#drizzle-migration-files)
- [Customization Guide](#customization-guide)

---

## Overview

The project follows **Remix's file-based routing** structure with additional organization for services, utilities, and database schema. It's designed to be:

- **Type-safe**: Full TypeScript coverage
- **Scalable**: Easy to add new features
- **Maintainable**: Clear separation of concerns
- **Production-ready**: Security and best practices built-in

---

## Directory Tree

```
remix-neon-auth/
│
├── app/                          # Application source code
│   ├── db/                       # Database configuration
│   │   ├── db.server.ts         # Neon connection setup
│   │   └── schema.ts            # Drizzle schema definitions
│   │
│   ├── routes/                   # File-based routing
│   │   ├── _index.tsx           # Home page (/)
│   │   ├── login.tsx            # Login page (/login)
│   │   ├── favicon.ico.ts       # Favicon handler
│   │   └── api.auth.*.ts        # API routes
│   │       ├── send-code.ts     # Send verification code
│   │       ├── verify-login.ts  # Verify & login
│   │       ├── logout.ts        # Logout
│   │       └── me.ts            # Get current user
│   │
│   ├── services/                 # Business logic
│   │   ├── verification.server.ts  # Email verification
│   │   └── jwt.server.ts        # JWT token handling
│   │
│   ├── utils/                    # Helper functions
│   │   ├── auth.server.ts       # Authentication utilities
│   │   ├── env.server.ts        # Environment validation
│   │   └── logger.server.ts     # Logging utilities
│   │
│   ├── tailwind.css             # Tailwind CSS entry point
│   ├── entry.client.tsx         # Client entry
│   ├── entry.server.tsx         # Server entry
│   └── root.tsx                 # Root layout
│
├── docs/                        # Documentation
│   ├── API.md                   # API documentation
│   ├── DEPLOYMENT.md            # Deployment guide
│   ├── ENVIRONMENT.md           # Environment variables
│   ├── PROJECT_STRUCTURE.md     # This file
│   └── FAQ.md                   # Frequently asked questions
│
├── drizzle/                     # Database migrations
│   ├── 0000_init.sql            # Initial migration
│   └── meta/
│       └── _journal.json        # Migration journal
│
├── public/                      # Static assets
│   └── favicon.ico              # Favicon
│
├── scripts/                     # Build & migration scripts
│   ├── migrate.mjs              # Migration runner
│   ├── migrate_via_api.mjs      # API-based migration
│   ├── seed.mjs                 # Database seeder
│   └── seed_via_api.mjs         # API-based seeder
│
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── .prettierrc                  # Prettier config
├── drizzle.config.ts            # Drizzle ORM config
├── package.json                 # Dependencies
├── tailwind.config.ts           # Tailwind CSS config
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite bundler config
└── README.md                    # Main documentation
```

---

## Root Files

### `package.json`

**Purpose**: Project dependencies and scripts

**Key Scripts**:
```json
{
  "dev": "remix vite:dev",              // Start dev server
  "build": "remix vite:build",          // Build for production
  "start": "remix-serve ./build/server/index.js",  // Start production
  "db:migrate": "node scripts/migrate.mjs",        // Run migrations
  "db:seed": "node scripts/seed.mjs"               // Seed data
}
```

---

### `.env.example`

**Purpose**: Template for environment variables

**Copy to create your own**:
```bash
cp .env.example .env
```

**Contains**:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - JWT signing secret
- `RESEND_API_KEY` - Email service key
- Other optional variables

---

### `tailwind.config.ts`

**Purpose**: Tailwind CSS configuration

**Customize**:
- Theme colors
- Font family
- Custom utilities
- Plugin configuration

---

### `tsconfig.json`

**Purpose**: TypeScript compiler configuration

**Key Settings**:
- Strict mode enabled
- Path aliases (`~/*` → `./app/*`)
- JSX transformation

---

### `vite.config.ts`

**Purpose**: Vite bundler configuration

**Features**:
- Remix integration
- Path aliases
- Development server config

---

### `drizzle.config.ts`

**Purpose**: Drizzle ORM configuration

**Defines**:
- Schema file location
- Migration folder
- Database connection

---

### `.gitignore`

**Purpose**: Files to exclude from version control

**Includes**:
- `.env` (contains secrets)
- `node_modules/`
- `build/`
- `.cache/`

---

## App Directory

### `root.tsx`

**Purpose**: Root layout component

**Responsibilities**:
- HTML document structure
- Meta tags
- Global stylesheets
- Error boundaries

**Key Exports**:
- `meta()` - Page metadata
- `links()` - Stylesheets and assets
- `Layout` - App shell
- `ErrorBoundary` - Error handling

---

### `entry.client.tsx`

**Purpose**: Client-side entry point

**Responsibilities**:
- Hydration setup
- React strict mode
- Browser-specific initialization

---

### `entry.server.tsx`

**Purpose**: Server-side rendering entry

**Responsibilities**:
- Server rendering
- Streaming responses
- Request handling

---

## Database

### `app/db/schema.ts`

**Purpose**: Drizzle schema definitions

**Tables Defined**:
- `users` - User accounts
- `verificationCodes` - Email verification codes

**Exports**:
- Table definitions
- TypeScript types

**Example**:
```typescript
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  // ... more fields
});

export type User = typeof users.$inferSelect;
```

---

### `app/db/db.server.ts`

**Purpose**: Database connection setup

**Responsibilities**:
- Connect to Neon
- Create Drizzle instance
- Export typed database

**Key Export**:
```typescript
export const db = drizzle(client as any, { schema });
```

---

### `drizzle/0000_init.sql`

**Purpose**: Initial database migration

**Contains**:
- CREATE TABLE statements
- Index definitions
- Initial schema setup

**Naming Convention**:
- Format: `XXXX_description.sql`
- Example: `0000_init.sql`, `0001_add_feature.sql`

---

### `drizzle/meta/_journal.json`

**Purpose**: Migration tracking

**Tracks**:
- Applied migrations
- Migration timestamps
- Version history

**Auto-generated**: Don't edit manually

---

## Routes

Remix uses **file-based routing**. Each file in `app/routes/` becomes a route.

### Page Routes

#### `_index.tsx`

**Route**: `/` (home page)

**Purpose**: Landing page with login status

**Exports**:
- `meta()` - Page metadata
- `loader()` - Server-side data fetching
- Default component - UI

**Features**:
- Shows user login status
- Database version display
- Feature highlights

---

#### `login.tsx`

**Route**: `/login`

**Purpose**: Email verification login page

**Features**:
- Two-step form (email → code)
- Form validation
- Loading states
- Error handling
- Beautiful UI with Tailwind

**State Management**:
- `step`: "email" | "code"
- `email`: User's email
- `code`: Verification code
- `loading`: Loading state
- `error`: Error message

---

#### `favicon.ico.ts`

**Route**: `/favicon.ico`

**Purpose**: Favicon request handler

**Prevents**: "No route matches" errors

**Implementation**:
```typescript
export async function loader() {
  return new Response(null, { status: 204 });
}
```

---

### API Routes

All API routes are in `app/routes/` with `api.` prefix.

#### `api.auth.send-code.ts`

**Route**: `POST /api/auth/send-code`

**Purpose**: Send email verification code

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Process**:
1. Validate email format
2. Generate 6-digit code
3. Save code to database (10-min expiry)
4. Send email via Resend
5. Return success

---

#### `api.auth.verify-login.ts`

**Route**: `POST /api/auth/verify-login`

**Purpose**: Verify code and log user in

**Request**:
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Process**:
1. Validate code
2. Check expiry (10 min)
3. Verify not already used
4. Mark code as used
5. Create/find user
6. Generate JWT token
7. Set HTTP-only cookie
8. Return user data

---

#### `api.auth.logout.ts`

**Route**: `POST /api/auth/logout`

**Purpose**: Log user out

**Process**:
1. Clear auth cookie
2. Return success message

---

#### `api.auth.me.ts`

**Route**: `GET /api/auth/me`

**Purpose**: Get current authenticated user

**Process**:
1. Extract token from cookie
2. Verify JWT token
3. Fetch user from database
4. Return user or null

---

## Services

Business logic separated into services.

### `app/services/verification.server.ts`

**Purpose**: Email verification logic

**Functions**:

**`generateVerificationCode(email)`**
- Generates 6-digit random code
- Deletes existing unused codes
- Saves to database with 10-min expiry

**`sendVerificationEmail(email, code)`**
- Sends email via Resend API
- HTML email template
- Fallback to console log in dev

**`verifyCode(email, code)`**
- Finds valid, unused code
- Checks expiry
- Marks as used
- Returns true/false

**`findOrCreateUserByEmail(email)`**
- Finds existing user by email
- Creates new user if not found
- Returns user object

---

### `app/services/jwt.server.ts`

**Purpose**: JWT token handling

**Functions**:

**`generateToken(payload)`**
- Signs JWT with secret
- 7-day expiration
- Returns token string

**`verifyToken(token)`**
- Verifies JWT signature
- Decodes payload
- Returns payload or null

**`getTokenFromRequest(request)`**
- Extracts token from Authorization header
- Handles Bearer format
- Returns token string or null

---

## Utilities

Helper functions and configurations.

### `app/utils/auth.server.ts`

**Purpose**: Authentication helpers

**Functions**:

**`getUserFromRequest(request)`**
- Extracts user from request
- Verifies JWT token
- Fetches user from DB
- Returns user or null

**`requireUser(request)`**
- Gets user or throws 401
- Used for protected routes
- Returns user object

**`createAuthHeaders(token)`**
- Creates Set-Cookie header
- HTTP-only, SameSite=Lax
- 7-day expiry
- Secure in production

**`createLogoutHeaders()`**
- Clears auth cookie
- Sets Max-Age=0

---

### `app/utils/env.server.ts`

**Purpose**: Environment variable validation

**Uses**: Zod for runtime validation

**Validates**:
- Required variables present
- Formats correct (URLs, etc.)
- Provides defaults

**Exports**:
- `env` - Validated environment object
- `isProd` - Environment check

---

### `app/utils/logger.server.ts`

**Purpose**: Logging utility

**Uses**: Pino logger

**Features**:
- Structured logging
- Levels: debug, info, warn, error
- JSON format
- Request tracing

---

## Styling

### `app/tailwind.css`

**Purpose**: Tailwind CSS entry point

**Contains**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Custom Styles**: Add after these directives

---

### Tailwind Configuration

**File**: `tailwind.config.ts`

**Customizations**:
- Content paths
- Theme extensions
- Plugins
- Dark mode

**Example**:
```typescript
export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#0070f3",
        },
      },
    },
  },
};
```

---

## Drizzle Migration Files

### `scripts/migrate.mjs`

**Purpose**: Run database migrations

**Process**:
1. Reads migration SQL files
2. Splits into statements
3. Executes via Neon client
4. Logs success/failure

---

### `scripts/seed.mjs`

**Purpose**: Seed database with demo data

**Creates**:
- Demo user account
- Sample data (if needed)

---

## Customization Guide

### Adding a New Route

1. Create file in `app/routes/`
2. Export `meta()`, `loader()`, and/or `action()`
3. Export default component

**Example**: Add `/dashboard` route

```typescript
// app/routes/dashboard.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUser } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  return json({ user });
}

export default function Dashboard() {
  const { user } = useLoaderData<typeof loader>();
  return <div>Welcome {user.username}!</div>;
}
```

---

### Adding a New Table

1. Edit `app/db/schema.ts`

```typescript
export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});
```

2. Create migration

```bash
cp drizzle/0000_init.sql drizzle/0001_add_posts_table.sql
# Edit migration file
```

3. Run migration

```bash
npm run db:migrate
```

---

### Customizing Email Template

Edit `app/services/verification.server.ts`:

```typescript
const result = await resend.emails.send({
  from: "Your Brand <noreply@yourdomain.com>",
  to: [email],
  subject: "Your Login Code",
  html: `
    <div style="font-family: sans-serif;">
      <h1>Welcome to Our App!</h1>
      <p>Your verification code is:</p>
      <h2>${code}</h2>
      <!-- Your custom HTML -->
    </div>
  `,
});
```

---

### Adding Custom Styles

**Option 1**: Use Tailwind classes

```tsx
<div className="bg-blue-500 text-white p-4 rounded">
  Content
</div>
```

**Option 2**: Add custom CSS

`app/tailwind.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

.my-custom-class {
  /* Custom styles */
}
```

---

### Adding Environment Variables

1. Edit `app/utils/env.server.ts`

```typescript
const envSchema = z.object({
  // ... existing vars
  MY_NEW_VAR: z.string(),
});
```

2. Add to `.env.example`

```env
MY_NEW_VAR=default-value
```

3. Use in code

```typescript
import { env } from "~/utils/env.server";

console.log(env.MY_NEW_VAR);
```

---

## Best Practices

### 1. Organization

- Keep routes thin, services thick
- Extract reusable logic to services
- Use utilities for common functions

### 2. Type Safety

- Always define TypeScript types
- Use Drizzle's inferred types
- Validate inputs with Zod

### 3. Error Handling

- Use try-catch in actions/loaders
- Return proper HTTP status codes
- Log errors for debugging

### 4. Security

- Validate all inputs
- Never trust client data
- Use HTTP-only cookies
- Sanitize outputs

### 5. Performance

- Use loader for server data fetching
- Cache static data
- Optimize database queries
- Use indexes

---

## Summary

This template provides a solid foundation with:

- ✅ Clean architecture
- ✅ Type safety
- ✅ Security best practices
- ✅ Scalable structure
- ✅ Production-ready

**Happy building!** 🚀

---

**Need help?** Check:
- [FAQ](FAQ.md)
- [API Documentation](API.md)
- [Deployment Guide](DEPLOYMENT.md)
