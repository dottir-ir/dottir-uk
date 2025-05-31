import { supabase } from '../../lib/supabase';
import { User } from '../../types';
import { generateTOTP, verifyTOTP } from 'otplib';
import { generateBackupCodes } from '../../utils/auth';

function browserRandomUUID() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Polyfill for browsers that do not support crypto.randomUUID
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  // Set version bits (4) and variant bits (10)
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface SessionInfo {
  id: string;
  deviceInfo: any;
  lastActivity: Date;
  ipAddress: string;
}

export const authService = {
  // MFA Methods
  async setupMFA(userId: string): Promise<MFASetup> {
    const secret = generateTOTP.generateSecret();
    const backupCodes = generateBackupCodes(8);

    const { error } = await supabase
      .from('users')
      .update({
        mfa_secret: secret,
        mfa_backup_codes: backupCodes,
      })
      .eq('id', userId);

    if (error) throw error;

    const qrCode = `otpauth://totp/Dottir:${userId}?secret=${secret}&issuer=Dottir`;

    return {
      secret,
      qrCode,
      backupCodes,
    };
  },

  async verifyMFA(userId: string, token: string): Promise<boolean> {
    const { data: user, error } = await supabase
      .from('users')
      .select('mfa_secret, mfa_backup_codes')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Check if token is a backup code
    if (user.mfa_backup_codes.includes(token)) {
      // Remove used backup code
      await supabase
        .from('users')
        .update({
          mfa_backup_codes: user.mfa_backup_codes.filter((code: string) => code !== token),
        })
        .eq('id', userId);
      return true;
    }

    // Verify TOTP token
    return verifyTOTP({
      token,
      secret: user.mfa_secret,
    });
  },

  async enableMFA(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ mfa_enabled: true })
      .eq('id', userId);

    if (error) throw error;
  },

  async disableMFA(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        mfa_enabled: false,
        mfa_secret: null,
        mfa_backup_codes: null,
      })
      .eq('id', userId);

    if (error) throw error;
  },

  // Session Management
  async createSession(userId: string, deviceInfo: any, ipAddress: string): Promise<string> {
    const token = browserRandomUUID();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30-minute session

    const { error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt,
        last_activity_at: new Date(),
        device_info: deviceInfo,
        ip_address: ipAddress,
      });

    if (error) throw error;
    return token;
  },

  async validateSession(token: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) return false;

    // Check if session is expired
    if (new Date(data.expires_at) < new Date()) {
      await this.deleteSession(token);
      return false;
    }

    // Update last activity
    await supabase
      .from('sessions')
      .update({ last_activity_at: new Date() })
      .eq('token', token);

    return true;
  },

  async deleteSession(token: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('token', token);

    if (error) throw error;
  },

  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return data.map(session => ({
      id: session.id,
      deviceInfo: session.device_info,
      lastActivity: new Date(session.last_activity_at),
      ipAddress: session.ip_address,
    }));
  },

  // SSO Methods
  async getSSOProviders(): Promise<any[]> {
    const { data, error } = await supabase
      .from('sso_providers')
      .select('*')
      .eq('enabled', true);

    if (error) throw error;
    return data;
  },

  async initiateSSO(providerId: string): Promise<string> {
    const { data: provider, error } = await supabase
      .from('sso_providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (error) throw error;

    // Generate state parameter for CSRF protection
    const state = browserRandomUUID();
    
    // Store state in session storage
    sessionStorage.setItem('sso_state', state);

    // Construct authorization URL
    const params = new URLSearchParams({
      client_id: provider.client_id,
      redirect_uri: provider.redirect_uri,
      response_type: 'code',
      scope: provider.scopes.join(' '),
      state,
    });

    return `${provider.authorization_url}?${params.toString()}`;
  },

  async handleSSOCallback(providerId: string, code: string, state: string): Promise<User> {
    // Verify state parameter
    const storedState = sessionStorage.getItem('sso_state');
    if (state !== storedState) {
      throw new Error('Invalid state parameter');
    }
    sessionStorage.removeItem('sso_state');

    const { data: provider, error: providerError } = await supabase
      .from('sso_providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (providerError) throw providerError;

    // Exchange code for tokens
    const tokenResponse = await fetch(provider.token_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: provider.redirect_uri,
        client_id: provider.client_id,
        client_secret: provider.client_secret,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Get user info from provider
    const userInfoResponse = await fetch(provider.userinfo_url, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userInfo = await userInfoResponse.json();

    // Find or create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userInfo.email)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    if (!user) {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            email: userInfo.email,
            full_name: userInfo.name,
            avatar_url: userInfo.picture,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;
      return newUser;
    }

    // Update SSO connection
    await supabase
      .from('user_sso_connections')
      .upsert({
        user_id: user.id,
        provider_id: providerId,
        provider_user_id: userInfo.sub,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000),
      });

    return user;
  },
}; 