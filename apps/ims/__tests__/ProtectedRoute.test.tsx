import { render, screen } from '../test-utils';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

jest.mock('../contexts/AuthContext');
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('ProtectedRoute', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockUseRouter = useRouter as jest.Mock;
  const mockUseAuth = useAuth as jest.Mock;

  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      pathname: '/dashboard',
      asPath: '/dashboard',
      query: {},
      route: '/dashboard',
    });
  });

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'test@example.com' },
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows loading state while checking authentication', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // When loading, children should not be rendered
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(mockReplace).toHaveBeenCalledWith('/login?returnUrl=%2Fdashboard');
  });
});
