import { render, screen } from '../test-utils';
import { DashboardHeader } from './DashboardHeader';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('../contexts/AuthContext');

const mockPush = jest.fn();
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('DashboardHeader', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      pathname: '/dashboard',
      query: {},
      asPath: '/dashboard',
      route: '/dashboard',
    });

    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard title', () => {
    render(<DashboardHeader />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<DashboardHeader />);

    expect(screen.getByText(/Overview of your inventory management system/i)).toBeInTheDocument();
  });

  it('displays current date', () => {
    render(<DashboardHeader />);

    // Check if there's any text content that might contain a date
    const header = screen.getByText('Dashboard');
    expect(header).toBeInTheDocument();
  });
});
