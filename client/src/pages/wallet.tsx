import { useAuth } from '@/lib/auth-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Wallet as WalletIcon, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useState } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('pix');
  
  const [bankData, setBankData] = useState({
    bankAccountName: user?.bankAccountName || '',
    bankAccountNumber: user?.bankAccountNumber || '',
    bankName: user?.bankName || '',
    bankBranch: user?.bankBranch || '',
    pixKey: user?.pixKey || '',
  });

  const { data: balance, isLoading: isLoadingBalance } = useQuery<BalanceData>({
    queryKey: ['/api/wallet/balance'],
    enabled: !!token && user?.userType === 'mechanic',
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/wallet/transactions'],
    enabled: !!token,
  });

  const updateBankDataMutation = useMutation({
    mutationFn: async (data: typeof bankData) => {
      return await apiRequest('POST', '/api/wallet/bank-data', data);
    },
    onSuccess: () => {
      toast({
        title: "Dados bancários atualizados",
        description: "Suas informações foram salvas com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const requestWithdrawalMutation = useMutation({
    mutationFn: async ({ amount, method }: { amount: number; method: string }) => {
      return await apiRequest('POST', '/api/wallet/withdraw', { amount, method });
    },
    onSuccess: () => {
      toast({
        title: "Saque solicitado",
        description: "Seu saque está sendo processado e será transferido em até 2 dias úteis",
      });
      setIsWithdrawDialogOpen(false);
      setWithdrawAmount('');
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

  const handleBankDataSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBankDataMutation.mutate(bankData);
  };

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

    if (withdrawMethod === 'pix' && !user?.pixKey) {
      toast({
        title: "Dados incompletos",
        description: "Configure sua chave PIX na aba Dados Bancários",
        variant: "destructive",
      });
      return;
    }

    if (withdrawMethod === 'bank_transfer' && (!user?.bankAccountNumber || !user?.bankName)) {
      toast({
        title: "Dados incompletos",
        description: "Complete seus dados bancários primeiro",
        variant: "destructive",
      });
      return;
    }

    requestWithdrawalMutation.mutate({ amount, method: withdrawMethod });
  };

  const hasBankData = user?.bankAccountName && user?.bankAccountNumber && user?.bankName;
  const hasPixKey = !!user?.pixKey;

  return (
    <div className="container max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <WalletIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Carteira</h1>
          <p className="text-muted-foreground">Gerencie seus ganhos e dados bancários</p>
        </div>
      </div>

      {user?.userType === 'mechanic' && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Saldo Disponível
              </CardTitle>
              <CardDescription>
                Disponível para saque agora
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-4xl font-bold text-green-600" data-testid="text-available-balance">
                  {isLoadingBalance ? '...' : `R$ ${balance?.available.toFixed(2) || '0.00'}`}
                </p>
                
                <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      disabled={!balance || balance.available <= 0 || (!hasBankData && !hasPixKey)}
                      className="w-full"
                      size="lg"
                      data-testid="button-request-withdraw"
                    >
                      Solicitar Saque
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Solicitar Saque</DialogTitle>
                      <DialogDescription>
                        Informe o valor e o método de transferência
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

                      <div>
                        <Label htmlFor="withdraw-method">Método de Transferência</Label>
                        <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                          <SelectTrigger data-testid="select-withdraw-method">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pix" disabled={!hasPixKey}>PIX {!hasPixKey && '(Configure primeiro)'}</SelectItem>
                            <SelectItem value="bank_transfer" disabled={!hasBankData}>Transferência Bancária {!hasBankData && '(Configure primeiro)'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {withdrawMethod === 'pix' && hasPixKey && (
                        <Alert>
                          <Info className="w-4 h-4" />
                          <AlertDescription>
                            Chave PIX: {user?.pixKey}
                          </AlertDescription>
                        </Alert>
                      )}

                      {withdrawMethod === 'bank_transfer' && hasBankData && (
                        <Alert>
                          <Info className="w-4 h-4" />
                          <AlertDescription>
                            {user?.bankName} - Ag: {user?.bankBranch || 'N/A'} - Conta: {user?.bankAccountNumber}
                          </AlertDescription>
                        </Alert>
                      )}

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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Saldo Pendente
              </CardTitle>
              <CardDescription>
                Disponível em até 12h após conclusão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-orange-600" data-testid="text-pending-balance">
                {isLoadingBalance ? '...' : `R$ ${balance?.pending.toFixed(2) || '0.00'}`}
              </p>
              <Alert className="mt-4">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  Valores de serviços concluídos ficam disponíveis para saque 12 horas após a finalização
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue={user?.userType === 'mechanic' ? 'transactions' : 'transactions'}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions" data-testid="tab-transactions">Transações</TabsTrigger>
          {user?.userType === 'mechanic' && (
            <TabsTrigger value="bank-data" data-testid="tab-bank-data">Dados Bancários</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Histórico de Transações
              </CardTitle>
              <CardDescription>
                Todas as suas transações e saques
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : transactions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhuma transação ainda</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => {
                    const amount = parseFloat(transaction.amount);
                    const isEarning = transaction.type === 'mechanic_earnings';
                    const isWithdrawal = transaction.type === 'withdrawal';
                    const isPending = transaction.status === 'pending';
                    const availableDate = transaction.availableAt ? new Date(transaction.availableAt) : null;
                    const isAvailable = !availableDate || availableDate <= new Date();

                    return (
                      <div 
                        key={transaction.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover-elevate" 
                        data-testid={`transaction-${transaction.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${
                            isEarning ? 'bg-green-100' : 
                            isWithdrawal ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            {isEarning ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : isWithdrawal ? (
                              <WalletIcon className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(transaction.createdAt).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {availableDate && !isAvailable && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                                  Disponível em {availableDate.toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>
                            {isWithdrawal && transaction.withdrawalDetails && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {transaction.withdrawalDetails}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            isEarning ? 'text-green-600' : isWithdrawal ? 'text-blue-600' : 'text-gray-600'
                          }`} data-testid={`transaction-amount-${transaction.id}`}>
                            {amount > 0 ? '+' : ''}R$ {Math.abs(amount).toFixed(2)}
                          </p>
                          <div className="flex items-center gap-1 text-sm">
                            {isPending ? (
                              <>
                                <Clock className="w-3 h-3 text-orange-500" />
                                <span className="text-orange-500">Pendente</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                <span className="text-green-600">Concluído</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {user?.userType === 'mechanic' && (
          <TabsContent value="bank-data">
            <Card>
              <CardHeader>
                <CardTitle>Dados Bancários</CardTitle>
                <CardDescription>
                  Configure seus dados para receber saques via transferência ou PIX
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBankDataSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountName">Nome do Titular</Label>
                      <Input
                        id="bankAccountName"
                        value={bankData.bankAccountName}
                        onChange={(e) => setBankData({...bankData, bankAccountName: e.target.value})}
                        placeholder="Nome completo"
                        data-testid="input-account-name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Banco</Label>
                      <Input
                        id="bankName"
                        value={bankData.bankName}
                        onChange={(e) => setBankData({...bankData, bankName: e.target.value})}
                        placeholder="Ex: Banco do Brasil, Caixa, Itaú"
                        data-testid="input-bank-name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountNumber">Número da Conta</Label>
                      <Input
                        id="bankAccountNumber"
                        value={bankData.bankAccountNumber}
                        onChange={(e) => setBankData({...bankData, bankAccountNumber: e.target.value})}
                        placeholder="12345-6"
                        data-testid="input-account-number"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankBranch">Agência (Opcional)</Label>
                      <Input
                        id="bankBranch"
                        value={bankData.bankBranch}
                        onChange={(e) => setBankData({...bankData, bankBranch: e.target.value})}
                        placeholder="0001"
                        data-testid="input-bank-branch"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="pixKey">Chave PIX (Opcional)</Label>
                      <Input
                        id="pixKey"
                        value={bankData.pixKey}
                        onChange={(e) => setBankData({...bankData, pixKey: e.target.value})}
                        placeholder="email@exemplo.com, CPF, telefone ou chave aleatória"
                        data-testid="input-pix-key"
                      />
                      <p className="text-xs text-muted-foreground">
                        Configure PIX ou transferência bancária para receber saques
                      </p>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={updateBankDataMutation.isPending}
                    data-testid="button-save-bank-data"
                  >
                    {updateBankDataMutation.isPending ? "Salvando..." : "Salvar Dados Bancários"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
