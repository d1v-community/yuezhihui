# API Documentation

## Base URL

```
Development: http://localhost:5173
Production: https://your-domain.com
```

## Authentication

This API uses JWT (JSON Web Tokens) for authentication. Tokens are stored in HTTP-only cookies and are automatically sent with requests.

**No manual token passing required** - the client automatically includes the token in the `Authorization` header as `Bearer <token>`.

## Endpoints

### Send Verification Code

Send a 6-digit verification code to the user's email address.

```http
POST /api/auth/send-code
Content-Type: application/json
```

#### Request Body

```json
{
  "email": "user@example.com"
}
```

#### Response

**Success (200)**

```json
{
  "success": true,
  "message": "Verification code sent"
}
```

**Error (400)**

```json
{
  "success": false,
  "error": "Invalid email format"
}
```

**Error (500)**

```json
{
  "success": false,
  "error": "Failed to send verification code"
}
```

---

### Verify Login

Verify the email verification code and log the user in.

```http
POST /api/auth/verify-login
Content-Type: application/json
```

#### Request Body

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

#### Response

**Success (200)**

```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "username": "username",
    "email": "user@example.com",
    "displayName": "Display Name",
    "avatarUrl": null
  },
  "token": "jwt-token-string"
}
```

The JWT token is also set as an HTTP-only cookie named `auth-token`.

**Error (400)**

```json
{
  "success": false,
  "error": "Invalid or expired verification code"
}
```

**Error (400)**

```json
{
  "success": false,
  "error": "Invalid input"
}
```

---

### Logout

Log the user out and clear the authentication token.

```http
POST /api/auth/logout
```

#### Response

**Success (200)**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

The `auth-token` cookie is cleared.

---

### Get Current User

Retrieve information about the currently authenticated user.

```http
GET /api/auth/me
```

#### Response

**Authenticated (200)**

```json
{
  "authenticated": true,
  "user": {
    "id": "uuid-string",
    "username": "username",
    "email": "user@example.com",
    "displayName": "Display Name",
    "avatarUrl": null
  }
}
```

**Not Authenticated (200)**

```json
{
  "authenticated": false
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Not logged in |
| 500 | Internal Server Error - Server-side error |

## Examples

### cURL

#### Send Verification Code

```bash
curl -X POST http://localhost:5173/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

#### Verify Login

```bash
curl -X POST http://localhost:5173/api/auth/verify-login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "code": "123456"}' \
  -c cookies.txt
```

#### Get Current User

```bash
curl http://localhost:5173/api/auth/me \
  -b cookies.txt
```

#### Logout

```bash
curl -X POST http://localhost:5173/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

### JavaScript (fetch)

#### Send Verification Code

```javascript
const response = await fetch('/api/auth/send-code', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
  }),
});

const data = await response.json();
```

#### Verify Login

```javascript
const response = await fetch('/api/auth/verify-login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    code: '123456',
  }),
});

const data = await response.json();

if (data.success) {
  // User is now logged in
  // Token is stored in cookie
  localStorage.setItem('token', data.token);
}
```

## Rate Limiting

Currently, there is no rate limiting implemented. In production, consider implementing:

- Rate limiting on `/api/auth/send-code` (e.g., max 5 requests per minute per IP)
- Rate limiting on `/api/auth/verify-login` (e.g., max 10 attempts per code)

## Security Notes

1. **Verification codes expire after 10 minutes**
2. **Each code can only be used once**
3. **JWT tokens expire after 7 days**
4. **Tokens are stored in HTTP-only cookies for security**
5. **In development, check console logs for verification codes if RESEND_API_KEY is not set**

## Client-Side Integration

### React

```tsx
import { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const response = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (data.success) {
      setStep('code');
    }

    setLoading(false);
  };

  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const response = await fetch('/api/auth/verify-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();

    if (data.success) {
      // User is logged in
      window.location.href = '/';
    }

    setLoading(false);
  };

  return (
    <form onSubmit={step === 'email' ? handleSendCode : handleVerifyLogin}>
      {/* Form JSX */}
    </form>
  );
}
```

### Next.js / Fetch Client

```javascript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5173';

export const authAPI = {
  sendCode: async (email) => {
    const response = await fetch(`${API_BASE}/api/auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  verifyLogin: async (email, code) => {
    const response = await fetch(`${API_BASE}/api/auth/verify-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
      credentials: 'include', // Important: include cookies
    });
    return response.json();
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: 'include',
    });
    return response.json();
  },

  logout: async () => {
    const response = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return response.json();
  },
};
```
