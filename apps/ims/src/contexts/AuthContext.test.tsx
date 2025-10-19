import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { ReactNode } from 'react';

// Mock fetch globally
global.fetch = jest.fn();

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('useAuth Hook', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress error output for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });

    it('returns auth context when used within AuthProvider', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
        expect(result.current.user).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isAuthenticated).toBe(false);
      });
    });
  });

  describe('AuthProvider', () => {
    describe('Initial Session Check', () => {
      it('checks for existing session on mount', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user: { id: '1', email: 'test@example.com', name: 'Test User' },
          }),
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        // Initially loading
        expect(result.current.isLoading).toBe(true);

        // Wait for session check
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/auth/session');
        expect(result.current.user).toEqual({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        });
        expect(result.current.isAuthenticated).toBe(true);
      });

      it('handles session check failure gracefully', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      });

      it('handles session check error gracefully', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Session check failed:',
          expect.any(Error)
        );
      });
    });

    describe('Login', () => {
      it('successfully logs in user', async () => {
        // Mock session check
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        // Mock login
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user: { id: '1', email: 'test@example.com', name: 'Test User' },
          }),
        });

        await act(async () => {
          await result.current.login('test@example.com', 'password123');
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        });

        expect(result.current.user).toEqual({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        });
        expect(result.current.isAuthenticated).toBe(true);
      });

      it('throws error on login failure', async () => {
        // Mock session check
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        // Mock failed login
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Invalid credentials' }),
        });

        await expect(async () => {
          await act(async () => {
            await result.current.login('test@example.com', 'wrong-password');
          });
        }).rejects.toThrow('Invalid credentials');

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      });

      it('throws generic error when no error message provided', async () => {
        // Mock session check
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        // Mock failed login without error message
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        await expect(async () => {
          await act(async () => {
            await result.current.login('test@example.com', 'wrong-password');
          });
        }).rejects.toThrow('Login failed');
      });
    });

    describe('Signup', () => {
      it('successfully signs up user', async () => {
        // Mock session check
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        // Mock signup
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user: { id: '1', email: 'new@example.com', name: 'New User' },
          }),
        });

        await act(async () => {
          await result.current.signup(
            'new@example.com',
            'password123',
            'New User',
            'My Business'
          );
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'new@example.com',
            password: 'password123',
            name: 'New User',
            businessName: 'My Business',
          }),
        });

        expect(result.current.user).toEqual({
          id: '1',
          email: 'new@example.com',
          name: 'New User',
        });
        expect(result.current.isAuthenticated).toBe(true);
      });

      it('throws error on signup failure', async () => {
        // Mock session check
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        // Mock failed signup
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Email already exists' }),
        });

        await expect(async () => {
          await act(async () => {
            await result.current.signup(
              'existing@example.com',
              'password123',
              'User',
              'Business'
            );
          });
        }).rejects.toThrow('Email already exists');

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      });

      it('throws generic error when no error message provided', async () => {
        // Mock session check
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        // Mock failed signup without error message
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        await expect(async () => {
          await act(async () => {
            await result.current.signup('test@example.com', 'pass', 'Name', 'Business');
          });
        }).rejects.toThrow('Signup failed');
      });
    });

    describe('Logout', () => {
      it('successfully logs out user', async () => {
        // Mock session check with logged in user
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user: { id: '1', email: 'test@example.com', name: 'Test User' },
          }),
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(result.current.user).not.toBeNull();
        });

        // Mock logout
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        await act(async () => {
          await result.current.logout();
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
          method: 'POST',
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      });

      it('clears user even if logout API call fails', async () => {
        // Mock session check with logged in user
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user: { id: '1', email: 'test@example.com', name: 'Test User' },
          }),
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(result.current.user).not.toBeNull();
        });

        // Mock failed logout
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await act(async () => {
          await result.current.logout();
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error));
      });
    });

    describe('RefreshUser', () => {
      it('refreshes user session', async () => {
        // Mock initial session check
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.user).toBeNull();

        // Mock refresh with updated user data
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user: { id: '1', email: 'updated@example.com', name: 'Updated User' },
          }),
        });

        await act(async () => {
          await result.current.refreshUser();
        });

        expect(result.current.user).toEqual({
          id: '1',
          email: 'updated@example.com',
          name: 'Updated User',
        });
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    describe('isAuthenticated', () => {
      it('returns false when user is null', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      });

      it('returns true when user is set', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user: { id: '1', email: 'test@example.com', name: 'Test User' },
          }),
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(result.current.user).not.toBeNull();
        });

        expect(result.current.isAuthenticated).toBe(true);
      });
    });
  });
});
