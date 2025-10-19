import { render, screen, fireEvent, waitFor } from '../test-utils';
import { MobileNavigation, MobileBottomNav } from './MobileNavigation';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('../contexts/AuthContext');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockPush = jest.fn();

describe('MobileNavigation', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      pathname: '/dashboard',
      query: {},
      asPath: '/dashboard',
      route: '/dashboard',
    });

    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', name: 'John Doe' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility', () => {
    it('does not render when isOpen is false', () => {
      render(<MobileNavigation isOpen={false} onClose={jest.fn()} />);
      expect(screen.queryByText('PartPal IMS')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', () => {
      render(<MobileNavigation isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByText('PartPal IMS')).toBeInTheDocument();
    });

    it('returns null when not open', () => {
      const { container } = render(<MobileNavigation isOpen={false} onClose={jest.fn()} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Header', () => {
    it('renders header with title', () => {
      render(<MobileNavigation isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByText('PartPal IMS')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<MobileNavigation isOpen={true} onClose={jest.fn()} />);
      const closeButton = screen.getByRole('button', { name: '' });
      expect(closeButton).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const mockOnClose = jest.fn();
      render(<MobileNavigation isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: '' });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Backdrop', () => {
    it('renders backdrop overlay', () => {
      const { container } = render(<MobileNavigation isOpen={true} onClose={jest.fn()} />);
      const backdrop = container.querySelector('.bg-black.bg-opacity-50');
      expect(backdrop).toBeInTheDocument();
    });

    it('calls onClose when backdrop is clicked', () => {
      const mockOnClose = jest.fn();
      const { container } = render(<MobileNavigation isOpen={true} onClose={mockOnClose} />);

      const backdrop = container.querySelector('.bg-black.bg-opacity-50');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Navigation Items', () => {
    it('renders all navigation items', () => {
      render(<MobileNavigation isOpen={true} onClose={jest.fn()} />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Vehicles')).toBeInTheDocument();
      expect(screen.getByText('Parts')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    it('highlights active page', () => {
      (useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        pathname: '/vehicles',
        query: {},
        asPath: '/vehicles',
        route: '/vehicles',
      });

      const { container } = render(<MobileNavigation isOpen={true} onClose={jest.fn()} />);

      // Find the Vehicles link
      const vehiclesLink = screen.getByText('Vehicles').closest('a');
      expect(vehiclesLink).toHaveClass('bg-blue-100', 'text-blue-700');
    });

    it('does not highlight inactive pages', () => {
      (useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        pathname: '/dashboard',
        query: {},
        asPath: '/dashboard',
        route: '/dashboard',
      });

      render(<MobileNavigation isOpen={true} onClose={jest.fn()} />);

      const partsLink = screen.getByText('Parts').closest('a');
      expect(partsLink).toHaveClass('text-gray-700');
      expect(partsLink).not.toHaveClass('bg-blue-100');
    });

    it('calls onClose when navigation item is clicked', () => {
      const mockOnClose = jest.fn();
      render(<MobileNavigation isOpen={true} onClose={mockOnClose} />);

      const dashboardLink = screen.getByText('Dashboard');
      fireEvent.click(dashboardLink);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('User Section', () => {
    it('displays user avatar with initials', () => {
      render(<MobileNavigation isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('displays user name', () => {
      render(<MobileNavigation isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays user email', () => {
      render(<MobileNavigation isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('displays default text when user name is not available', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: '' },
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
      });

      render(<MobileNavigation isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByText('User Account')).toBeInTheDocument();
    });

    it('displays U as avatar when user has no name', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: '' },
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
      });

      render(<MobileNavigation isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByText('U')).toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    it('renders logout button', () => {
      render(<MobileNavigation isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('calls logout, onClose, and navigates to login when logout is clicked', async () => {
      const mockLogout = jest.fn().mockResolvedValue(undefined);
      const mockOnClose = jest.fn();

      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'John Doe' },
        login: jest.fn(),
        logout: mockLogout,
        isLoading: false,
      });

      render(<MobileNavigation isOpen={true} onClose={mockOnClose} />);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Layout', () => {
    it('renders navigation panel with correct width', () => {
      const { container } = render(<MobileNavigation isOpen={true} onClose={jest.fn()} />);
      const panel = container.querySelector('.w-80.max-w-sm');
      expect(panel).toBeInTheDocument();
    });

    it('applies fixed positioning', () => {
      const { container } = render(<MobileNavigation isOpen={true} onClose={jest.fn()} />);
      const wrapper = container.querySelector('.fixed.inset-0.z-50');
      expect(wrapper).toBeInTheDocument();
    });
  });
});

describe('MobileBottomNav', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      pathname: '/dashboard',
      query: {},
      asPath: '/dashboard',
      route: '/dashboard',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all navigation items', () => {
      render(<MobileBottomNav />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Vehicles')).toBeInTheDocument();
      expect(screen.getByText('Parts')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    it('renders with correct layout', () => {
      const { container } = render(<MobileBottomNav />);
      const grid = container.querySelector('.grid.grid-cols-4');
      expect(grid).toBeInTheDocument();
    });

    it('has fixed positioning at bottom', () => {
      const { container } = render(<MobileBottomNav />);
      const nav = container.querySelector('.fixed.bottom-0');
      expect(nav).toBeInTheDocument();
    });

    it('has correct height', () => {
      const { container } = render(<MobileBottomNav />);
      const grid = container.querySelector('.h-16');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('highlights active page', () => {
      (useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        pathname: '/parts',
        query: {},
        asPath: '/parts',
        route: '/parts',
      });

      render(<MobileBottomNav />);

      const partsLink = screen.getByText('Parts').closest('a');
      expect(partsLink).toHaveClass('text-blue-600');
    });

    it('does not highlight inactive pages', () => {
      (useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        pathname: '/dashboard',
        query: {},
        asPath: '/dashboard',
        route: '/dashboard',
      });

      render(<MobileBottomNav />);

      const vehiclesLink = screen.getByText('Vehicles').closest('a');
      expect(vehiclesLink).toHaveClass('text-gray-500');
      expect(vehiclesLink).not.toHaveClass('text-blue-600');
    });
  });

  describe('Navigation Links', () => {
    it('renders correct href for Dashboard', () => {
      render(<MobileBottomNav />);
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('renders correct href for Vehicles', () => {
      render(<MobileBottomNav />);
      const vehiclesLink = screen.getByText('Vehicles').closest('a');
      expect(vehiclesLink).toHaveAttribute('href', '/vehicles');
    });

    it('renders correct href for Parts', () => {
      render(<MobileBottomNav />);
      const partsLink = screen.getByText('Parts').closest('a');
      expect(partsLink).toHaveAttribute('href', '/parts');
    });

    it('renders correct href for Reports', () => {
      render(<MobileBottomNav />);
      const reportsLink = screen.getByText('Reports').closest('a');
      expect(reportsLink).toHaveAttribute('href', '/reports');
    });
  });

  describe('Icons', () => {
    it('renders icons for all navigation items', () => {
      const { container } = render(<MobileBottomNav />);
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBe(4); // One icon for each nav item
    });
  });

  describe('Responsive Design', () => {
    it('only shows on mobile devices', () => {
      const { container } = render(<MobileBottomNav />);
      const nav = container.querySelector('.lg\\:hidden');
      expect(nav).toBeInTheDocument();
    });
  });
});
