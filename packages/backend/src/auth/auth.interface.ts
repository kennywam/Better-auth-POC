export interface AuthResponse {
  user?: {
    id: string;
    email: string;
    name?: string;
    image?: string | null;
    emailVerified: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
  } | null;
  session?: {
    token: string;
  } | null;
  error?: {
    message: string;
    status?: number;
    statusText?: string;
    details?: any;
  };
  status: boolean;
  message?: string;
  callbackUrl?: string;
}
