import { useState } from "react";
import { useLocation } from "wouter";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import UserProfile from "@/components/auth/UserProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  const handleAuthSuccess = () => {
    // Redirect to scanner page after successful authentication
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="container max-w-md mx-auto px-4 py-8 flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <Header 
        title={isAuthenticated ? "My Profile" : "Account"} 
        showBackButton 
        onBackClick={() => setLocation("/")} 
      />
      
      {isAuthenticated ? (
        <div className="mt-4">
          <UserProfile />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-4">
            <LoginForm 
              onSuccess={handleAuthSuccess} 
              onRegisterClick={() => setActiveTab("register")} 
            />
          </TabsContent>
          
          <TabsContent value="register" className="mt-4">
            <RegisterForm 
              onSuccess={handleAuthSuccess} 
              onLoginClick={() => setActiveTab("login")} 
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}