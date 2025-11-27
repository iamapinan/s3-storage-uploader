# Authentication Environment Variables Setup

## Required Environment Variables

Add the following to your `.env.local` file:

```bash
# Authentication credentials (server-side only)
AUTH_USER=admin
AUTH_PASS=securepassword

# Session secret for JWT signing
SESSION_SECRET=your-random-secret-key-here-change-this-in-production
```

## Important Notes

1. **AUTH_USER** and **AUTH_PASS**: These are server-side only variables and will NOT be exposed to the client
2. **SESSION_SECRET**: Used to sign JWT tokens. Generate a random string for production use
3. Remove the old `NEXT_PUBLIC_AUTH_USER` and `NEXT_PUBLIC_AUTH_PASS` variables as they are no longer needed

## Generating a Secure Session Secret

You can generate a secure random secret using:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

## Migration from Old Auth System

If you're upgrading from the previous client-side auth system:

1. Remove `NEXT_PUBLIC_AUTH_USER` and `NEXT_PUBLIC_AUTH_PASS` from your `.env.local`
2. Add `AUTH_USER`, `AUTH_PASS`, and `SESSION_SECRET` as shown above
3. Restart your development server

The authentication now happens securely on the server side with session management.
