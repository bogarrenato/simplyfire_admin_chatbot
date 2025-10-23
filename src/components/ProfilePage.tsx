"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, CreditCard, Calendar, Shield, Edit } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bankAccount: string;
  joinDate: Date;
  lastLogin: Date;
  role: string;
  status: "active" | "inactive" | "suspended";
}

const mockProfile: UserProfile = {
  id: "user_123",
  name: "John Doe",
  email: "john.doe@simplyfire.ai",
  avatar: "/api/placeholder/150/150",
  bankAccount: "1234567890123456",
  joinDate: new Date("2023-01-15"),
  lastLogin: new Date("2024-01-15T10:30:00"),
  role: "Admin",
  status: "active"
};

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call delay
    const loadProfile = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      setProfile(mockProfile);
      setIsLoading(false);
    };

    loadProfile();
  }, []);

  const maskBankAccount = (account: string) => {
    const lastFour = account.slice(-4);
    const masked = "*".repeat(account.length - 4);
    return `${masked}${lastFour}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktív";
      case "inactive":
        return "Inaktív";
      case "suspended":
        return "Felfüggesztett";
      default:
        return "Ismeretlen";
    }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nem sikerült betölteni a profil adatokat.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profil</h1>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Szerkesztés
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profil kártya */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Alapinformációk</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="text-lg">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">{profile.name}</h3>
                <Badge className={getStatusColor(profile.status)}>
                  {getStatusText(profile.status)}
                </Badge>
                <p className="text-sm text-muted-foreground">{profile.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kapcsolattartási adatok */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Kapcsolattartási adatok</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Csatlakozás: {format(profile.joinDate, "yyyy. MMMM dd.", { locale: hu })}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Utolsó bejelentkezés: {format(profile.lastLogin, "yyyy. MMMM dd. HH:mm", { locale: hu })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bankszámla adatok */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Bankszámla adatok</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono">
                  {maskBankAccount(profile.bankAccount)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Csak az utolsó 4 számjegy látható biztonsági okokból
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Biztonsági beállítások */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Biztonsági beállítások</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Kétfaktoros hitelesítés</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Aktív
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email értesítések</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Bekapcsolva
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SMS értesítések</span>
                <Badge variant="outline" className="text-gray-600 border-gray-600">
                  Kikapcsolva
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ProfileSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profil kártya skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kapcsolattartási adatok skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>

        {/* Bankszámla adatok skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </CardContent>
        </Card>

        {/* Biztonsági beállítások skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-44" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-18" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
