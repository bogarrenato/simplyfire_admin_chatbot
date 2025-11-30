"use client";

import { useAuth } from "@/contexts/AuthContext";
import LoginModal from "./LoginModal";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Betöltés...</div>
      </div>
    );
  }

  return (
    <>
      <LoginModal />
      {isAuthenticated && children}
    </>
  );
};

export default AuthGuard;

