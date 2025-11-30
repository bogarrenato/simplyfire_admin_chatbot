const AUTH_STORAGE_KEY = "auth_authenticated";
const API_BASE_URL = "https://simplyfire.ai:5001/api/noilezer";

export interface LoginResponse {
  success: boolean;
  message?: string;
}

export const login = async (credential: string): Promise<LoginResponse> => {
  try {
    const formData = new FormData();
    formData.append("credential", credential);

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (response.status === 200) {
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      return { success: true };
    }

    if (response.status === 403) {
      return { success: false, message: "Helytelen jelszó" };
    }

    return { success: false, message: "Bejelentkezési hiba történt" };
  } catch (error) {
    return { success: false, message: "Hálózati hiba történt" };
  }
};

export const logout = async (): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    // Ignore errors
  } finally {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_STORAGE_KEY) === "true";
};

export const clearAuthState = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

