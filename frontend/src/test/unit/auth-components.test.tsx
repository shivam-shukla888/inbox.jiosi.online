import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignInModal } from '../../components/auth/SignInModal';
import { AuthPage } from '../../components/auth/AuthPage';
import { ProfileMenu } from '../../components/profile/ProfileMenu';
import { apiClient } from '../../api/client';

describe('Authentication Components & Google OIDC Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('SignInModal', () => {
    it('renders the secure Google Sign-In action and branding', () => {
      render(
        <SignInModal
          isOpen={true}
          onClose={vi.fn()}
          onExploreDemo={vi.fn()}
        />
      );

      expect(screen.getByText('JIOSI Inbox')).toBeInTheDocument();
      expect(screen.getAllByText('by Shivsastra').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Sign in with your Google account')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /explore in simulation preview/i })).toBeInTheDocument();
      expect(screen.getByText('Google OpenID Connect')).toBeInTheDocument();
    });

    it('triggers onGoogleSignIn when Google button is clicked', () => {
      const handleGoogle = vi.fn();
      render(
        <SignInModal
          isOpen={true}
          onClose={vi.fn()}
          onGoogleSignIn={handleGoogle}
          onExploreDemo={vi.fn()}
        />
      );

      const googleBtn = screen.getByRole('button', { name: /continue with google/i });
      fireEvent.click(googleBtn);

      expect(handleGoogle).toHaveBeenCalledTimes(1);
    });

    it('renders authError message when provided', () => {
      render(
        <SignInModal
          isOpen={true}
          onClose={vi.fn()}
          authError="Google authentication was cancelled"
          onExploreDemo={vi.fn()}
        />
      );

      expect(screen.getByText('Google authentication was cancelled')).toBeInTheDocument();
    });

    it('triggers onExploreDemo when Simulation Preview is selected', () => {
      const handleDemo = vi.fn();
      const handleClose = vi.fn();
      render(
        <SignInModal
          isOpen={true}
          onClose={handleClose}
          onExploreDemo={handleDemo}
        />
      );

      const demoBtn = screen.getByRole('button', { name: /explore in simulation preview/i });
      fireEvent.click(demoBtn);

      expect(handleDemo).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not render when isOpen is false', () => {
      render(
        <SignInModal
          isOpen={false}
          onClose={vi.fn()}
          onExploreDemo={vi.fn()}
        />
      );

      expect(screen.queryByText('JIOSI Inbox')).not.toBeInTheDocument();
    });
  });

  describe('AuthPage (Full-Screen Authentication Gate)', () => {
    it('renders the complete premium auth screen with branding and value pillars', () => {
      render(
        <AuthPage
          onGoogleSignIn={vi.fn()}
          onExploreDemo={vi.fn()}
        />
      );

      expect(screen.getAllByText('JIOSI Inbox').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('by Shivsastra').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Your inbox,')).toBeInTheDocument();
      expect(screen.getByText('intelligently organized.')).toBeInTheDocument();
      expect(screen.getByText('One Focused Workspace')).toBeInTheDocument();
      expect(screen.getByText('Clear Email Priorities')).toBeInTheDocument();
      expect(screen.getByText('Secure Account Access')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /explore in simulation preview/i })).toBeInTheDocument();
      expect(screen.getAllByText(/Google OpenID Connect/i).length).toBeGreaterThanOrEqual(1);
    });

    it('triggers onGoogleSignIn when Continue with Google is clicked', () => {
      const handleGoogle = vi.fn();
      render(
        <AuthPage
          onGoogleSignIn={handleGoogle}
          onExploreDemo={vi.fn()}
        />
      );

      const googleBtn = screen.getByRole('button', { name: /continue with google/i });
      fireEvent.click(googleBtn);
      expect(handleGoogle).toHaveBeenCalledTimes(1);
    });

    it('displays error banner with dismiss action when error is provided', () => {
      const handleClear = vi.fn();
      render(
        <AuthPage
          onGoogleSignIn={vi.fn()}
          onExploreDemo={vi.fn()}
          error="OAuth client configuration is invalid"
          onClearError={handleClear}
        />
      );

      expect(screen.getByText('OAuth client configuration is invalid')).toBeInTheDocument();
      const dismissBtn = screen.getByText('Dismiss and retry');
      fireEvent.click(dismissBtn);
      expect(handleClear).toHaveBeenCalledTimes(1);
    });

    it('triggers onExploreDemo when clicking Explore in Simulation Preview', () => {
      const handleDemo = vi.fn();
      render(
        <AuthPage
          onGoogleSignIn={vi.fn()}
          onExploreDemo={handleDemo}
        />
      );

      const demoBtn = screen.getByRole('button', { name: /explore in simulation preview/i });
      fireEvent.click(demoBtn);
      expect(handleDemo).toHaveBeenCalledTimes(1);
    });
  });

  describe('ProfileMenu Dynamic User Presentation', () => {
    it('renders dynamic user credentials and role from authenticated session', () => {
      const mockUser = {
        fullName: 'Sarah Connor',
        email: 'sarah.connor@sky.net',
        role: 'OWNER',
      };

      render(
        <ProfileMenu
          isDark={false}
          onToggleTheme={vi.fn()}
          onOpenSettings={vi.fn()}
          onOpenShortcuts={vi.fn()}
          onSignOut={vi.fn()}
          user={mockUser}
        />
      );

      // Trigger avatar button
      const avatarBtn = screen.getByRole('button', { name: /user account menu/i });
      expect(avatarBtn).toHaveTextContent('SC');

      fireEvent.click(avatarBtn);

      expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
      expect(screen.getByText('sarah.connor@sky.net')).toBeInTheDocument();
      expect(screen.getByText(/OWNER · Team Tier/i)).toBeInTheDocument();
    });

    it('renders Simulation Sandbox label and Exit Preview button in demo mode', () => {
      const handleSignOut = vi.fn();
      render(
        <ProfileMenu
          isDark={false}
          onToggleTheme={vi.fn()}
          onOpenSettings={vi.fn()}
          onOpenShortcuts={vi.fn()}
          onSignOut={handleSignOut}
          isDemoMode={true}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /user account menu/i }));
      expect(screen.getByText('Simulation Sandbox')).toBeInTheDocument();
      expect(screen.getByText('demo@simulation.preview')).toBeInTheDocument();
      expect(screen.getByText('Exit Preview & Sign In')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /exit preview & sign in/i }));
      expect(handleSignOut).toHaveBeenCalledTimes(1);
    });

    it('calls onSignOut when clicking Sign Out in profile menu', () => {
      const handleSignOut = vi.fn();
      render(
        <ProfileMenu
          isDark={false}
          onToggleTheme={vi.fn()}
          onOpenSettings={vi.fn()}
          onOpenShortcuts={vi.fn()}
          onSignOut={handleSignOut}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /user account menu/i }));
      const signOutBtn = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(signOutBtn);

      expect(handleSignOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('ApiClient Authentication API', () => {
    it('constructs correct Google OAuth redirect authorization URL', () => {
      const url = apiClient.getGoogleOAuthUrl();
      expect(url).toContain('/oauth2/authorization/google');
    });

    it('calls loginWithGoogle and updates auth state', async () => {
      const mockAuthData = {
        token: 'signed-jwt-token-xyz',
        userId: 'user-uuid-1',
        email: 'verified@jiosi.online',
        fullName: 'Verified User',
        avatarUrl: '',
        defaultWorkspaceId: 'ws-uuid-1',
        defaultWorkspaceName: "Verified User's Workspace",
        role: 'OWNER',
      };

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            message: 'Authenticated',
            data: mockAuthData,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await apiClient.loginWithGoogle('google-id-token-sample');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/google'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ idToken: 'google-id-token-sample' }),
        })
      );
      expect(result.email).toBe('verified@jiosi.online');
      expect(apiClient.getAuthToken()).toBe('signed-jwt-token-xyz');
      expect(apiClient.getWorkspaceId()).toBe('ws-uuid-1');
    });

    it('calls logout and clears stored session token', async () => {
      apiClient.setAuthToken('temp-session-token');
      expect(apiClient.getAuthToken()).toBe('temp-session-token');

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      await apiClient.logout();

      expect(apiClient.getAuthToken()).toBeNull();
    });
  });
});
