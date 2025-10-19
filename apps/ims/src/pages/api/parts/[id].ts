import type { NextApiRequest, NextApiResponse } from 'next';
import { Part } from '@partpal/shared-types';
import { mockParts } from './index';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid part ID' });
  }

  // Handle GET - Get single part
  if (req.method === 'GET') {
    const part = mockParts.find(p => p.id === id);

    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    return res.status(200).json(part);
  }

  // Handle PUT - Update part
  else if (req.method === 'PUT') {
    try {
      const partIndex = mockParts.findIndex(p => p.id === id);

      if (partIndex === -1) {
        return res.status(404).json({ error: 'Part not found' });
      }

      const updatedPart: Part = {
        ...mockParts[partIndex],
        ...req.body,
        id, // Ensure ID doesn't change
        updatedAt: new Date(),
      };

      mockParts[partIndex] = updatedPart;

      return res.status(200).json(updatedPart);
    } catch (error) {
      console.error('Error updating part:', error);
      return res.status(500).json({ error: 'Failed to update part' });
    }
  }

  // Handle DELETE - Delete part
  else if (req.method === 'DELETE') {
    try {
      const partIndex = mockParts.findIndex(p => p.id === id);

      if (partIndex === -1) {
        return res.status(404).json({ error: 'Part not found' });
      }

      mockParts.splice(partIndex, 1);

      return res.status(200).json({
        success: true,
        message: 'Part deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting part:', error);
      return res.status(500).json({ error: 'Failed to delete part' });
    }
  }

  // Handle unsupported methods
  else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
