# Authentication Setup

## Environment Variables
Add the following to your `.env.local` file:

```bash
NEXT_PUBLIC_AUTH_USER=admin
NEXT_PUBLIC_AUTH_PASS=your_secure_password
```

Replace `your_secure_password` with your desired password.

## Usage
1. Navigate to the app - you'll be redirected to `/login`
2. Enter the username and password from your environment variables
3. After successful login, you'll access the dashboard
4. Click "ออกจากระบบ" (Logout) in the header to log out

## Security Note
This implementation uses client-side authentication with credentials stored in `NEXT_PUBLIC_*` environment variables. This is suitable for simple access control but NOT for production security. For production use, implement server-side authentication with proper session management.
