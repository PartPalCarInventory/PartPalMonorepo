import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '@partpal/shared-types';

// Mock user database (same as login.ts)
const mockUsers = [
  {
    id: '1',
    email: 'demo@partpal.co.za',
    password: 'demo123',
    name: 'Demo User',
    role: 'SELLER' as const,
    isVerified: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    email: 'admin@partpal.co.za',
    password: 'admin123',
    name: 'Admin User',
    role: 'ADMIN' as const,
    isVerified: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

interface SessionResponse {
  success: boolean;
  user?: Omit<User, 'password'>;
  error?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<SessionResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Get session from cookie
  const cookies = req.headers.cookie?.split('; ').reduce((acc, cookie) => {
    const [key, value] = cookie.split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>) || {};

  const sessionId = cookies.session;

  if (!sessionId) {
    return res.status(401).json({ success: false, error: 'No session found' });
  }

  // Find user by session ID (in production, validate actual session token)
  const user = mockUsers.find(u => u.id === sessionId);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid session' });
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.status(200).json({
    success: true,
    user: userWithoutPassword,
  });
}
