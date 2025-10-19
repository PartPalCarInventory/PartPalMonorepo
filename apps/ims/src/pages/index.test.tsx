import { render, screen } from '../test-utils';
import Home from './index';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock Next.js Head component
jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock AuthContext
jest.mock('../contexts/AuthContext');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockPush = jest.fn();

describe('Home Page', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      pathname: '/',
      query: {},
      asPath: '/',
      route: '/',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: true,
        isAuthenticated: false,
      });

      render(<Home />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    it('shows redirecting message when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        isAuthenticated: true,
      });

      render(<Home />);

      expect(screen.getByText('Redirecting to dashboard...')).toBeInTheDocument();
    });

    it('redirects to dashboard when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        isAuthenticated: true,
      });

      render(<Home />);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Unauthenticated State (Landing Page)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        isAuthenticated: false,
      });
    });

    it('renders navigation with logo', () => {
      render(<Home />);

      expect(screen.getByText('PartPal IMS')).toBeInTheDocument();
    });

    it('renders navigation links', () => {
      render(<Home />);

      const loginLinks = screen.getAllByText('Login');
      const signupLinks = screen.getAllByText(/Sign Up|Sign In/);

      expect(loginLinks.length).toBeGreaterThan(0);
      expect(signupLinks.length).toBeGreaterThan(0);
    });

    it('renders hero section with title', () => {
      render(<Home />);

      expect(screen.getByText('Manage Your Auto Parts')).toBeInTheDocument();
      expect(screen.getByText('Inventory with Ease')).toBeInTheDocument();
    });

    it('renders hero description', () => {
      render(<Home />);

      expect(
        screen.getByText(/Complete inventory management system for South African scrap yards/)
      ).toBeInTheDocument();
    });

    it('renders CTA buttons', () => {
      render(<Home />);

      expect(screen.getByText('Get Started Free')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('renders feature cards', () => {
      render(<Home />);

      expect(screen.getByText('Vehicle Management')).toBeInTheDocument();
      expect(screen.getByText('Parts Inventory')).toBeInTheDocument();
      expect(screen.getByText('Sales & Analytics')).toBeInTheDocument();
    });

    it('renders vehicle management feature description', () => {
      render(<Home />);

      expect(
        screen.getByText(/Track all vehicles in your yard with VIN-based system/)
      ).toBeInTheDocument();
    });

    it('renders parts inventory feature description', () => {
      render(<Home />);

      expect(
        screen.getByText(/Comprehensive parts tracking with condition, location, pricing/)
      ).toBeInTheDocument();
    });

    it('renders sales analytics feature description', () => {
      render(<Home />);

      expect(
        screen.getByText(/Track sales, revenue, and inventory trends/)
      ).toBeInTheDocument();
    });

    it('renders login link with correct href', () => {
      render(<Home />);

      const loginLinks = screen.getAllByRole('link').filter(
        link => link.getAttribute('href') === '/login'
      );
      expect(loginLinks.length).toBeGreaterThan(0);
    });

    it('renders signup link with correct href', () => {
      render(<Home />);

      const signupLinks = screen.getAllByRole('link').filter(
        link => link.getAttribute('href') === '/signup'
      );
      expect(signupLinks.length).toBeGreaterThan(0);
    });
  });
});
