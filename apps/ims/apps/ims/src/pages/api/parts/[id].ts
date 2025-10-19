import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  // Handle GET - Get single part
  if (req.method === 'GET') {
    // In production, fetch from database
    res.status(200).json({
      id,
      name: 'Sample Part',
      description: 'Part details',
    });
  }

  // Handle PUT - Update part
  else if (req.method === 'PUT') {
    // In production, update in database
    res.status(200).json({
      success: true,
      message: 'Part updated successfully',
      ...req.body,
      id,
    });
  }

  // Handle DELETE - Delete part
  else if (req.method === 'DELETE') {
    // In production, delete from database
    res.status(200).json({
      success: true,
      message: 'Part deleted successfully',
    });
  }

  // Handle unsupported methods
  else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
