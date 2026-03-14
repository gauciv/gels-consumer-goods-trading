export type UserRole = 'collector' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  session: {
    access_token: string;
    refresh_token: string;
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
