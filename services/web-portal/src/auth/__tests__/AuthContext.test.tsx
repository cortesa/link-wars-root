import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock keycloak-js
vi.mock('../keycloak', () => ({
  default: {
    init: vi.fn().mockResolvedValue(false),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    updateToken: vi.fn().mockResolvedValue(true),
    hasRealmRole: vi.fn().mockReturnValue(false),
    tokenParsed: null,
    token: null,
    authenticated: false,
    onTokenExpired: null,
  },
  parseUserFromToken: vi.fn().mockReturnValue(null),
}));

// Test component that consumes the auth context
function TestConsumer() {
  const { isAuthenticated, isLoading, user, login, logout, register } = useAuth();

  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="username">{user?.username || 'anonymous'}</span>
      <button onClick={() => login()}>Login</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => register()}>Register</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with loading state', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Initially loading
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    });

    it('should be unauthenticated after init when no session exists', async () => {
      const keycloak = await import('../keycloak');
      (keycloak.default.init as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      expect(screen.getByTestId('username')).toHaveTextContent('anonymous');
    });
  });

  describe('Login Action', () => {
    it('should call keycloak.login when login is invoked', async () => {
      const keycloak = await import('../keycloak');
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: /login/i }));

      expect(keycloak.default.login).toHaveBeenCalled();
    });
  });

  describe('Logout Action', () => {
    it('should call keycloak.logout when logout is invoked', async () => {
      const keycloak = await import('../keycloak');
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: /logout/i }));

      expect(keycloak.default.logout).toHaveBeenCalled();
    });
  });

  describe('Register Action', () => {
    it('should call keycloak.register when register is invoked', async () => {
      const keycloak = await import('../keycloak');
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: /register/i }));

      expect(keycloak.default.register).toHaveBeenCalled();
    });
  });

  describe('Authenticated State', () => {
    it('should update state when user is authenticated', async () => {
      const keycloak = await import('../keycloak');
      const mockUser = {
        id: 'user-123',
        username: 'testplayer',
        email: 'test@example.com',
        roles: ['player'],
      };

      (keycloak.default.init as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (keycloak.default as { authenticated: boolean }).authenticated = true;
      (keycloak.default as { token: string | null }).token = 'mock-token';
      (keycloak.parseUserFromToken as ReturnType<typeof vi.fn>).mockReturnValue(mockUser);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      expect(screen.getByTestId('username')).toHaveTextContent('testplayer');
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
