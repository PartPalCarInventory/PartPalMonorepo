import { render, screen, fireEvent, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import Signup from './signup';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Mock AuthContext
jest.mock('../contexts/AuthContext');

const mockPush = jest.fn();
const mockSignup = jest.fn();
const mockRouter = {
  push: mockPush,
  pathname: '/signup',
  query: {},
  asPath: '/signup',
  route: '/signup',
};

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Signup Page', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockPush.mockClear();
    mockSignup.mockClear();

    mockUseAuth.mockReturnValue({
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      signup: mockSignup,
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders signup form correctly', () => {
    render(<Signup />);

    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Business Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows validation error for empty required fields', async () => {
    render(<Signup />);

    const form = screen.getByRole('button', { name: /create account/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    render(<Signup />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByLabelText(/Business Name/i), { target: { value: 'Test Parts' } });
    fireEvent.change(screen.getByLabelText(/^Password \*/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });

    const form = screen.getByRole('button', { name: /create account/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('shows validation error for password too short', async () => {
    render(<Signup />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Business Name/i), { target: { value: 'Test Parts' } });
    fireEvent.change(screen.getByLabelText(/^Password \*/i), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'short' } });

    const form = screen.getByRole('button', { name: /create account/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });
  });

  it('shows validation error for password mismatch', async () => {
    render(<Signup />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Business Name/i), { target: { value: 'Test Parts' } });
    fireEvent.change(screen.getByLabelText(/^Password \*/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'different123' } });

    const form = screen.getByRole('button', { name: /create account/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('shows validation error when terms not accepted', async () => {
    render(<Signup />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Business Name/i), { target: { value: 'Test Parts' } });
    fireEvent.change(screen.getByLabelText(/^Password \*/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });

    const form = screen.getByRole('button', { name: /create account/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Please accept the terms and conditions')).toBeInTheDocument();
    });
  });

  it('successfully signs up with valid data', async () => {
    mockSignup.mockResolvedValueOnce(undefined);

    render(<Signup />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Business Name/i), { target: { value: 'Test Parts' } });
    fireEvent.change(screen.getByLabelText(/^Password \*/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });

    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('john@example.com', 'password123', 'John Doe', 'Test Parts');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message on signup failure', async () => {
    mockSignup.mockRejectedValueOnce(new Error('Email already exists'));

    render(<Signup />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Business Name/i), { target: { value: 'Test Parts' } });
    fireEvent.change(screen.getByLabelText(/^Password \*/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });

    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows loading state during signup', async () => {
    mockSignup.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(undefined), 100)
        )
    );

    render(<Signup />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Business Name/i), { target: { value: 'Test Parts' } });
    fireEvent.change(screen.getByLabelText(/^Password \*/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });

    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Creating account...')).toBeInTheDocument();
    });

    expect(submitButton).toBeDisabled();
  });

  it('has a link to login page', () => {
    render(<Signup />);

    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('displays benefits section', () => {
    render(<Signup />);

    expect(screen.getByText('What you get')).toBeInTheDocument();
    expect(screen.getByText(/Complete inventory management system/i)).toBeInTheDocument();
    expect(screen.getByText(/List parts on PartPal Marketplace/i)).toBeInTheDocument();
    expect(screen.getByText(/Analytics and sales reporting/i)).toBeInTheDocument();
  });
});
