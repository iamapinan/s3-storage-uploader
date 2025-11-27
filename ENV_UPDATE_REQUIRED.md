# IMPORTANT: Update Environment Variables

The env.local file needs to be updated with the new variable names:

## Current (old):
```
NEXT_PUBLIC_AUTH_USER=admin
NEXT_PUBLIC_AUTH_PASS=securepassword
```

## Required (new):
```
AUTH_USER=admin
AUTH_PASS=securepassword
SESSION_SECRET=your-generated-secret-here
```

Please update your `.env.local` file with these variables and restart the dev server.

To generate a SESSION_SECRET, run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
