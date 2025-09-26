import { useState } from "react";
import { User, Wrench, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import heroImage from "@assets/generated_images/Professional_tow_truck_hero_ddc62c59.png";

interface LoginScreenProps {
  onLogin: (credentials: { email: string; password: string; userType: "client" | "provider" }) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [userType, setUserType] = useState<"client" | "provider">("client");
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", { ...formData, userType, isLogin });
    
    // TODO: Remove mock functionality
    // Simulate successful login
    onLogin({ 
      email: formData.email, 
      password: formData.password, 
      userType 
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex">
      {/* Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6">
              Pronto Mecânico
            </h1>
            <p className="text-xl mb-8 text-gray-200">
              Conectando você com profissionais qualificados para emergências automotivas 24 horas por dia.
            </p>
            <ul className="space-y-3 text-lg">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Atendimento 24/7</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Rastreamento em tempo real</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Profissionais verificados</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Wrench className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {isLogin ? "Fazer Login" : "Criar Conta"}
            </CardTitle>
            <p className="text-muted-foreground">
              {isLogin 
                ? "Entre na sua conta para continuar" 
                : "Crie sua conta para começar"
              }
            </p>
          </CardHeader>

          <CardContent>
            <Tabs value={userType} onValueChange={(value) => setUserType(value as "client" | "provider")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="client" className="flex items-center space-x-2" data-testid="client-tab">
                  <User className="h-4 w-4" />
                  <span>Cliente</span>
                </TabsTrigger>
                <TabsTrigger value="provider" className="flex items-center space-x-2" data-testid="provider-tab">
                  <Wrench className="h-4 w-4" />
                  <span>Prestador</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="client" className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Solicite serviços de guincho e mecânico
                </p>
              </TabsContent>

              <TabsContent value="provider" className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Ofereça seus serviços para clientes próximos
                </p>
              </TabsContent>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Seu nome completo"
                    required={!isLogin}
                    data-testid="input-name"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="seu@email.com"
                  required
                  data-testid="input-email"
                />
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Sua senha"
                    required
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    placeholder="Confirme sua senha"
                    required={!isLogin}
                    data-testid="input-confirm-password"
                  />
                </div>
              )}

              <Button type="submit" className="w-full" data-testid="submit-button">
                {isLogin ? "Entrar" : "Criar Conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline"
                data-testid="toggle-mode"
              >
                {isLogin 
                  ? "Não tem uma conta? Criar conta" 
                  : "Já tem uma conta? Fazer login"
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}