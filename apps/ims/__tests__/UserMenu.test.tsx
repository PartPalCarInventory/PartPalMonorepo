import { render, screen, fireEvent, waitFor } from '../test-utils';
import { useAuth } from '../contexts/AuthContext';

// Mock the hooks before importing the component
jest.mock('../contexts/AuthContext');

const mockPush = jest.fn();
const mockLogout = jest.fn();

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    pathname: '/dashboard',
    route: '/dashboard',
    query: {},
    asPath: '/dashboard',
  })),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Import component after mocks are set up
import { UserMenu } from './UserMenu';

describe('UserMenu', () => {
  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'seller' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      login: jest.fn(),
      isLoading: false,
    });
  });

  describe('Rendering', () => {
    it('renders nothing when user is null', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        logout: mockLogout,
        login: jest.fn(),
        isLoading: false,
      });

      const { container } = render(<UserMenu />);
      expect(container.firstChild).toBeNull();
    });

    it('renders user button when user is present', () => {
      render(<UserMenu />);

      expect(screen.getByText('J')).toBeInTheDocument(); // First letter of name
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('seller')).toBeInTheDocument();
    });

    it('displays user initial in avatar', () => {
      render(<UserMenu />);

      const avatar = screen.getByText('J');
      expect(avatar).toHaveClass('text-white', 'font-medium');
    });

    it('does not show dropdown menu initially', () => {
      render(<UserMenu />);

      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });
  });

  describe('Menu Toggle', () => {
    it('opens dropdown menu when button is clicked', () => {
      render(<UserMenu />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Vehicles')).toBeInTheDocument();
      expect(screen.getByText('Parts')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('closes dropdown menu when button is clicked again', () => {
      render(<UserMenu />);

      const button = screen.getByRole('button');

      // Open
      fireEvent.click(button);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // Close
      fireEvent.click(button);
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it('rotates chevron icon when menu is open', () => {
      const { container } = render(<UserMenu />);

      const button = screen.getByRole('button');
      const chevron = container.querySelector('svg.transition-transform');

      expect(chevron).not.toHaveClass('rotate-180');

      fireEvent.click(button);

      expect(chevron).toHaveClass('rotate-180');
    });
  });

  describe('Dropdown Content', () => {
    beforeEach(() => {
      render(<UserMenu />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
    });

    it('displays user information in dropdown', () => {
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('renders all navigation menu items', () => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Vehicles')).toBeInTheDocument();
      expect(screen.getByText('Parts')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    it('renders logout button', () => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      render(<UserMenu />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
    });

    it('navigates to dashboard when Dashboard is clicked', () => {
      const dashboardButton = screen.getAllByRole('button').find(
        btn => btn.textContent?.includes('Dashboard')
      );

      fireEvent.click(dashboardButton!);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('navigates to vehicles when Vehicles is clicked', () => {
      const vehiclesButton = screen.getAllByRole('button').find(
        btn => btn.textContent?.includes('Vehicles')
      );

      fireEvent.click(vehiclesButton!);

      expect(mockPush).toHaveBeenCalledWith('/vehicles');
    });

    it('navigates to parts when Parts is clicked', () => {
      const partsButton = screen.getAllByRole('button').find(
        btn => btn.textContent?.includes('Parts')
      );

      fireEvent.click(partsButton!);

      expect(mockPush).toHaveBeenCalledWith('/parts');
    });

    it('navigates to reports when Reports is clicked', () => {
      const reportsButton = screen.getAllByRole('button').find(
        btn => btn.textContent?.includes('Reports')
      );

      fireEvent.click(reportsButton!);

      expect(mockPush).toHaveBeenCalledWith('/reports');
    });

    it('closes menu after navigation', () => {
      const dashboardButton = screen.getAllByRole('button').find(
        btn => btn.textContent?.includes('Dashboard')
      );

      fireEvent.click(dashboardButton!);

      // Menu should close - check that email (only in dropdown) is not visible
      expect(screen.queryByText('john@example.com')).not.toBeInTheDocument();
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      render(<UserMenu />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
    });

    it('calls logout function when Logout is clicked', async () => {
      mockLogout.mockResolvedValue(undefined);

      const logoutButton = screen.getAllByRole('button').find(
        btn => btn.textContent?.includes('Logout')
      );

      fireEvent.click(logoutButton!);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });

    it('navigates to login page after logout', async () => {
      mockLogout.mockResolvedValue(undefined);

      const logoutButton = screen.getAllByRole('button').find(
        btn => btn.textContent?.includes('Logout')
      );

      fireEvent.click(logoutButton!);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Click Outside', () => {
    it('closes menu when clicking outside', () => {
      render(<UserMenu />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // Simulate clicking outside
      fireEvent.mouseDown(document.body);

      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it('does not close menu when clicking inside', () => {
      render(<UserMenu />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // Click on the dropdown itself
      const dropdown = screen.getByText('john@example.com');
      fireEvent.mouseDown(dropdown);

      // Menu should still be open
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('User Name Variations', () => {
    it('handles lowercase names correctly', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, name: 'jane smith' },
        logout: mockLogout,
        login: jest.fn(),
        isLoading: false,
      });

      render(<UserMenu />);

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('handles single character names', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, name: 'A' },
        logout: mockLogout,
        login: jest.fn(),
        isLoading: false,
      });

      render(<UserMenu />);

      expect(screen.getAllByText('A').length).toBeGreaterThan(0);
    });
  });

  describe('Styling', () => {
    it('applies correct avatar styles', () => {
      render(<UserMenu />);

      const avatar = screen.getByText('J').parentElement;
      expect(avatar).toHaveClass('h-9', 'w-9', 'rounded-full', 'bg-blue-600');
    });

    it('applies hover styles to dropdown items', () => {
      render(<UserMenu />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const dashboardButton = screen.getAllByRole('button').find(
        btn => btn.textContent?.includes('Dashboard')
      );

      expect(dashboardButton).toHaveClass('hover:bg-gray-100');
    });

    it('applies special styling to logout button', () => {
      render(<UserMenu />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const logoutButton = screen.getAllByRole('button').find(
        btn => btn.textContent?.includes('Logout')
      );

      expect(logoutButton).toHaveClass('text-red-700', 'hover:bg-red-50');
    });
  });

  describe('Icons', () => {
    it('renders icons for all menu items', () => {
      const { container } = render(<UserMenu />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      const icons = container.querySelectorAll('svg');
      // Should have: chevron + dashboard + vehicles + parts + reports + logout
      expect(icons.length).toBeGreaterThanOrEqual(5);
    });
  });
});
