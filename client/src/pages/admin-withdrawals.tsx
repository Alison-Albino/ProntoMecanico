import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, CheckCircle, Clock, User as UserIcon, CreditCard, Building } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WithdrawalWithUser {
  id: string;
  userId: string;
  amount: string;
  description: string;
  withdrawalMethod: string;
  withdrawalDetails: string;
  createdAt: string;
  status: string;
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
}

export default function AdminWithdrawalsPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const { data: withdrawals = [], isLoading } = useQuery<WithdrawalWithUser[]>({
    queryKey: ['/api/admin/withdrawals'],
    enabled: !!token,
  });

  const completeWithdrawalMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('POST', `/api/admin/withdrawals/${id}/complete`, {});
    },
    onSuccess: () => {
      toast({
        title: "Saque confirmado",
        description: "O saque foi marcado como concluído com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawals'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfirmWithdrawal = (id: string) => {
    if (window.confirm("Confirmar que você já transferiu o dinheiro para este mecânico?")) {
      completeWithdrawalMutation.mutate(id);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Saques Pendentes</h1>
          <p className="text-muted-foreground">Processar transferências para mecânicos</p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Instruções:</strong> Para cada saque pendente, faça a transferência via PIX ou TED bancário usando os dados fornecidos. 
          Após confirmar o pagamento, clique em "Confirmar Transferência" para atualizar o sistema.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Carregando...</p>
      ) : withdrawals.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <p className="text-xl font-medium">Nenhum saque pendente</p>
              <p className="text-muted-foreground mt-2">Todos os saques foram processados!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((withdrawal) => {
            const amount = Math.abs(parseFloat(withdrawal.amount));
            const isPix = withdrawal.withdrawalMethod === 'pix';

            return (
              <Card key={withdrawal.id} data-testid={`withdrawal-${withdrawal.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-orange-100 rounded-full">
                        {isPix ? (
                          <CreditCard className="w-6 h-6 text-orange-600" />
                        ) : (
                          <Building className="w-6 h-6 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-2xl">R$ {amount.toFixed(2)}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4" />
                          {new Date(withdrawal.createdAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleConfirmWithdrawal(withdrawal.id)}
                      disabled={completeWithdrawalMutation.isPending}
                      size="lg"
                      data-testid={`button-confirm-${withdrawal.id}`}
                    >
                      {completeWithdrawalMutation.isPending ? "Processando..." : "Confirmar Transferência"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-semibold">Mecânico</h3>
                      </div>
                      <p className="text-lg font-medium" data-testid={`mechanic-name-${withdrawal.id}`}>
                        {withdrawal.user.name}
                      </p>
                      <p className="text-sm text-muted-foreground">@{withdrawal.user.username}</p>
                      <p className="text-sm text-muted-foreground">{withdrawal.user.email}</p>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {isPix ? (
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Building className="w-4 h-4 text-muted-foreground" />
                        )}
                        <h3 className="font-semibold">Dados para Transferência</h3>
                      </div>
                      <p className="text-sm font-mono bg-background p-2 rounded border" data-testid={`withdrawal-details-${withdrawal.id}`}>
                        {withdrawal.withdrawalDetails}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Método: {isPix ? 'PIX' : 'Transferência Bancária'}
                      </p>
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription className="text-sm">
                      ⚠️ Após fazer a transferência via {isPix ? 'PIX' : 'TED/DOC'}, clique em "Confirmar Transferência" para marcar como concluído.
                      O mecânico verá o saque como completado no histórico dele.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
