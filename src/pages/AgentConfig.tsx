import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PageLayout } from '@/components/layout/PageLayout';
import { useWebhookUrls } from '@/hooks/useWebhookUrls';
import { useState, useEffect } from 'react';

interface UrlChanges {
  campaignSend: boolean;
  evolutionCreateInstance: boolean;
  evolutionConfirmConnection: boolean;
  evolutionUpdateQrCode: boolean;
}

const AgentConfig = () => {
  const { toast } = useToast();
  const { urls, updateUrl } = useWebhookUrls();
  const [urlChanges, setUrlChanges] = useState<UrlChanges>({
    campaignSend: false,
    evolutionCreateInstance: false,
    evolutionConfirmConnection: false,
    evolutionUpdateQrCode: false
  });
  const [originalUrls, setOriginalUrls] = useState(urls);

  useEffect(() => {
    setOriginalUrls(urls);
  }, []);

  const handleUrlChange = (key: keyof UrlChanges, value: string) => {
    updateUrl(key, value);
    setUrlChanges(prev => ({
      ...prev,
      [key]: value !== originalUrls[key]
    }));
  };

  const handleSave = async (key: keyof UrlChanges, value: string) => {
    try {
      await updateUrl(key, value);
      setUrlChanges(prev => ({
        ...prev,
        [key]: false
      }));
      setOriginalUrls(prev => ({
        ...prev,
        [key]: value
      }));
      toast({ title: 'Configuração salva com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao salvar configuração', variant: 'destructive' });
    }
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto py-8 space-y-8">
        <h1 className="text-2xl font-bold">Configurações</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>URLs de Webhook</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">URL de Campanha</label>
                <div className="flex gap-2">
                  <Input
                    value={urls.campaignSend}
                    onChange={(e) => handleUrlChange('campaignSend', e.target.value)}
                    placeholder="URL do webhook de campanha"
                  />
                  <Button 
                    onClick={() => handleSave('campaignSend', urls.campaignSend)}
                    disabled={!urlChanges.campaignSend}
                    className={urlChanges.campaignSend ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações da Evolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">URL de Criação de Instância</label>
                <div className="flex gap-2">
                  <Input
                    value={urls.evolutionCreateInstance}
                    onChange={(e) => handleUrlChange('evolutionCreateInstance', e.target.value)}
                    placeholder="URL de criação de instância"
                  />
                  <Button 
                    onClick={() => handleSave('evolutionCreateInstance', urls.evolutionCreateInstance)}
                    disabled={!urlChanges.evolutionCreateInstance}
                    className={urlChanges.evolutionCreateInstance ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    Salvar
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">URL de Confirmação de Conexão</label>
                <div className="flex gap-2">
                  <Input
                    value={urls.evolutionConfirmConnection}
                    onChange={(e) => handleUrlChange('evolutionConfirmConnection', e.target.value)}
                    placeholder="URL de confirmação de conexão"
                  />
                  <Button 
                    onClick={() => handleSave('evolutionConfirmConnection', urls.evolutionConfirmConnection)}
                    disabled={!urlChanges.evolutionConfirmConnection}
                    className={urlChanges.evolutionConfirmConnection ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    Salvar
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">URL de Atualização de QR Code</label>
                <div className="flex gap-2">
                  <Input
                    value={urls.evolutionUpdateQrCode}
                    onChange={(e) => handleUrlChange('evolutionUpdateQrCode', e.target.value)}
                    placeholder="URL de atualização de QR Code"
                  />
                  <Button 
                    onClick={() => handleSave('evolutionUpdateQrCode', urls.evolutionUpdateQrCode)}
                    disabled={!urlChanges.evolutionUpdateQrCode}
                    className={urlChanges.evolutionUpdateQrCode ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default AgentConfig;
