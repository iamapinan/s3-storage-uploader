import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'session';
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'default-secret-key-change-in-production'
);

export interface SessionData {
  authenticated: boolean;
  username?: string;
  expiresAt: number;
}

/**
 * Create a session token
 */
export async function createSession(username: string): Promise<string> {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  const token = await new SignJWT({ 
    authenticated: true, 
    username,
    expiresAt 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(SESSION_SECRET);

  return token;
}

/**
 * Verify and decode a session token
 */
export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    
    if (payload.expiresAt && typeof payload.expiresAt === 'number' && payload.expiresAt < Date.now()) {
      return null;
    }

    return {
      authenticated: payload.authenticated as boolean,
      username: payload.username as string,
      expiresAt: payload.expiresAt as number,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });
}

/**
 * Get session from cookie
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}

/**
 * Clear session cookie
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Validate credentials against environment variables
 */
export function validateCredentials(username: string, password: string): boolean {
  const validUsername = process.env.AUTH_USER;
  const validPassword = process.env.AUTH_PASS;

  if (!validUsername || !validPassword) {
    console.error('AUTH_USER or AUTH_PASS environment variables not set');
    return false;
  }

  return username === validUsername && password === validPassword;
}
