import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '@partpal/shared-types';

// Mock user database (in production, this would be a real database)
const mockUsers = [
  {
    id: '1',
    email: 'demo@partpal.co.za',
    password: 'demo123', // In production, this would be hashed
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

interface LoginResponse {
  success: boolean;
  user?: Omit<User, 'password'>;
  error?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  // Find user
  const user = mockUsers.find(u => u.email === email);

  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  // In production, you would:
  // 1. Hash and compare passwords
  // 2. Create a session/JWT token
  // 3. Set secure HTTP-only cookies

  // Set a simple session cookie (in production, use proper session management)
  res.setHeader('Set-Cookie', `session=${user.id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);

  // Simulate network delay
  setTimeout(() => {
    res.status(200).json({
      success: true,
      user: userWithoutPassword,
    });
  }, 300);
}
