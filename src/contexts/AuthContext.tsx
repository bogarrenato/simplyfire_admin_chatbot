"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { login as authLogin, logout as authLogout, isAuthenticated, clearAuthState } from "@/services/auth-service";

/**
 * AuthContext típus definíciója - ez határozza meg, milyen adatokat és függvényeket
 * lehet elérni a context-ből a useAuth hook-on keresztül
 */
interface AuthContextType {
  isAuthenticated: boolean;        // Be van-e jelentkezve a felhasználó
  isLoading: boolean;               // Betöltés alatt van-e az auth állapot ellenőrzése
  login: (credential: string) => Promise<boolean>;  // Bejelentkezési függvény (credential: jelszó/token)
  logout: () => Promise<void>;     // Kijelentkezési függvény
  showLoginModal: boolean;         // Meg kell-e jeleníteni a login modalt
  setShowLoginModal: (show: boolean) => void;  // Login modal megjelenítésének vezérlése
}

// React Context létrehozása - ez lesz a központi tároló az auth állapotnak
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * useAuth hook - ezt használják a komponensek az auth adatok eléréséhez
 * 
 * FLOW:
 * 1. A komponens meghívja: const { isAuthenticated, login } = useAuth()
 * 2. A hook lekéri a context-et: useContext(AuthContext)
 * 3. Ha nincs AuthProvider a fán, hibát dob
 * 4. Visszaadja az AuthProvider által beállított értékeket
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

/**
 * AuthProviderProps interface - definiálja, milyen props-okat kap az AuthProvider
 * 
 * children: React.ReactNode
 *   - Ez az "összes gyerek komponens, amit védünk"
 *   - Mit jelent ez pontosan?
 *   
 *   PÉLDA a layout.tsx-ben:
 *   <AuthProvider>
 *     <SidebarProvider>
 *       <AppSidebar />
 *       <main>
 *         <Navbar />
 *         <div>{children}</div>
 *       </main>
 *     </SidebarProvider>
 *   </AuthProvider>
 *   
 *   Itt az AuthProvider "gyerekei":
 *   - SidebarProvider (és minden ami benne van)
 *   - AppSidebar
 *   - main (és minden ami benne van)
 *   - Navbar
 *   - div (és a children prop tartalma)
 *   
 *   VAGYIS: Minden, ami az <AuthProvider> nyitó és </AuthProvider> záró tag között van,
 *   az lesz a "children" prop értéke!
 *   
 *   React-ben a children egy speciális prop:
 *   - Nem kell explicit módon átadni: <AuthProvider children={...} />
 *   - Automatikusan az összes belső tartalom lesz a children
 *   - A komponens ezt renderelheti: {children}
 *   
 *   MIÉRT FONTOS?
 *   - Az AuthProvider "wrap-eli" (becsomagolja) az alkalmazást
 *   - Így minden belső komponens hozzáférhet az AuthContext-hez
 *   - A useAuth() hook bárhol használható az AuthProvider-en belül
 */
interface AuthProviderProps {
  children: React.ReactNode;  // Az összes gyerek komponens, amit védünk
}

/**
 * AuthProvider komponens - ez biztosítja az auth állapotot az egész alkalmazásnak
 * 
 * FLOW:
 * 1. A layout.tsx-ben <AuthProvider> wrap-eli az alkalmazást
 * 2. A provider inicializálja a state-eket (authenticated, isLoading, showLoginModal)
 * 3. useEffect-ben ellenőrzi, hogy van-e már session (isAuthenticated() service hívás)
 * 4. Ha nincs session, megnyitja a login modalt
 * 5. A context.Provider átadja az értékeket az összes gyerek komponensnek
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State kezelés - ezek tárolják az auth állapotot
  const [authenticated, setAuthenticated] = useState<boolean>(false);  // Be van-e jelentkezve
  const [isLoading, setIsLoading] = useState<boolean>(true);            // Betöltés alatt van-e
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false); // Megjelenjen-e a modal

  /**
   * useEffect - React Hook, ami "side effect"-eket (mellékhatásokat) kezel
   * 
   * MIKOR FUT LE?
   * 
   * 1. KOMPONENS MOUNTOLÁSAKOR (első render után):
   *    - Amikor a komponens először megjelenik a DOM-ban
   *    - Ez akkor történik, amikor az <AuthProvider> először renderelődik
   *    - Példa: Oldal betöltésekor, amikor a layout.tsx renderelődik
   * 
   * 2. DEPENDENCY ARRAY TARTALMA ALAPJÁN:
   *    - useEffect(() => { ... }, [dependencies])
   *    - Ha a dependencies változnak, újra lefut
   *    - Üres array [] = csak mountoláskor fut le (soha nem fut újra)
   *    - Nincs array = minden render után lefut (VIGYÁZAT: végtelen loop lehet!)
   *    - [value1, value2] = csak akkor fut újra, ha value1 vagy value2 változik
   * 
   * 3. KOMPONENS UNMOUNTOLÁSAKOR (cleanup):
   *    - Ha a useEffect return-el egy függvényt, az cleanup függvény
   *    - Ez akkor fut le, amikor a komponens eltűnik a DOM-ból
   *    - Példa: event listener eltávolítása, timer törlése
   * 
   * REACT LIFECYCLE (ÉLETCIKLUS):
   * 
   * 1. MOUNT (Létrehozás):
   *    - Komponens létrejön
   *    - useState inicializálódik (kezdeti értékekkel)
   *    - useEffect lefut (ha van dependency array)
   *    - Komponens renderelődik a DOM-ba
   * 
   * 2. UPDATE (Frissítés):
   *    - State vagy props változik
   *    - Komponens újrarenderelődik
   *    - useEffect lefut újra (ha dependency változott)
   * 
   * 3. UNMOUNT (Törlés):
   *    - Komponens eltávolítódik a DOM-ból
   *    - useEffect cleanup függvénye lefut
   * 
   * EZ A KONKRÉT useEffect:
   * 
   * FLOW:
   * 1. Amikor az AuthProvider először mountolódik (oldal betöltésekor)
   * 2. Meghívja az auth-service isAuthenticated() függvényét
   *    - Ez ellenőrzi a localStorage-ban/cookie-ban van-e session token
   * 3. Beállítja az authenticated state-et az eredmény alapján
   * 4. isLoading = false (befejeződött a betöltés)
   * 5. Ha nincs session (!authState), megnyitja a login modalt
   * 
   * MIÉRT ÜRES DEPENDENCY ARRAY []?
   * - Csak egyszer akarjuk lefuttatni (mountoláskor)
   * - Nem akarjuk, hogy újra lefusson, amikor más state-ek változnak
   * - Így csak az oldal betöltésekor ellenőrzi a session-t
   * 
   * PÉLDA TIMELINE:
   * 0ms:  Oldal betöltődik
   * 1ms:  AuthProvider mountolódik
   * 2ms:  useState inicializálódik (authenticated=false, isLoading=true)
   * 3ms:  useEffect lefut (isAuthenticated() hívás)
   * 4ms:  setAuthenticated(true/false) - state változik
   * 5ms:  setIsLoading(false) - state változik
   * 6ms:  Komponens újrarenderelődik (mert state változott)
   * 7ms:  useEffect NEM fut újra (üres dependency array)
   */
  useEffect(() => {
    const authState = isAuthenticated();  // Service hívás: ellenőrzi localStorage/cookie-t
    setAuthenticated(authState);          // Beállítja az authenticated state-et
    setIsLoading(false);                  // Betöltés befejezve
    if (!authState) {
      setShowLoginModal(true);            // Ha nincs session, megnyitja a modalt
    }
  }, []);  // Üres dependency array = csak mountoláskor fut le (soha nem fut újra)

  /**
   * Login függvény - kezeli a bejelentkezést
   * 
   * FLOW:
   * 1. Meghívja az auth-service login() függvényét a credential-lel
   * 2. Ha sikeres (result.success === true):
   *    - Beállítja authenticated = true
   *    - Bezárja a login modalt (showLoginModal = false)
   *    - Visszaad true-t
   * 3. Ha sikertelen, visszaad false-t
   * 
   * @param credential - A bejelentkezési adat (jelszó/token)
   * @returns Promise<boolean> - true ha sikeres, false ha nem
   */
  const handleLogin = useCallback(async (credential: string): Promise<boolean> => {
    const result = await authLogin(credential);  // Service hívás: API-ra küldi a credential-t
    if (result.success) {
      setAuthenticated(true);        // Sikeres login -> authenticated = true
      setShowLoginModal(false);      // Bezárja a modalt
      return true;
    }
    return false;  // Sikertelen login
  }, []);  // useCallback = nem változik a függvény referenciája újrarendereléskor

  /**
   * Logout függvény - kezeli a kijelentkezést
   * 
   * FLOW:
   * 1. Meghívja az auth-service logout() függvényét
   *    - Ez törli a localStorage/cookie-ból a session token-t
   * 2. Beállítja authenticated = false
   * 3. Megnyitja a login modalt (showLoginModal = true)
   * 
   * @returns Promise<void>
   */
  const handleLogout = useCallback(async (): Promise<void> => {
    await authLogout();              // Service hívás: törli a session token-t
    setAuthenticated(false);         // authenticated = false
    setShowLoginModal(true);         // Megnyitja a modalt
  }, []);

  /**
   * useEffect - Event listener az "auth:required" eseményhez
   * 
   * EZ PÉLDA A CLEANUP FÜGGVÉNYRE:
   * 
   * FLOW:
   * 1. MOUNTOLÁSKOR (oldal betöltésekor):
   *    - Regisztrálja az event listener-t: window.addEventListener(...)
   *    - Mostantól figyeli az "auth:required" eseményt
   * 
   * 2. ESEMÉNY TÖRTÉNÉSEKOR:
   *    - Amikor egy API hívás 401-et ad vissza (unauthorized)
   *    - Az auth-service dispatch-el egy "auth:required" custom event-et
   *    - Ez az event listener elkapja az eseményt
   *    - Meghívja a handleAuthRequired függvényt
   *    - Törli az auth state-et (clearAuthState)
   *    - Beállítja authenticated = false
   *    - Megnyitja a login modalt
   * 
   * 3. UNMOUNTOLÁSKOR (oldal elhagyásakor):
   *    - A return-ben lévő cleanup függvény lefut
   *    - Eltávolítja az event listener-t: window.removeEventListener(...)
   *    - Ez FONTOS! Különben memory leak lenne (memória szivárgás)
   * 
   * MIÉRT FONTOS A CLEANUP?
   * - Ha nem távolítanánk el az event listener-t, az továbbra is futna
   * - Ha többször mountolódna a komponens, többször regisztrálná ugyanazt
   * - Memory leak: felesleges memóriahasználat, lassulás
   * 
   * HASZNÁLAT:
   * - Az auth-service.ts-ben: window.dispatchEvent(new CustomEvent("auth:required"))
   * - Ez akkor történik, amikor egy API hívás 401-et ad vissza
   * 
   * PÉLDA TIMELINE:
   * 0ms:   AuthProvider mountolódik
   * 1ms:   useEffect lefut, regisztrálja az event listener-t
   * 1000ms: API hívás 401-et ad vissza
   * 1001ms: auth-service dispatch-el "auth:required" event-et
   * 1002ms: Event listener elkapja, handleAuthRequired lefut
   * 1003ms: clearAuthState(), setAuthenticated(false), setShowLoginModal(true)
   * ... (oldal elhagyása)
   * 5000ms: AuthProvider unmountolódik
   * 5001ms: Cleanup függvény lefut, eltávolítja az event listener-t
   */
  useEffect(() => {
    const handleAuthRequired = () => {
      clearAuthState();              // Service hívás: törli a localStorage/cookie-t
      setAuthenticated(false);       // authenticated = false
      setShowLoginModal(true);       // Megnyitja a modalt
    };

    // Event listener regisztrálása - MOUNTOLÁSKOR
    window.addEventListener("auth:required", handleAuthRequired);
    
    // Cleanup függvény - UNMOUNTOLÁSKOR fut le
    // Ez eltávolítja az event listener-t, hogy ne legyen memory leak
    return () => {
      window.removeEventListener("auth:required", handleAuthRequired);
    };
  }, []);  // Üres dependency array = csak mountoláskor regisztrál

  /**
   * Context Provider - ez adja át az értékeket az összes gyerek komponensnek
   * 
   * FLOW:
   * 1. A value prop-ban átadja az összes auth adatot és függvényt
   * 2. Bármelyik gyerek komponens használhatja a useAuth() hook-ot
   * 3. A hook visszaadja ezeket az értékeket
   * 
   * ÁTADOTT ÉRTÉKEK:
   * - isAuthenticated: authenticated state értéke
   * - isLoading: isLoading state értéke
   * - login: handleLogin függvény referenciája
   * - logout: handleLogout függvény referenciája
   * - showLoginModal: showLoginModal state értéke
   * - setShowLoginModal: setShowLoginModal függvény referenciája
   * 
   * CHILDREN RENDERELÉSE:
   * 
   * {children} - Ez rendereli az összes gyerek komponenst
   * 
   * PÉLDA a layout.tsx-ben:
   * <AuthProvider>
   *   <SidebarProvider>...</SidebarProvider>
   * </AuthProvider>
   * 
   * Itt a children = <SidebarProvider>...</SidebarProvider>
   * 
   * Amikor az AuthProvider renderelődik:
   * 1. Létrehozza az AuthContext.Provider-t
   * 2. Átadja a value prop-ban az auth értékeket
   * 3. Rendereli a {children}-t, ami a <SidebarProvider>-t jelenti
   * 4. A SidebarProvider (és minden benne lévő komponens) hozzáférhet az AuthContext-hez
   * 
   * VAGYIS:
   * - Az AuthProvider "becsomagolja" a gyerek komponenseket
   * - A gyerekek hozzáférhetnek az AuthContext-hez useAuth() hook-kal
   * - De csak azok a komponensek, amik az AuthProvider-en BELÜL vannak!
   */
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authenticated,      // Átadja az authenticated state-et
        isLoading,                            // Átadja az isLoading state-et
        login: handleLogin,                   // Átadja a login függvényt
        logout: handleLogout,                 // Átadja a logout függvényt
        showLoginModal,                       // Átadja a showLoginModal state-et
        setShowLoginModal,                    // Átadja a setShowLoginModal függvényt
      }}
    >
      {/* 
        CHILDREN RENDERELÉSE:
        - Ez az összes komponens, ami az <AuthProvider> tag-ek között van
        - Példa: <SidebarProvider>, <AppSidebar>, <Navbar>, stb.
        - Ezek a komponensek mostantól hozzáférhetnek az AuthContext-hez
        - useAuth() hook-kal bárhol használhatják az auth adatokat
      */}
      {children}
    </AuthContext.Provider>
  );
};

