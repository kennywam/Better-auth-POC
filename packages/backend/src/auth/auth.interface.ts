export interface AuthResponse {
  user?: {
    id: string;
    email: string;
    name?: string;
    image?: string;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  session?: {
    token: string;
  };
  status: boolean;
  message?: string;
}
