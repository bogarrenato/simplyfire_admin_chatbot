import type { UserProfile } from "@/types/profile";

const PROFILE_ENDPOINT = "https://simplyfire.ai/api/noilezer/profile";

export const PROFILE_FALLBACK: UserProfile = {
  id: "user_123",
  name: "SF",
  email: "contact@hungarospa.hu",
  avatar: "/api/placeholder/150/150",
  bankAccount: "1234567890123456",
  joinDate: new Date("2023-01-15"),
  lastLogin: new Date("2024-01-15T10:30:00"),
  role: "Admin",
  status: "active",
};

interface RemoteProfile {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  bankAccount?: string;
  joinDate?: string;
  lastLogin?: string;
  role?: string;
  status?: string;
}

export const fetchProfile = async (signal?: AbortSignal): Promise<UserProfile> => {
  const response = await fetch(PROFILE_ENDPOINT, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include", // Send session cookies for consistency
    cache: "no-store",
    signal,
  });

  const text = await response.text();
  console.log("Profile API response:", text);

  if (response.status === 401) {
    // Authentication required - trigger login modal
    if (typeof window !== "undefined") {
      const event = new CustomEvent("auth:required");
      window.dispatchEvent(event);
    }
    throw new Error("Authentication required");
  }

  if (!response.ok) {
    throw new Error(text || `Profile API error: ${response.status}`);
  }

  const payload: RemoteProfile = text ? JSON.parse(text) : {};
  return normalizeProfile(payload);
};

const normalizeProfile = (remote: RemoteProfile): UserProfile => {
  return {
    id: remote.id ?? PROFILE_FALLBACK.id,
    name: remote.name ?? PROFILE_FALLBACK.name,
    email: remote.email ?? PROFILE_FALLBACK.email,
    avatar: remote.avatar ?? PROFILE_FALLBACK.avatar,
    bankAccount: remote.bankAccount ?? PROFILE_FALLBACK.bankAccount,
    joinDate: remote.joinDate ? new Date(remote.joinDate) : PROFILE_FALLBACK.joinDate,
    lastLogin: remote.lastLogin ? new Date(remote.lastLogin) : PROFILE_FALLBACK.lastLogin,
    role: remote.role ?? PROFILE_FALLBACK.role,
    status: (remote.status as UserProfile["status"]) ?? PROFILE_FALLBACK.status,
  };
};




