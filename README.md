<div align="center">

# 🔐 Remix + Neon Email Authentication Template

A production-ready starter template for building web applications with email verification login using Remix, Neon (PostgreSQL), JWT tokens, and Tailwind CSS.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Remix](https://img.shields.io/badge/Remix-000000?logo=remix&logoColor=white)](https://remix.run/)
[![Neon](https://img.shields.io/badge/Neon-00E5A7?logo=neon&logoColor=white)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Features** • **Quick Start** • **API** • **Deployment** • **Contributing**

</div>

## ✨ Features

- 🔐 **Email Verification Login** - Secure authentication without passwords
- 🎫 **JWT Tokens** - Stateless token-based authentication
- 🗄️ **Neon Database** - Serverless PostgreSQL
- 🎨 **Tailwind CSS** - Beautiful, responsive UI
- 🏗️ **Remix** - Full-stack React framework
- 📧 **Resend** - Email delivery service
- 🛡️ **TypeScript** - Full type safety
- ⚡ **Drizzle ORM** - Type-safe database queries
- 🔒 **Security First** - Secure cookie handling and token management

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) account
- A [Resend](https://resend.com) account (optional, for email sending)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd remix-neon-auth
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-change-in-production
RESEND_API_KEY=your_resend_api_key  # Optional
APP_URL=http://localhost:5173
```

4. **Set up the database**
```bash
pnpm run db:migrate
```

5. **Start the development server**
```bash
pnpm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

## 📁 Project Structure

```
remix-neon-auth/
├── app/
│   ├── db/
│   │   ├── db.server.ts          # Database connection
│   │   └── schema.ts             # Drizzle schema
│   ├── routes/
│   │   ├── _index.tsx            # Home page
│   │   ├── login.tsx             # Login page
│   │   └── api.auth.*.ts         # API routes
│   ├── services/
│   │   ├── verification.server.ts # Email verification logic
│   │   └── jwt.server.ts         # JWT token handling
│   ├── utils/
│   │   ├── auth.server.ts        # Authentication utilities
│   │   └── env.server.ts         # Environment validation
│   ├── tailwind.css              # Tailwind styles
│   ├── entry.client.tsx
│   ├── entry.server.tsx
│   └── root.tsx
├── drizzle/
│   ├── 0000_init.sql             # Database migration
│   └── meta/
│       └── _journal.json         # Migration journal
├── public/                        # Static assets
├── .env.example                   # Environment template
├── package.json
├── tailwind.config.ts
├── drizzle.config.ts
└── README.md
```

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/send-code` | Send verification code |
| `POST` | `/api/auth/verify-login` | Verify code & login |
| `POST` | `/api/auth/logout` | Logout user |
| `GET` | `/api/auth/me` | Get current user |

### Request/Response Examples

**Send Verification Code**
```bash
POST /api/auth/send-code
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Verify Login**
```bash
POST /api/auth/verify-login
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

## 🎨 Customization

### Styling

The template uses Tailwind CSS. Customize the design in:

- `tailwind.config.ts` - Tailwind configuration
- `app/tailwind.css` - Custom styles
- Component className attributes

### Email Template

Customize the verification email in `app/services/verification.server.ts`:

```typescript
const result = await resend.emails.send({
  from: "Your App <auth@yourdomain.com>",  // Update this
  to: [email],
  subject: "Your verification code",
  html: `...`  // Customize HTML template
});
```

### Database Schema

Add tables in `app/db/schema.ts`:

```typescript
export const yourTable = pgTable('your_table', {
  // ... columns
});
```

Then create a new migration:
```bash
cp drizzle/0000_init.sql drizzle/0001_new_feature.sql
# Edit the new migration file
pnpm run db:migrate
```

## 🛠️ Available Scripts

```bash
pnpm run dev          # Start development server
pnpm run build        # Build for production
pnpm run start        # Start production server
pnpm run typecheck    # Run TypeScript type checks (no emit)
pnpm run typecheck:watch  # Watch mode type checks
pnpm run lint         # Run ESLint

pnpm run db:migrate   # Apply database migrations
pnpm run db:migrate:api  # Apply migrations via Neon API
pnpm run db:seed      # Seed database with demo data
pnpm run db:seed:api  # Seed database via Neon API
```

## 🗃️ Database: API Mode (Default)

This template defaults to applying migrations and seed via a backend API to avoid exposing `DATABASE_URL` to Node processes. Prefer the `:api` scripts unless you explicitly need direct DB access.

- Default (recommended): `db:migrate:api`, `db:seed:api`
- Direct DB (optional): `db:migrate`, `db:seed` (requires `DATABASE_URL`)

Note for AI assistants: Use the `:api` scripts by default.

### Migrate via API (default)

Required env:
- `PROJECT_ID` — target project id
- One of: `OPCODE_API_BASE` (e.g. `http://localhost:9191/api`) or `BACKEND_ADMIN_API_BASE`
- `AUTH_TOKEN` (Bearer token), or pass a token at runtime

Optional env:
- `MIGRATIONS_FOLDER` — defaults to `drizzle`

Examples:
```bash
# Using a token file
PROJECT_ID=your_project_id \
OPCODE_API_BASE=http://localhost:9191/api \
pnpm run db:migrate:api -- --token-file ./dev.token

# Or pipe token from env/command
echo "$AUTH_TOKEN" | PROJECT_ID=your_project_id \
OPCODE_API_BASE=http://localhost:9191/api \
pnpm run -s db:migrate:api

# Custom migrations folder
MIGRATIONS_FOLDER=drizzle \
PROJECT_ID=your_project_id \
OPCODE_API_BASE=http://localhost:9191/api \
echo "$AUTH_TOKEN" | pnpm run -s db:migrate:api
```

### Seed via API (default)

Required env:
- `PROJECT_ID`
- `OPCODE_API_BASE` (e.g. `http://localhost:9191/api`)
- `AUTH_TOKEN` (Bearer token), or pass a token at runtime

Optional env:
- `SEED_FILE` — defaults to `drizzle/0001_init.sql`

Examples:
```bash
# Using a token file
PROJECT_ID=your_project_id \
OPCODE_API_BASE=http://localhost:9191/api \
pnpm run db:seed:api -- --token-file ./dev.token

# Or pipe token from env/command
echo "$AUTH_TOKEN" | PROJECT_ID=your_project_id \
OPCODE_API_BASE=http://localhost:9191/api \
pnpm run -s db:seed:api

# Custom seed file
SEED_FILE=drizzle/0001_init.sql \
PROJECT_ID=your_project_id \
OPCODE_API_BASE=http://localhost:9191/api \
echo "$AUTH_TOKEN" | pnpm run -s db:seed:api
```

### Direct DB mode (optional)

If you prefer direct DB execution (local/dev), set `DATABASE_URL` in `.env` and run:

```bash
pnpm run db:migrate
pnpm run db:seed
```

Direct mode executes SQL against your database from the Node process. Use with care in shared environments.

## 🔎 Type Checking

To maintain reliability, always run a type check after making changes and fix any reported issues before committing.

```bash
pnpm run typecheck
```

- Use `pnpm run typecheck:watch` during development to continuously catch type errors.
- Type checks do not emit build output; Vite handles builds separately.

## 🚢 Deployment

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)

1. Push your code to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/remix-neon-auth)

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install
COPY . .
RUN pnpm run build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## 🔒 Security Considerations

- ✅ JWT tokens are stored in HTTP-only cookies
- ✅ Passwordless authentication (no password storage)
- ✅ Verification codes expire after 10 minutes
- ✅ One-time use verification codes
- ✅ Secure cookie settings (SameSite, Secure in production)
- ✅ Environment variables for sensitive data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes
4. Run type checks and fix issues: `pnpm run typecheck`
5. Lint/format if needed: `pnpm run lint && pnpm run format`
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Remix](https://remix.run/) - The full-stack web framework
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Drizzle](https://orm.drizzle.team/) - TypeScript ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Resend](https://resend.com/) - Email API

## 📚 Resources

- [Remix Documentation](https://remix.run/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Drizzle Documentation](https://orm.drizzle.team/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [JWT.io](https://jwt.io/) - JWT debugger

---

<div align="center">

**Built with ❤️ using Remix + Neon**

[Report Bug](https://github.com/YOUR_USERNAME/remix-neon-auth/issues) • [Request Feature](https://github.com/YOUR_USERNAME/remix-neon-auth/issues)

</div>
