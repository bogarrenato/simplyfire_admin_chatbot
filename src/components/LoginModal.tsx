"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * LoginModal komponens - kezeli a bejelentkezési folyamatot
 * 
 * FLOW:
 * 1. Az AuthGuard rendereli ezt a komponenst
 * 2. A modal az AuthContext-ből kapja a showLoginModal értékét
 * 3. Ha showLoginModal === true, akkor látható a modal
 * 4. A felhasználó beírja a jelszót és submit-ol
 * 5. A modal meghívja az AuthContext login() függvényét
 * 6. Ha sikeres, az AuthContext beállítja isAuthenticated = true és showLoginModal = false
 * 7. A modal automatikusan eltűnik, mert showLoginModal = false
 * 
 * KAPCSOLAT AuthContext-tel:
 * - useAuth() hook-on keresztül kapja a showLoginModal és login értékeket
 * - showLoginModal: az AuthProvider showLoginModal state-e
 * - login: az AuthProvider handleLogin függvénye
 */
const LoginModal = () => {
  /**
   * useAuth() hook hívása - lekéri a szükséges értékeket az AuthContext-ből
   * 
   * ÉRTÉKEK:
   * - showLoginModal: boolean - az AuthProvider showLoginModal state-e
   *   - Ha true: a modal látható
   *   - Ha false: a modal rejtett
   * - login: függvény - az AuthProvider handleLogin függvénye
   *   - Meghívja az auth-service login() függvényét
   *   - Visszaad true-t ha sikeres, false-t ha nem
   */
  const { showLoginModal, login } = useAuth();
  
  // Lokális state-ek a form kezeléséhez
  const [credential, setCredential] = useState("");        // A beírt jelszó
  const [isLoading, setIsLoading] = useState(false);      // Betöltés alatt van-e a login
  const [error, setError] = useState<string | null>(null); // Hibaüzenet, ha van

  /**
   * useEffect - amikor megnyílik a modal, reseteli az input mezőket
   * 
   * FLOW:
   * - Ha showLoginModal változik true-ra (modal megnyílik)
   * - Törli a credential input mezőt
   * - Törli a hibaüzenetet
   * 
   * DEPENDENCY: [showLoginModal] - minden alkalommal lefut, amikor showLoginModal változik
   */
  useEffect(() => {
    if (showLoginModal) {
      setCredential("");   // Törli a jelszó mezőt
      setError(null);      // Törli a hibaüzenetet
    }
  }, [showLoginModal]);

  /**
   * handleSubmit - kezeli a form submit eseményt
   * 
   * FLOW:
   * 1. Megakadályozza az alapértelmezett form submit-et (e.preventDefault())
   * 2. Validálja, hogy van-e beírt jelszó
   * 3. Ha nincs: hibaüzenet és return
   * 4. Ha van:
   *    - setIsLoading(true) - betöltés indítása
   *    - setError(null) - törli a korábbi hibákat
   *    - Meghívja az AuthContext login() függvényét a credential-lel
   *    - Ha sikertelen (success === false): hibaüzenet és törli a jelszó mezőt
   *    - Ha sikeres: az AuthContext automatikusan bezárja a modalt (showLoginModal = false)
   * 5. finally: setIsLoading(false) - betöltés befejezve
   * 
   * ADATÁTVÉTEL:
   * - credential -> login(credential) -> AuthContext handleLogin() -> auth-service login()
   * - A login() visszaadja a success értéket (true/false)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();  // Megakadályozza az alapértelmezett form submit-et
    
    // Validáció: van-e beírt jelszó
    if (!credential.trim()) {
      setError("Kérjük, adja meg a jelszót");
      return;
    }

    // Login folyamat indítása
    setIsLoading(true);   // Betöltés alatt
    setError(null);       // Törli a korábbi hibákat

    try {
      /**
       * AuthContext login() függvény hívása
       * 
       * FLOW:
       * 1. Meghívja az auth-service login() függvényét
       * 2. A service API-ra küldi a credential-t
       * 3. Ha sikeres: az AuthContext beállítja isAuthenticated = true és showLoginModal = false
       * 4. Visszaad true-t ha sikeres, false-t ha nem
       */
      const success = await login(credential);
      
      if (!success) {
        // Sikertelen login: hibaüzenet és törli a jelszó mezőt
        setError("Helytelen jelszó. Kérjük, próbálja újra.");
        setCredential("");
      }
      // Ha success === true, akkor az AuthContext automatikusan bezárja a modalt
      // (showLoginModal = false), így a modal eltűnik
    } catch {
      // Váratlan hiba esetén
      setError("Váratlan hiba történt. Kérjük, próbálja újra.");
    } finally {
      setIsLoading(false);  // Betöltés befejezve
    }
  };

  /**
   * handleKeyPress - Enter billentyűre is submit-ol
   * 
   * FLOW:
   * - Ha Enter-t nyomnak és nem loading állapotban van
   * - Meghívja a handleSubmit függvényt
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit(e);
    }
  };

  /**
   * Render - a Dialog komponens megjelenítése
   * 
   * FLOW:
   * - A Dialog open prop-ja a showLoginModal értékét kapja
   *   - Ha showLoginModal === true: modal látható
   *   - Ha showLoginModal === false: modal rejtett
   * - modal={true}: blokkolja a háttér interakciókat
   * - onInteractOutside: megakadályozza, hogy kattintással bezárható legyen
   * 
   * ADATÁTVÉTEL:
   * - showLoginModal (AuthContext) -> Dialog open prop
   * - credential (lokális state) -> Input value
   * - login (AuthContext) -> handleSubmit -> login(credential)
   */
  return (
    <Dialog open={showLoginModal} modal={true}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Bejelentkezés</DialogTitle>
          <DialogDescription>
            Kérjük, adja meg a jelszavát a folytatáshoz.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="credential">Jelszó</Label>
            <Input
              id="credential"
              type="password"
              value={credential}                    // Lokális state: a beírt jelszó
              onChange={(e) => setCredential(e.target.value)}  // Frissíti a credential state-et
              onKeyPress={handleKeyPress}           // Enter-re submit
              disabled={isLoading}                  // Disabled ha loading
              autoFocus                              // Automatikus fókusz
              placeholder="Adja meg a jelszót"
              className={error ? "border-red-500" : ""}  // Piros border ha van hiba
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>  // Hibaüzenet megjelenítése
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bejelentkezés...
              </>
            ) : (
              "Bejelentkezés"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;

