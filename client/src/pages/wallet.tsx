import { useAuth } from '@/lib/auth-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Wallet as WalletIcon, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Info, XCircle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useState } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface BalanceData {
  available: number;
  pending: number;
  total: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  description: string;
  status: string;
  availableAt: string | null;
  createdAt: string;
  withdrawalMethod: string | null;
  withdrawalDetails: string | null;
}

export default function WalletPage() {
  const { user, token, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');

  const { data: balance, isLoading: isLoadingBalance } = useQuery<BalanceData>({
    queryKey: ['/api/wallet/balance'],
    enabled: !!token && user?.userType === 'mechanic',
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/wallet/transactions'],
    enabled: !!token,
  });

  const requestWithdrawalMutation = useMutation({
    mutationFn: async ({ amount, pixKey, pixKeyType }: { amount: number; pixKey: string; pixKeyType: string }) => {
      return await apiRequest('POST', '/api/wallet/withdraw', { amount, pixKey, pixKeyType });
    },
    onSuccess: () => {
      toast({
        title: "Saque solicitado",
        description: "Processaremos em até 2 dias úteis",
      });
      setIsWithdrawDialogOpen(false);
      setWithdrawAmount('');
      setPixKey('');
      setPixKeyType('cpf');
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/transactions'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleWithdrawSubmit = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor válido para saque",
        variant: "destructive",
      });
      return;
    }

    if (!balance || amount > balance.available) {
      toast({
        title: "Saldo insuficiente",
        description: `Você tem apenas R$ ${balance?.available.toFixed(2)} disponível`,
        variant: "destructive",
      });
      return;
    }

    if (!pixKey || pixKey.trim() === '') {
      toast({
        title: "Chave PIX obrigatória",
        description: "Informe sua chave PIX para receber o saque",
        variant: "destructive",
      });
      return;
    }

    requestWithdrawalMutation.mutate({ amount, pixKey: pixKey.trim(), pixKeyType });
  };

  const earningsTransactions = transactions.filter(t => t.type === 'mechanic_earnings');
  const pendingTransactions = transactions.filter(t => {
    const availableDate = t.availableAt ? new Date(t.availableAt) : null;
    return t.status === 'completed' && availableDate && availableDate > new Date();
  });
  const withdrawalTransactions = transactions.filter(t => t.type === 'withdrawal');

  const renderTransaction = (transaction: Transaction) => {
    const amount = parseFloat(transaction.amount);
    const isEarning = transaction.type === 'mechanic_earnings';
    const isWithdrawal = transaction.type === 'withdrawal';
    const isPending = transaction.status === 'pending';
    const isCancelled = transaction.status === 'cancelled';
    const availableDate = transaction.availableAt ? new Date(transaction.availableAt) : null;
    const isAvailable = !availableDate || availableDate <= new Date();

    return (
      <div 
        key={transaction.id} 
        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors" 
        data-testid={`transaction-${transaction.id}`}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className={`p-2 rounded-full ${
            isEarning ? 'bg-green-500/10' : 
            isWithdrawal ? 'bg-blue-500/10' : 'bg-gray-500/10'
          }`}>
            {isEarning ? (
              <ArrowDownToLine className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : isWithdrawal ? (
              <ArrowUpFromLine className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <Clock className="w-4 h-4 text-gray-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{transaction.description}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Clock className="w-3 h-3" />
              <span>{new Date(transaction.createdAt).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
            {isWithdrawal && transaction.withdrawalDetails && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {transaction.withdrawalDetails}
              </p>
            )}
          </div>
        </div>
        <div className="text-right ml-4">
          <p className={`text-lg font-bold ${
            isEarning ? 'text-green-600 dark:text-green-400' : 
            isWithdrawal ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600'
          }`} data-testid={`transaction-amount-${transaction.id}`}>
            {amount > 0 ? '+' : ''}R$ {Math.abs(amount).toFixed(2)}
          </p>
          {isPending && (
            <Badge variant="outline" className="mt-1 text-xs border-orange-500/50 text-orange-600">
              <Clock className="w-3 h-3 mr-1" />
              Pendente
            </Badge>
          )}
          {isCancelled && (
            <Badge variant="outline" className="mt-1 text-xs border-red-500/50 text-red-600">
              <XCircle className="w-3 h-3 mr-1" />
              Cancelado
            </Badge>
          )}
          {!isPending && !isCancelled && (
            <Badge variant="outline" className="mt-1 text-xs border-green-500/50 text-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Concluído
            </Badge>
          )}
          {availableDate && !isAvailable && (
            <p className="text-xs text-orange-600 mt-1">
              Liberado às {availableDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <WalletIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Carteira</h1>
          <p className="text-muted-foreground">Gerencie seus ganhos e saques</p>
        </div>
      </div>

      {user?.userType === 'mechanic' && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-2 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="w-4 h-4 text-green-600" />
                Disponível para Saque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4" data-testid="text-available-balance">
                {isLoadingBalance ? '...' : `R$ ${balance?.available.toFixed(2) || '0.00'}`}
              </p>
              <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={!balance || balance.available <= 0}
                    className="w-full"
                    data-testid="button-request-withdraw"
                  >
                    <ArrowUpFromLine className="w-4 h-4 mr-2" />
                    Solicitar Saque
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Solicitar Saque PIX</DialogTitle>
                    <DialogDescription>
                      Informe o valor e sua chave PIX
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="withdraw-amount">Valor do Saque</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        data-testid="input-withdraw-amount"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Disponível: R$ {balance?.available.toFixed(2) || '0.00'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label htmlFor="pix-key">Chave PIX</Label>
                        <Input
                          id="pix-key"
                          value={pixKey}
                          onChange={(e) => setPixKey(e.target.value)}
                          placeholder="Digite sua chave PIX"
                          data-testid="input-withdraw-pix-key"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="pix-key-type">Tipo de Chave</Label>
                        <Select value={pixKeyType} onValueChange={setPixKeyType}>
                          <SelectTrigger data-testid="select-pix-key-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cpf">CPF</SelectItem>
                            <SelectItem value="cnpj">CNPJ</SelectItem>
                            <SelectItem value="email">E-mail</SelectItem>
                            <SelectItem value="phone">Telefone</SelectItem>
                            <SelectItem value="random">Chave Aleatória</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Alert>
                      <Info className="w-4 h-4" />
                      <AlertDescription className="text-sm">
                        O saque será processado em até 2 dias úteis e o valor será depositado na chave PIX informada.
                      </AlertDescription>
                    </Alert>

                    <Button 
                      onClick={handleWithdrawSubmit}
                      disabled={requestWithdrawalMutation.isPending}
                      className="w-full"
                      data-testid="button-submit-withdraw"
                    >
                      {requestWithdrawalMutation.isPending ? "Processando..." : "Confirmar Saque"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4 text-orange-600" />
                Aguardando Liberação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2" data-testid="text-pending-balance">
                {isLoadingBalance ? '...' : `R$ ${balance?.pending.toFixed(2) || '0.00'}`}
              </p>
              <p className="text-xs text-muted-foreground">
                Liberado 12h após conclusão
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Total de Ganhos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {isLoadingBalance ? '...' : `R$ ${balance?.total.toFixed(2) || '0.00'}`}
              </p>
              <p className="text-xs text-muted-foreground">
                Disponível + Pendente
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="earnings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="earnings" data-testid="tab-earnings">
            <ArrowDownToLine className="w-4 h-4 mr-2" />
            Ganhos
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            <Clock className="w-4 h-4 mr-2" />
            Aguardando ({pendingTransactions.length})
          </TabsTrigger>
          <TabsTrigger value="withdrawals" data-testid="tab-withdrawals">
            <ArrowUpFromLine className="w-4 h-4 mr-2" />
            Saques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-green-600" />
                Histórico de Ganhos
              </CardTitle>
              <CardDescription>
                Todos os serviços concluídos e seus ganhos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : earningsTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum ganho ainda</p>
                  <p className="text-sm text-muted-foreground mt-1">Complete serviços para começar a ganhar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {earningsTransactions.map(renderTransaction)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Aguardando Liberação
              </CardTitle>
              <CardDescription>
                Ganhos que serão liberados em breve (12h após conclusão)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : pendingTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nada aguardando liberação</p>
                  <p className="text-sm text-muted-foreground mt-1">Valores ficam disponíveis 12h após conclusão</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingTransactions.map(renderTransaction)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpFromLine className="w-5 h-5 text-blue-600" />
                Histórico de Saques
              </CardTitle>
              <CardDescription>
                Todos os saques solicitados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : withdrawalTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <WalletIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum saque realizado</p>
                  <p className="text-sm text-muted-foreground mt-1">Solicite saques quando tiver saldo disponível</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {withdrawalTransactions.map(renderTransaction)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
