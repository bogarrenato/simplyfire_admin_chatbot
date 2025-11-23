export type UserStatus = "active" | "inactive" | "suspended";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bankAccount: string;
  joinDate: Date;
  lastLogin: Date;
  role: string;
  status: UserStatus;
}




