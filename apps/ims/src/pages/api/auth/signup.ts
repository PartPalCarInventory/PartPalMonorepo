import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '@partpal/shared-types';

// Mock user database (in production, this would be a real database)
const mockUsers: Array<User & { password: string }> = [];

interface SignupResponse {
  success: boolean;
  user?: Omit<User, 'password'>;
  error?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignupResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, password, name, businessName } = req.body;

  // Validation
  if (!email || !password || !name || !businessName) {
    return res.status(400).json({
      success: false,
      error: 'All fields are required',
    });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email address',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters',
    });
  }

  // Check if user already exists
  const existingUser = mockUsers.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: 'User with this email already exists',
    });
  }

  // Create new user
  const newUser = {
    id: `user-${Date.now()}`,
    email,
    password, // In production, this should be hashed
    name,
    role: 'SELLER' as const,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockUsers.push(newUser);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = newUser;

  // Set session cookie
  res.setHeader('Set-Cookie', `session=${newUser.id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);

  // In production, you would also:
  // 1. Create a Seller profile with the businessName
  // 2. Send verification email
  // 3. Log the signup event

  // Simulate network delay
  setTimeout(() => {
    res.status(201).json({
      success: true,
      user: userWithoutPassword,
    });
  }, 300);
}
