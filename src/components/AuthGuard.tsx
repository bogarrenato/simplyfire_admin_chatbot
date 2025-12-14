"use client";

import { useAuth } from "@/contexts/AuthContext";
import LoginModal from "./LoginModal";

/**
 * AuthGuard komponens props típusa
 * children: Az összes komponens, amit védünk (csak bejelentkezés után látható)
 */
interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard komponens - ez védi az alkalmazást, csak bejelentkezés után enged hozzáférést
 * 
 * FLOW:
 * 1. A layout.tsx-ben <AuthGuard> wrap-eli az alkalmazás tartalmát
 * 2. A guard meghívja a useAuth() hook-ot, hogy lekérje az auth állapotot
 * 3. Ha isLoading === true: megjelenít egy "Betöltés..." üzenetet
 * 4. Ha isLoading === false:
 *    - Mindig rendereli a LoginModal-t (ez kezeli a bejelentkezést)
 *    - Csak akkor rendereli a children-t, ha isAuthenticated === true
 * 
 * HASZNÁLAT:
 * - A layout.tsx-ben: <AuthGuard><AppContent /></AuthGuard>
 * - Ha nincs bejelentkezve: csak a LoginModal látszik
 * - Ha be van jelentkezve: a LoginModal is látszik (de lehet hogy rejtve van), és a children is
 * 
 * KAPCSOLAT AuthContext-tel:
 * - useAuth() hook-on keresztül kapja az isAuthenticated és isLoading értékeket
 * - Ezeket az AuthProvider állítja be az auth-service.ts hívások alapján
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  /**
   * useAuth() hook hívása - lekéri az auth állapotot az AuthContext-ből
   * 
   * FLOW:
   * 1. A hook meghívja a useContext(AuthContext)-et
   * 2. Az AuthProvider által beállított értékeket kapja vissza
   * 3. Destructuring-gal kinyeri az isAuthenticated és isLoading értékeket
   * 
   * ÉRTÉKEK:
   * - isAuthenticated: boolean - be van-e jelentkezve (az AuthProvider authenticated state-e)
   * - isLoading: boolean - betöltés alatt van-e (az AuthProvider isLoading state-e)
   */
  const { isAuthenticated, isLoading } = useAuth();

  /**
   * Loading állapot kezelése
   * 
   * FLOW:
   * - Ha még betöltés alatt van (isLoading === true)
   * - Megjelenít egy "Betöltés..." üzenetet
   * - Ez akkor történik, amikor az AuthProvider még ellenőrzi a session-t
   * 
   * MIKOR VAN TRUE:
   * - Az AuthProvider useEffect-je még fut (isAuthenticated() service hívás)
   * - Alapértelmezetten isLoading = true, amíg a useEffect be nem fejeződik
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Betöltés...</div>
      </div>
    );
  }

  /**
   * Fő render logika
   * 
   * FLOW:
   * 1. Mindig rendereli a LoginModal-t
   *    - Ez a modal kezeli a bejelentkezést
   *    - A modal az AuthContext showLoginModal értékét használja a láthatósághoz
   *    - A modal a login függvényt hívja az AuthContext-ből
   * 
   * 2. Feltételesen rendereli a children-t
   *    - Csak akkor, ha isAuthenticated === true
   *    - Ez az alkalmazás fő tartalma (Sidebar, Navbar, stb.)
   * 
   * EREDMÉNY:
   * - Ha nincs bejelentkezve: csak a LoginModal látszik
   * - Ha be van jelentkezve: a LoginModal is látszik (de lehet hogy rejtve van), és a children is
   * 
   * ADATÁTVÉTEL:
   * - LoginModal kapja az AuthContext értékeit a useAuth() hook-on keresztül
   * - children komponensek szintén elérhetik az AuthContext-et useAuth()-val
   */
  return (
    <>
      {/* LoginModal - mindig renderelve, de a showLoginModal state alapján látható/rejtett */}
      <LoginModal />
      
      {/* Children - csak bejelentkezés után látható */}
      {/* Ha isAuthenticated === true, akkor rendereli a children-t */}
      {/* Ha isAuthenticated === false, akkor nem rendereli (undefined/null) */}
      {isAuthenticated && children}
    </>
  );
};

export default AuthGuard;

