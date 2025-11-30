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

const LoginModal = () => {
  const { showLoginModal, login } = useAuth();
  const [credential, setCredential] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showLoginModal) {
      setCredential("");
      setError(null);
    }
  }, [showLoginModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credential.trim()) {
      setError("Kérjük, adja meg a jelszót");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await login(credential);
      if (!success) {
        setError("Helytelen jelszó. Kérjük, próbálja újra.");
        setCredential("");
      }
    } catch {
      setError("Váratlan hiba történt. Kérjük, próbálja újra.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit(e);
    }
  };

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
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              autoFocus
              placeholder="Adja meg a jelszót"
              className={error ? "border-red-500" : ""}
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
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

