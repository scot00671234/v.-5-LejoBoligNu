import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'tenant' | 'landlord';
}

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Only access localStorage if we're in the browser
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('auth_user');
      if (userData) {
        try {
          this.user = JSON.parse(userData);
        } catch {
          this.user = null;
        }
      }
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest('POST', '/api/auth/login', { email, password });
    const data = await response.json();
    
    this.setAuth(data.token, data.user);
    return data;
  }

  async register(name: string, email: string, password: string, role: 'tenant' | 'landlord'): Promise<AuthResponse> {
    const response = await apiRequest('POST', '/api/auth/register', { name, email, password, role });
    const data = await response.json();
    
    this.setAuth(data.token, data.user);
    return data;
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) return null;
    
    try {
      const response = await apiRequest('GET', '/api/auth/me');
      const data = await response.json();
      this.user = data.user;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(this.user));
      }
      return this.user;
    } catch {
      this.logout();
      return null;
    }
  }

  private setAuth(token: string, user: User) {
    this.token = token;
    this.user = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  isLandlord(): boolean {
    return this.user?.role === 'landlord';
  }

  isTenant(): boolean {
    return this.user?.role === 'tenant';
  }
}

export const authService = new AuthService();
