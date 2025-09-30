import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<'client' | 'mechanic'>('client');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register({ username, password, email, fullName, phone, userType });
      }
      setLocation('/');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle data-testid="text-title">{isLogin ? 'Login' : 'Cadastro'}</CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Entre com sua conta para continuar' 
              : 'Crie sua conta para começar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                data-testid="input-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    data-testid="input-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    data-testid="input-fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    data-testid="input-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Tipo de Usuário</Label>
                  <div className="flex gap-4 mt-2">
                    <Button
                      type="button"
                      variant={userType === 'client' ? 'default' : 'outline'}
                      onClick={() => setUserType('client')}
                      data-testid="button-usertype-client"
                      className="flex-1"
                    >
                      Cliente
                    </Button>
                    <Button
                      type="button"
                      variant={userType === 'mechanic' ? 'default' : 'outline'}
                      onClick={() => setUserType('mechanic')}
                      data-testid="button-usertype-mechanic"
                      className="flex-1"
                    >
                      Mecânico
                    </Button>
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                data-testid="input-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? 'Carregando...' : isLogin ? 'Entrar' : 'Cadastrar'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              data-testid="button-toggle-mode"
              className="text-sm text-primary hover:underline"
            >
              {isLogin 
                ? 'Não tem uma conta? Cadastre-se' 
                : 'Já tem uma conta? Entre'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
