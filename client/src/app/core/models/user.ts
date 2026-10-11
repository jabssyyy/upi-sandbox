export type Role = 'user' | 'admin';

// The profile the API returns. Never contains the password hash.
export interface User {
  id: string;
  name: string;
  email: string;
  upiId: string;
  role: Role;
  balance: number; // paise
}

// A user as it appears inside a transaction (after the server's populate()).
export interface UserRef {
  _id: string;
  name: string;
  upiId: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Wallet {
  balance: number; // paise
  todaySpent: number; // paise
}
