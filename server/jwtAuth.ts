import jwt from 'jsonwebtoken';
import type { RequestHandler } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'fallback-secret-key';
const JWT_EXPIRY = '7d'; // 7 days

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  firstName: string;
  lastName?: string;
  authProvider: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for a user
 */
export function generateJWTToken(user: {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  authProvider?: string;
}): string {
  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName || '',
    authProvider: user.authProvider || 'local',
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify and decode a JWT token
 */
export function verifyJWTToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to authenticate JWT tokens for mobile clients
 * Falls back to session auth if no JWT token is present
 */
export const authenticateJWT: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Check for JWT token first (for mobile clients)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyJWTToken(token);
    
    if (decoded) {
      // Create a user object similar to session auth
      (req as any).user = {
        claims: {
          sub: decoded.sub,
          email: decoded.email,
          first_name: decoded.firstName,
          last_name: decoded.lastName,
        },
        id: decoded.sub,
        authProvider: decoded.authProvider,
      };
      return next();
    } else {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  }
  
  // Fall back to session authentication for web clients
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ message: 'Unauthorized' });
};

/**
 * Extract user ID from request (works with both JWT and session auth)
 */
export function getUserIdFromRequest(req: any): string | null {
  // JWT auth
  if (req.user?.id) {
    return req.user.id;
  }
  
  // Session auth
  if (req.user?.claims?.sub) {
    return req.user.claims.sub;
  }
  
  return null;
}