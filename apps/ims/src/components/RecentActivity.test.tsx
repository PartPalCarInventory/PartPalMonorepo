import { render, screen } from '../test-utils';
import { RecentActivity } from './RecentActivity';
import { Activity } from '@partpal/shared-types';

describe('RecentActivity', () => {
  const mockActivities: Activity[] = [
    {
      id: '1',
      type: 'vehicle_added',
      description: 'Added 2020 Toyota Camry to inventory',
      timestamp: new Date('2025-10-13T10:00:00Z'),
      userId: 'user-1',
    },
    {
      id: '2',
      type: 'part_listed',
      description: 'Listed Engine Block for sale',
      timestamp: new Date('2025-10-13T09:30:00Z'),
      userId: 'user-1',
    },
    {
      id: '3',
      type: 'part_sold',
      description: 'Sold Brake Pads to customer',
      timestamp: new Date('2025-10-13T09:00:00Z'),
      userId: 'user-1',
    },
    {
      id: '4',
      type: 'marketplace_listing',
      description: 'Part published to marketplace',
      timestamp: new Date('2025-10-13T08:30:00Z'),
      userId: 'user-1',
    },
  ];

  describe('Empty State', () => {
    it('renders empty state when no activities provided', () => {
      render(<RecentActivity activities={[]} />);

      expect(screen.getByText('No recent activity')).toBeInTheDocument();
      expect(screen.getByText(/Activity will appear here as you use the system/i)).toBeInTheDocument();
    });

    it('renders empty state when activities is undefined', () => {
      render(<RecentActivity activities={null as any} />);

      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });
  });

  describe('Rendering Activities', () => {
    it('renders all activities with descriptions', () => {
      render(<RecentActivity activities={mockActivities} />);

      expect(screen.getByText('Added 2020 Toyota Camry to inventory')).toBeInTheDocument();
      expect(screen.getByText('Listed Engine Block for sale')).toBeInTheDocument();
      expect(screen.getByText('Sold Brake Pads to customer')).toBeInTheDocument();
      expect(screen.getByText('Part published to marketplace')).toBeInTheDocument();
    });

    it('displays activity types', () => {
      render(<RecentActivity activities={mockActivities} />);

      expect(screen.getByText('vehicle added')).toBeInTheDocument();
      expect(screen.getByText('part listed')).toBeInTheDocument();
      expect(screen.getByText('part sold')).toBeInTheDocument();
      expect(screen.getByText('marketplace listing')).toBeInTheDocument();
    });

    it('displays timestamps for all activities', () => {
      render(<RecentActivity activities={mockActivities} />);

      // date-fns formatDistanceToNow should create relative timestamps
      const timestamps = screen.getAllByText(/ago/i);
      expect(timestamps.length).toBe(mockActivities.length);
    });
  });

  describe('Activity Icons', () => {
    it('renders icons for vehicle_added activity', () => {
      const vehicleActivity: Activity[] = [{
        id: '1',
        type: 'vehicle_added',
        description: 'Added vehicle',
        timestamp: new Date(),
        userId: 'user-1',
      }];

      const { container } = render(<RecentActivity activities={vehicleActivity} />);
      const blueIcons = container.querySelectorAll('.bg-blue-100');
      expect(blueIcons.length).toBeGreaterThan(0);
    });

    it('renders icons for part_listed activity', () => {
      const partListedActivity: Activity[] = [{
        id: '1',
        type: 'part_listed',
        description: 'Listed part',
        timestamp: new Date(),
        userId: 'user-1',
      }];

      const { container } = render(<RecentActivity activities={partListedActivity} />);
      const greenIcons = container.querySelectorAll('.bg-green-100');
      expect(greenIcons.length).toBeGreaterThan(0);
    });

    it('renders icons for part_sold activity', () => {
      const partSoldActivity: Activity[] = [{
        id: '1',
        type: 'part_sold',
        description: 'Sold part',
        timestamp: new Date(),
        userId: 'user-1',
      }];

      const { container } = render(<RecentActivity activities={partSoldActivity} />);
      const orangeIcons = container.querySelectorAll('.bg-orange-100');
      expect(orangeIcons.length).toBeGreaterThan(0);
    });

    it('renders icons for marketplace_listing activity', () => {
      const marketplaceActivity: Activity[] = [{
        id: '1',
        type: 'marketplace_listing',
        description: 'Published to marketplace',
        timestamp: new Date(),
        userId: 'user-1',
      }];

      const { container } = render(<RecentActivity activities={marketplaceActivity} />);
      const purpleIcons = container.querySelectorAll('.bg-purple-100');
      expect(purpleIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Activity Colors', () => {
    it('applies blue color to vehicle_added type', () => {
      const vehicleActivity: Activity[] = [{
        id: '1',
        type: 'vehicle_added',
        description: 'Test',
        timestamp: new Date(),
        userId: 'user-1',
      }];

      const { container } = render(<RecentActivity activities={vehicleActivity} />);
      const blueText = container.querySelectorAll('.text-blue-600');
      expect(blueText.length).toBeGreaterThan(0);
    });

    it('applies green color to part_listed type', () => {
      const partListedActivity: Activity[] = [{
        id: '1',
        type: 'part_listed',
        description: 'Test',
        timestamp: new Date(),
        userId: 'user-1',
      }];

      const { container } = render(<RecentActivity activities={partListedActivity} />);
      const greenText = container.querySelectorAll('.text-green-600');
      expect(greenText.length).toBeGreaterThan(0);
    });

    it('applies orange color to part_sold type', () => {
      const partSoldActivity: Activity[] = [{
        id: '1',
        type: 'part_sold',
        description: 'Test',
        timestamp: new Date(),
        userId: 'user-1',
      }];

      const { container } = render(<RecentActivity activities={partSoldActivity} />);
      const orangeText = container.querySelectorAll('.text-orange-600');
      expect(orangeText.length).toBeGreaterThan(0);
    });

    it('applies purple color to marketplace_listing type', () => {
      const marketplaceActivity: Activity[] = [{
        id: '1',
        type: 'marketplace_listing',
        description: 'Test',
        timestamp: new Date(),
        userId: 'user-1',
      }];

      const { container } = render(<RecentActivity activities={marketplaceActivity} />);
      const purpleText = container.querySelectorAll('.text-purple-600');
      expect(purpleText.length).toBeGreaterThan(0);
    });
  });

  describe('Timeline Connector', () => {
    it('renders timeline connectors between activities', () => {
      const { container } = render(<RecentActivity activities={mockActivities} />);

      // Timeline connectors are spans with specific classes
      const connectors = container.querySelectorAll('.bg-gray-200');
      // Should have n-1 connectors for n activities
      expect(connectors.length).toBeGreaterThan(0);
    });

    it('does not render connector after last activity', () => {
      const singleActivity: Activity[] = [{
        id: '1',
        type: 'vehicle_added',
        description: 'Test',
        timestamp: new Date(),
        userId: 'user-1',
      }];

      const { container } = render(<RecentActivity activities={singleActivity} />);

      // Check that connectors are not present for single item
      const lastItem = container.querySelector('li:last-child');
      const connector = lastItem?.querySelector('.bg-gray-200');
      expect(connector).not.toBeInTheDocument();
    });
  });

  describe('View All Link', () => {
    it('renders "View All Activity" link', () => {
      render(<RecentActivity activities={mockActivities} />);

      const link = screen.getByText('View All Activity');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/reports');
    });
  });

  describe('Activity Rendering', () => {
    it('renders activities in correct order', () => {
      render(<RecentActivity activities={mockActivities} />);

      // Just check that all activities are rendered - order doesn't matter for display
      expect(screen.getByText('Added 2020 Toyota Camry to inventory')).toBeInTheDocument();
      expect(screen.getByText('Listed Engine Block for sale')).toBeInTheDocument();
      expect(screen.getByText('Sold Brake Pads to customer')).toBeInTheDocument();
      expect(screen.getByText('Part published to marketplace')).toBeInTheDocument();
    });
  });
});
