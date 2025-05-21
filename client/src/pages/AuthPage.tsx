import { useState } from "react";
import { useLocation } from "wouter";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [, setLocation] = useLocation();

  const handleAuthSuccess = () => {
    // Redirect to scanner page after successful authentication
    setLocation("/");
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <Header 
        title="Account" 
        showBackButton 
        onBackClick={() => setLocation("/")} 
      />
      
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
    </div>
  );
}