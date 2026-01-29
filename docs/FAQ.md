# Frequently Asked Questions (FAQ)

## Table of Contents

- [General Questions](#general-questions)
- [Setup & Installation](#setup--installation)
- [Database](#database)
- [Authentication](#authentication)
- [Email Verification](#email-verification)
- [Deployment](#deployment)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)

---

## General Questions

### What is this template for?

This is a **production-ready starter template** for building web applications with email verification login using:
- **Remix** - Full-stack React framework
- **Neon** - Serverless PostgreSQL
- **JWT** - Token-based authentication
- **Tailwind CSS** - Styling
- **Drizzle ORM** - Type-safe database queries
- **Resend** - Email delivery service

It's perfect for:
- ✅ Passwordless authentication systems
- ✅ SaaS applications
- ✅ MVP prototypes
- ✅ Authentication-heavy projects

---

### Is this production ready?

**Yes!** The template includes:
- 🔒 Security best practices
- 🛡️ Input validation
- 🏗️ Scalable architecture
- 📝 Comprehensive documentation
- ✅ TypeScript for type safety

However, **you should**:
- Review security settings for your use case
- Add rate limiting
- Set up monitoring
- Configure proper logging
- Follow your organization's security policies

---

### Can I use this without Neon?

**Yes!** You can use any PostgreSQL database.

**Update** `drizzle.config.ts`:
```typescript
export default {
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
};
```

And `DATABASE_URL` in `.env`:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
```

---

### Can I use a different email service?

**Yes!** Currently configured for Resend, but you can swap it out.

**Example with SendGrid**:

```bash
npm install @sendgrid/mail
```

```typescript
// app/services/verification.server.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendVerificationEmail(email: string, code: string) {
  await sgMail.send({
    to: email,
    from: 'auth@yourdomain.com',
    subject: 'Your verification code',
    html: `<p>Your code: <strong>${code}</strong></p>`,
  });
}
```

---

## Setup & Installation

### How do I get started?

Follow the [Quick Start guide](../README.md#quick-start):

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy environment file: `cp .env.example .env`
4. Configure environment variables
5. Run migrations: `npm run db:migrate`
6. Start dev server: `npm run dev`

---

### What are the system requirements?

- **Node.js**: 20.0.0 or higher
- **Package Manager**: npm, pnpm, or yarn
- **Database**: PostgreSQL (Neon recommended)
- **Email Service**: Resend (optional for development)

Check version:
```bash
node --version  # Should be >= 20.0.0
```

---

### I'm getting "Cannot find module" errors

**Cause**: Dependencies not installed

**Solution**:
```bash
npm install
```

If using pnpm:
```bash
pnpm install
```

If using yarn:
```bash
yarn install
```

---

### TypeScript errors on first run

**Cause**: Type checking before build

**Solution**:
1. Build the project: `npm run build`
2. Or skip type check: `npm run dev -- --skip-type-check`

**To fix permanently**: Run type check and fix errors:
```bash
npm run typecheck
```

---

## Database

### How do I create a Neon database?

1. Go to [neon.tech](https://neon.tech)
2. Sign up for free
3. Click "Create a new project"
4. Choose a name and region
5. Wait for setup (30 seconds)
6. Go to Settings → Connection String
7. Copy the URI and use as `DATABASE_URL`

**Free tier** includes:
- 500 MB storage
- 3 GB bandwidth per month
- Unlimited projects
- 1 database per project

---

### How do I run migrations?

**Option 1: Local CLI**
```bash
npm run db:migrate
```

**Option 2: Via Neon API (recommended for production)**
```bash
npm run db:migrate:api
```

**View migrations**: Check `drizzle/` folder

---

### Can I use Prisma instead of Drizzle?

**Yes!** But requires significant changes:

1. Install Prisma
```bash
npm install prisma @prisma/client
```

2. Initialize Prisma
```bash
npx prisma init
```

3. Recreate schema in `prisma/schema.prisma`
4. Update `app/db/db.server.ts` to use Prisma client
5. Update migration scripts

**Note**: This template is configured for Drizzle. Using Prisma requires refactoring.

---

### How do I add a new table?

1. Edit `app/db/schema.ts`:

```typescript
export const yourTable = pgTable('your_table', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

2. Create migration:
```bash
cp drizzle/0000_init.sql drizzle/0001_add_your_table.sql
# Edit the new file
```

3. Run migration:
```bash
npm run db:migrate
```

---

### Database is paused in Neon

**Cause**: Neon pauses databases after 5 minutes of inactivity (free tier)

**Solution**:
1. Open Neon dashboard
2. Click "Resume" on your database
3. Wait for it to become active (few seconds)

**Prevention**:
- Keep a connection alive (pinging every 5 minutes)
- Upgrade to paid plan
- Use Neon Pro for no pause

---

## Authentication

### How does passwordless login work?

**Flow**:

1. User enters email
2. System generates 6-digit code
3. Code sent to email (or logged to console in dev)
4. User enters code
5. System validates code (10 min expiry, one-time use)
6. If valid, creates/finds user account
7. Issues JWT token
8. Stores token in HTTP-only cookie
9. User is logged in

**Benefits**:
- ✅ No passwords to remember
- ✅ No password reset flows
- ✅ No password security concerns
- ✅ Easy migration from other systems

---

### Can I use passwords instead of email codes?

**Yes!** But requires modifications:

1. Update schema to add `passwordHash` field
2. Create password hashing/verification logic
3. Create new login route
4. Update UI forms

**Example with bcrypt**:

```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

**Update schema**:
```typescript
export const users = pgTable('users', {
  // ... existing fields
  passwordHash: text('password_hash'),
});
```

**In login route**:
```typescript
import bcrypt from 'bcrypt';

const isValid = await bcrypt.compare(password, user.passwordHash);
```

---

### How long are JWT tokens valid?

**Default**: 7 days

**Change in** `app/services/jwt.server.ts`:
```typescript
export function generateToken(payload: TokenPayload): string {
  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "7d",  // Change here: "1h", "30d", etc.
  });
  return token;
}
```

**Security Note**: Shorter = more secure but more frequent logins

---

### Can I add user roles/permissions?

**Yes!** Add a `role` field:

```typescript
// app/db/schema.ts
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email'),
  role: text('role').notNull().default('user'),  // Add this
});
```

**Check role in routes**:
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (user.role !== 'admin') {
    throw new Response('Forbidden', { status: 403 });
  }
  // ...
}
```

---

### How do I implement "Remember Me"?

**Option 1**: Extend JWT expiration

When user checks "Remember Me":
```typescript
const token = jwt.sign(payload, env.JWT_SECRET, {
  expiresIn: "30d",  // Instead of 7d
});
```

**Option 2**: Separate "remember me" token

Create a second token with longer expiry stored separately.

---

## Email Verification

### Verification code not received

**Check list**:

1. **Is RESEND_API_KEY set?**
   - In development, codes are logged to console
   - Check server logs

2. **Check spam folder**

3. **Is email address correct?**

4. **Check Resend dashboard**
   - Go to Logs → Email Events
   - Check if email was sent
   - Verify domain (if custom)

5. **Domain verification**
   - Custom domains need DNS verification
   - Check Resend dashboard → Domains

---

### Customize email template

Edit `app/services/verification.server.ts`:

```typescript
await resend.emails.send({
  from: "Your Brand <hello@yourdomain.com>",
  to: [email],
  subject: "Your Login Code for Your App",
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h1 style="color: #333;">Welcome to Your App!</h1>
      <p>Enter this code to log in:</p>
      <div style="font-size: 32px; font-weight: bold; margin: 20px 0; color: #0070f3;">
        ${code}
      </div>
      <p>This code expires in 10 minutes.</p>
      <p>If you didn't request this, please ignore.</p>
    </div>
  `,
});
```

---

### Change verification code format

**Current**: 6-digit numeric (123456)

**Change to alphanumeric**:

```typescript
// app/services/verification.server.ts
export async function generateVerificationCode(email: string) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // ...
}
```

---

### Rate limiting on verification requests

Currently not implemented. Add for production:

```typescript
// Example with Redis
import Redis from 'ioredis';

const redis = new Redis();

export async function generateVerificationCode(email: string) {
  const key = `send:${email}`;
  const count = await redis.incr(key);

  if (count > 5) {
    throw new Error("Rate limit exceeded. Try again later.");
  }

  await redis.expire(key, 60); // 1 minute
  // ...
}
```

---

## Deployment

### Which platform should I deploy to?

**Recommended**:

- **Vercel** - Best Remix support, easy setup, generous free tier
- **Netlify** - Good Remix support, edge functions
- **Railway** - Simple, database included
- **Fly.io** - More control, global distribution

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guides.

---

### How to deploy to Vercel?

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

Or CLI:
```bash
npm install -g vercel
vercel login
vercel
```

Don't forget to add environment variables:
```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add RESEND_API_KEY
```

---

### Environment variables not working in production

**Checklist**:

1. ✅ Variables added to platform dashboard
2. ✅ Names match exactly (case-sensitive)
3. ✅ No trailing spaces
4. ✅ Redeployed after adding
5. ✅ Server restarted

**Common issues**:
- `JWT_SECRET` not set → Login fails
- `DATABASE_URL` wrong format → Database errors
- Missing `?sslmode=require` → Connection errors

---

### Build fails on deployment

**Check logs**:
- Usually dependency or type errors

**Common fixes**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Build locally first
npm run build

# Check TypeScript
npm run typecheck
```

---

## Customization

### Change primary brand color

**In** `tailwind.config.ts`:

```typescript
export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',  // Change this
          600: '#2563eb',
        },
      },
    },
  },
};
```

**Use in components**:
```tsx
<button className="bg-primary-500 text-white">
  Click me
</button>
```

---

### Add a new page

1. Create file in `app/routes/your-page.tsx`

```typescript
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Your Page" }];
};

export default function YourPage() {
  return <div>Your page content</div>;
}
```

2. Navigate to `/your-page`

---

### Add custom fonts

**Option 1: Google Fonts**

1. Add to `app/root.tsx`:

```typescript
export const links = () => [
  { rel: "stylesheet", href: tailwindStyles },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
];
```

2. Update Tailwind config:

```typescript
export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
};
```

---

### Add a loading state

```tsx
export default function Login() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      disabled={loading}
      className="disabled:opacity-50"
    >
      {loading ? "Loading..." : "Submit"}
    </button>
  );
}
```

---

### Add form validation

Using Zod:

```bash
npm install zod
```

```typescript
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  code: z.string().length(6, "Code must be 6 digits"),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const result = schema.safeParse(data);
  if (!result.success) {
    return json({ errors: result.error.flatten() }, { status: 400 });
  }
  // Process valid data
}
```

---

## Troubleshooting

### "Cannot read properties of null"

**Common in**: Cookie handling

**Fix**:
```typescript
// Before
const token = request.headers.get("Authorization")?.split(" ")[1];

// After
const authHeader = request.headers.get("Authorization");
if (!authHeader) return null;
const token = authHeader.split(" ")[1];
```

---

### "Route not found" error

**Check**:
1. File name matches route pattern
   - `app/routes/about.tsx` → `/about`
   - `app/routes/blog.$slug.tsx` → `/blog/my-post`

2. No syntax errors in route file

3. Restart dev server after creating route

---

### CORS errors

**Cause**: API called from different origin

**Fix**: Configure CORS in platform or use same origin

For Remix, APIs and frontend are same origin by default. If calling from different domain:

```typescript
// In API route
export async function loader({ request }: LoaderFunctionArgs) {
  const origin = request.headers.get("Origin");
  return json(data, {
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
    },
  });
}
```

---

### Database connection pool exhausted

**Cause**: Too many concurrent connections

**Fix**:
1. Check Neon connection limits
2. Reduce connection count
3. Use connection pooling

Neon automatically pools connections. Keep connections open and reuse.

---

### "ENOENT: no such file or directory"

**Cause**: File path issue

**Fix**:
- Use path aliases: `~/...` points to `app/`
- Check imports: `import { db } from "~/db/db.server"`
- Never use relative paths like `../../../db`

---

### Hot reload not working

**Fix**:
```bash
# Stop server
Ctrl+C

# Clear cache
rm -rf node_modules/.vite

# Restart
npm run dev
```

---

### ESLint errors

**Fix automatically**:
```bash
npm run lint -- --fix
```

**Disable rule** (temporary):
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = getData();
```

**Update config**: `.eslintrc.cjs`

---

## Still Need Help?

### Resources

- 📚 [Remix Documentation](https://remix.run/docs)
- 📚 [Neon Documentation](https://neon.tech/docs)
- 📚 [Drizzle Documentation](https://orm.drizzle.team/docs)
- 📚 [Tailwind Documentation](https://tailwindcss.com/docs)

### Get Support

- 🐛 [Report a Bug](https://github.com/YOUR_USERNAME/remix-neon-auth/issues)
- 💡 [Request a Feature](https://github.com/YOUR_USERNAME/remix-neon-auth/issues)
- 💬 [Discussions](https://github.com/YOUR_USERNAME/remix-neon-auth/discussions)

### Community

- [Remix Discord](https://rmx.as/discord)
- [Neon Discord](https://discord.gg/Neon)

---

**Last Updated**: November 2024

**Happy coding!** 🚀
