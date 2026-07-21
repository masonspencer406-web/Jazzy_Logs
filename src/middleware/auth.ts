import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jazzy_logs_master_jwt_secret_key_2026';

export interface AuthRequest extends Request {
  user?: any;
}

export const createCustomToken = (uid: string, email: string) => {
  const payload = { uid, email, user_id: uid };
  const signed = jwt.sign(payload, JWT_SECRET, { expiresIn: '14d' });
  return `custom_session_${signed}`;
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];

  // Return early for missing or invalid dummy tokens to avoid throwing decode errors
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
  }

  // Support custom backend session tokens
  if (token.startsWith('custom_session_')) {
    try {
      const tokenBody = token.replace('custom_session_', '');
      const decoded = jwt.verify(tokenBody, JWT_SECRET) as any;
      req.user = decoded;
      return next();
    } catch (jwtErr) {
      console.error('Custom token verification error:', jwtErr);
      return res.status(401).json({ error: 'Unauthorized: Expired or invalid session token' });
    }
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    // Attempt fallback JWT verification
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      return next();
    } catch (fallbackErr) {
      console.error('Error verifying token:', error);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  }
};

