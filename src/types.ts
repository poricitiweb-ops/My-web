export interface UserProfile {
  userId: string;
  name: string;
  bio?: string;
  photoURL?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  socialLinks: { platform: string; value: string }[];
  paymentStatus: 'pending' | 'paid';
  senderNumber?: string;
  lastTrxId?: string;
  paymentDate?: any;
  expiryDate?: string;
  views?: number;
  isSuspended?: boolean;
  isVerified?: boolean;
  createdAt: any;
  updatedAt: any;
}
