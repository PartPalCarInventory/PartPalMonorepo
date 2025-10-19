import { render, screen, fireEvent, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import Login from './login';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock Next.js Head component
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Mock AuthContext
jest.mock('../contexts/AuthContext');

const mockPush = jest.fn();
const mockLogin = jest.fn();
const mockRouter = {
  push: mockPush,
  pathname: '/login',
  query: {},
  asPath: '/login',
};

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Login Page', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockPush.mockClear();
    mockLogin.mockClear();

    mockUseAuth.mockReturnValue({
      user: null,
      login: mockLogin,
      logout: jest.fn(),
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders login form correctly', () => {
    render(<Login />);

    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('displays demo credentials', () => {
    render(<Login />);

    expect(screen.getByText('Demo Credentials')).toBeInTheDocument();
    expect(screen.getByText(/demo@partpal.co.za/i)).toBeInTheDocument();
    expect(screen.getByText(/demo123/i)).toBeInTheDocument();
  });

  it('shows validation error for empty fields', async () => {
    render(<Login />);

    const form = screen.getByRole('button', { name: /sign in/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    render(<Login />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const form = screen.getByRole('button', { name: /sign in/i }).closest('form')!;

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('successfully logs in with valid credentials', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    render(<Login />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'demo@partpal.co.za' } });
    fireEvent.change(passwordInput, { target: { value: 'demo123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('demo@partpal.co.za', 'demo123');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message on login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid email or password'));

    render(<Login />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows loading state during login', async () => {
    mockLogin.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(undefined), 100)
        )
    );

    render(<Login />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'demo@partpal.co.za' } });
    fireEvent.change(passwordInput, { target: { value: 'demo123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });

    expect(submitButton).toBeDisabled();
  });

  it('has a link to signup page', () => {
    render(<Login />);

    const signupLink = screen.getByRole('link', { name: /create a new account/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute('href', '/signup');
  });

  it('allows user to type in form fields', async () => {
    const user = userEvent.setup();

    render(<Login />);

    const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'testpassword');

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('testpassword');
  });
});
