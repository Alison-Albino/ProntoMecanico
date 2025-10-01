import { useAuth } from '@/lib/auth-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Wallet as WalletIcon, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export default function WalletPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [bankData, setBankData] = useState({
    bankAccountName: user?.bankAccountName || '',
    bankAccountNumber: user?.bankAccountNumber || '',
    bankName: user?.bankName || '',
    bankBranch: user?.bankBranch || '',
    pixKey: user?.pixKey || '',
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['/api/wallet/transactions'],
    enabled: !!token,
  });

  const updateBankDataMutation = useMutation({
    mutationFn: async (data: typeof bankData) => {
      const response = await fetch('/api/wallet/bank-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao atualizar dados bancários');
      return response.json();
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
    mutationFn: async () => {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Erro ao solicitar saque');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Saque solicitado",
        description: "Seu saque está sendo processado",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
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

  const handleWithdraw = () => {
    if (!user?.bankAccountName || !user?.bankAccountNumber || !user?.bankName) {
      toast({
        title: "Dados bancários incompletos",
        description: "Complete seus dados bancários para solicitar saque",
        variant: "destructive",
      });
      return;
    }
    requestWithdrawalMutation.mutate();
  };

  const walletBalance = parseFloat(user?.walletBalance || "0");
  const hasBankData = user?.bankAccountName && user?.bankAccountNumber && user?.bankName;

  return (
    <div className="container max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <WalletIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Carteira</h1>
          <p className="text-muted-foreground">Gerencie seus ganhos e dados bancários</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Saldo Disponível
          </CardTitle>
          <CardDescription>
            {user?.userType === 'mechanic' 
              ? "Seus ganhos já com desconto de 10% da plataforma"
              : "Seu saldo atual"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-green-600" data-testid="text-balance">
                R$ {walletBalance.toFixed(2)}
              </p>
              {user?.userType === 'mechanic' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Disponível para saque
                </p>
              )}
            </div>
            {user?.userType === 'mechanic' && walletBalance > 0 && (
              <Button
                onClick={handleWithdraw}
                disabled={!hasBankData || requestWithdrawalMutation.isPending}
                size="lg"
                data-testid="button-withdraw"
              >
                {requestWithdrawalMutation.isPending ? "Processando..." : "Solicitar Saque"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={user?.userType === 'mechanic' ? 'bank-data' : 'transactions'}>
        <TabsList className="grid w-full grid-cols-2">
          {user?.userType === 'mechanic' && (
            <TabsTrigger value="bank-data" data-testid="tab-bank-data">Dados Bancários</TabsTrigger>
          )}
          <TabsTrigger value="transactions" data-testid="tab-transactions">Transações</TabsTrigger>
        </TabsList>

        {user?.userType === 'mechanic' && (
          <TabsContent value="bank-data">
            <Card>
              <CardHeader>
                <CardTitle>Dados Bancários</CardTitle>
                <CardDescription>
                  Adicione seus dados bancários para receber os pagamentos
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
                        placeholder="Ex: Banco do Brasil"
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
                      <Label htmlFor="bankBranch">Agência</Label>
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
                        placeholder="email@exemplo.com ou CPF"
                        data-testid="input-pix-key"
                      />
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

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Histórico de Transações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : !Array.isArray(transactions) || transactions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhuma transação ainda</p>
              ) : (
                <div className="space-y-4">
                  {(transactions as any[]).map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`transaction-${transaction.id}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'earning' ? 'bg-green-100' : 
                          transaction.type === 'withdrawal' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {transaction.type === 'earning' ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : transaction.type === 'withdrawal' ? (
                            <WalletIcon className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {new Date(transaction.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          transaction.type === 'earning' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {transaction.type === 'earning' ? '+' : '-'}R$ {parseFloat(transaction.amount).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          {transaction.status === 'completed' ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              Concluído
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Pendente
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
