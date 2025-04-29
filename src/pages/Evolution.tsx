import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PageLayout } from '@/components/layout/PageLayout';
import { useWebhookUrls } from '@/hooks/useWebhookUrls';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';

interface Instance {
  name: string;
  status: 'online' | 'offline';
  qrCode?: string;
  data_atualizacao: string;
}

const Evolution = () => {
  const { toast } = useToast();
  const { urls } = useWebhookUrls();
  const [isLoading, setIsLoading] = useState(false);
  const [instanceName, setInstanceName] = useState('');
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [isQrCodeDialogOpen, setIsQrCodeDialogOpen] = useState(false);

  const handleCreateInstance = async () => {
    if (!instanceName.trim()) {
      toast({ title: 'Nome da instância obrigatório', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(urls.evolutionCreateInstance, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ instanceName: instanceName.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Erro ao criar instância');
      }

      // A resposta é uma imagem PNG direta
      const blob = await response.blob();
      const qrCodeUrl = URL.createObjectURL(blob);

      // Converter o blob para base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const qrCodeBase64 = base64data.split(',')[1]; // Remove o prefixo data:image/png;base64,

        // Prepara os dados para o Supabase
        const supabaseData = {
          nome: instanceName.trim(),
          qrcode: qrCodeBase64,
          status: 'pendente',
          data_criacao: new Date().toISOString(),
          data_atualizacao: new Date().toISOString()
        };

        // Salvar no Supabase
        const { data, error } = await supabase
          .from('instancias')
          .insert(supabaseData)
          .select()
          .single();

        if (error) {
          console.error('Erro ao salvar instância:', error);
          toast({ title: 'Erro ao salvar instância no banco', variant: 'destructive' });
          return;
        }
        
        console.log('Instância salva com sucesso:', data);
      };

      const newInstance: Instance = {
        name: instanceName.trim(),
        status: 'offline',
        qrCode: qrCodeUrl,
        data_atualizacao: new Date().toISOString()
      };
      setInstances(prev => [...prev, newInstance]);
      setSelectedInstance(newInstance);
      setIsQrCodeDialogOpen(true);
      setInstanceName('');
      toast({ title: 'Instância criada com sucesso!' });
    } catch (error) {
      console.error('Erro ao criar instância:', error);
            toast({
        title: 'Erro ao criar instância', 
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkInstanceStatus = async (instanceName: string) => {
    try {
      const response = await fetch('https://nwh.devautomatizadores.com.br/webhook/confirma_conexao', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ instanceName })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Erro ao verificar status');
      }

      const data = await response.json();
      const newStatus = data.status === 'connected' ? 'online' : 'offline';

      // Prepara os dados para o Supabase
      const supabaseData = {
        status: newStatus === 'online' ? 'conectada' : 'pendente',
        data_atualizacao: new Date().toISOString()
      };

      // Atualizar no Supabase
      const { data: updateData, error } = await supabase
        .from('instancias')
        .update(supabaseData)
        .eq('nome', instanceName)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar status:', error);
      } else {
        console.log('Status atualizado com sucesso:', updateData);
      }

      setInstances(prev => prev.map(instance => 
        instance.name === instanceName 
          ? { ...instance, status: newStatus }
          : instance
      ));

      if (newStatus === 'online' && selectedInstance?.name === instanceName) {
        setIsQrCodeDialogOpen(false);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const handleConnect = async (instanceName: string) => {
    setIsLoading(true);
    try {
      // Atualizar QR Code
      const response = await fetch('https://nwh.devautomatizadores.com.br/webhook/atualiza_qrcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ instanceName })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Erro ao atualizar QR Code');
      }
      
      // A resposta é uma imagem PNG direta
        const blob = await response.blob();
      const qrCodeUrl = URL.createObjectURL(blob);

      // Converter o blob para base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const qrCodeBase64 = base64data.split(',')[1];

        // Atualizar QR Code no Supabase
        const { error } = await supabase
          .from('instancias')
          .update({
            qrcode: qrCodeBase64,
            data_atualizacao: new Date().toISOString()
          })
          .eq('nome', instanceName)
          .select()
          .single();

        if (error) {
          console.error('Erro ao atualizar QR Code no banco:', error);
          toast({
            title: 'Erro ao atualizar QR Code',
            description: error.message,
            variant: 'destructive'
          });
          return;
        }
      };

      // Atualizar estado local
      const instance = instances.find(i => i.name === instanceName);
      if (instance) {
        setSelectedInstance({
          ...instance,
          qrCode: qrCodeUrl
        });
        setIsQrCodeDialogOpen(true);
      }

      toast({ title: 'QR Code atualizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar QR Code:', error);
      toast({
        title: 'Erro ao atualizar QR Code',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDisconnect = async (instanceName: string) => {
    setIsLoading(true);
    try {
      // Atualizar status no Supabase
      const { error } = await supabase
        .from('instancias')
        .update({
          status: 'pendente',
          data_atualizacao: new Date().toISOString()
        })
        .eq('nome', instanceName)
        .select()
        .single();

      if (error) {
        console.error('Erro ao desconectar instância:', error);
        toast({
          title: 'Erro ao desconectar instância',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      // Atualizar estado local
      setInstances(prev => prev.map(instance => 
        instance.name === instanceName 
          ? { ...instance, status: 'offline' }
          : instance
      ));

      toast({ title: 'Instância desconectada com sucesso!' });
    } catch (error) {
      console.error('Erro ao desconectar instância:', error);
      toast({
        title: 'Erro ao desconectar instância',
        description: 'Não foi possível desconectar a instância. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para carregar as instâncias do Supabase
  const fetchInstances = async () => {
    try {
      const { data, error } = await supabase
        .from('instancias')
        .select('*')
        .order('data_atualizacao', { ascending: false });

      if (error) {
        console.error('Erro ao carregar instâncias:', error);
        toast({
          title: 'Erro ao carregar instâncias',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      if (data) {
        const formattedInstances: Instance[] = data.map(instance => ({
          name: instance.nome,
          status: instance.status === 'conectada' ? 'online' : 'offline',
          qrCode: instance.qrcode ? `data:image/png;base64,${instance.qrcode}` : undefined,
          data_atualizacao: instance.data_atualizacao
        }));
        setInstances(formattedInstances);
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
      toast({
        title: 'Erro ao carregar instâncias',
        description: 'Não foi possível carregar as instâncias. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  // Carregar instâncias ao montar o componente
  useEffect(() => {
    fetchInstances();
  }, []);

  // Efeito para verificar status inicial das instâncias quando a página carregar
  useEffect(() => {
    const checkAllInstancesStatus = async () => {
      for (const instance of instances) {
        await checkInstanceStatus(instance.name);
      }
    };

    checkAllInstancesStatus();
  }, []); // Executa apenas quando o componente é montado

  // Efeito para verificar status das instâncias periodicamente
  useEffect(() => {
    const statusInterval = setInterval(() => {
      instances.forEach(instance => checkInstanceStatus(instance.name));
    }, 30000);

    return () => clearInterval(statusInterval);
  }, [instances]);

  // Limpar URLs de objeto quando o componente for desmontado
  useEffect(() => {
    return () => {
      instances.forEach(instance => {
        if (instance.qrCode) {
          URL.revokeObjectURL(instance.qrCode);
        }
      });
    };
  }, [instances]);

  // Efeito para atualizar QR Code quando o diálogo estiver aberto
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateQrCodeWithRetry = async () => {
      if (isQrCodeDialogOpen && selectedInstance) {
        try {
          await handleConnect(selectedInstance.name);
        } catch (error) {
          console.error('Erro ao atualizar QR Code:', error);
        }
      }
    };

    if (isQrCodeDialogOpen && selectedInstance) {
      // Configura o intervalo para atualizar o QR Code
      intervalId = setInterval(updateQrCodeWithRetry, 20000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isQrCodeDialogOpen, selectedInstance]);
  
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto py-8 space-y-8">
        <h1 className="text-2xl font-bold">Evolution</h1>

          <Card>
            <CardHeader>
            <CardTitle>Criar Nova Instância</CardTitle>
            </CardHeader>
          <CardContent>
            <div className="flex gap-2">
                      <Input 
                placeholder="Nome da instância"
                        value={instanceName}
                        onChange={(e) => setInstanceName(e.target.value)}
                disabled={isLoading}
                      />
                    <Button 
                      onClick={handleCreateInstance}
                    disabled={isLoading || !instanceName.trim()}
                    >
                      {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Instância'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {instances.map((instance) => (
            <Card key={instance.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{instance.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Última atualização: {format(new Date(instance.data_atualizacao), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <Badge variant={instance.status === 'online' ? 'default' : 'destructive'}>
                    {instance.status === 'online' ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Conectado
                      </>
                      ) : (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Desconectado
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2">
                  {instance.status === 'offline' ? (
                    <Button
                      onClick={() => handleConnect(instance.name)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        'Conectar'
                      )}
                    </Button>
                  ) : (
                        <Button
                      variant="destructive"
                      onClick={() => handleDisconnect(instance.name)}
                          disabled={isLoading}
                        >
                      Desconectar
                        </Button>
              )}
              </div>
            </CardContent>
          </Card>
          ))}
        </div>

        <Dialog open={isQrCodeDialogOpen} onOpenChange={setIsQrCodeDialogOpen}>
          <DialogContent className="sm:max-w-md flex flex-col items-center justify-center">
            <DialogHeader>
              <DialogTitle className="text-center">QR Code - {selectedInstance?.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              {selectedInstance?.qrCode ? (
                <>
                  <div className="relative bg-white p-4 rounded-lg shadow-lg">
                    <img
                      key={selectedInstance.qrCode}
                      src={selectedInstance.qrCode}
                      alt="QR Code"
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Escaneie o QR Code para conectar
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    O QR Code será atualizado automaticamente a cada 20 segundos
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Carregando QR Code...</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        </div>
    </PageLayout>
  );
};

export default Evolution;
