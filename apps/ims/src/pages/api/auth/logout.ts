import type { NextApiRequest, NextApiResponse } from 'next';

interface LogoutResponse {
  success: boolean;
  message?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<LogoutResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Clear the session cookie
  res.setHeader('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}
