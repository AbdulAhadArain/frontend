export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  plan: 'FREE' | 'CREATOR' | null;
  analysesThisMonth: number;
  googleId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  mustChangeCredentials: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface ApiSuccessResponse<T> {
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  error: string;
  message: string[];
  statusCode: number;
}
