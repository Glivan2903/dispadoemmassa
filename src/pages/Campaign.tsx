import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { PageLayout } from '@/components/layout/PageLayout';
import { useWebhookUrls } from '@/hooks/useWebhookUrls';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Database } from '@/types/supabase';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

type CampanhaDisparada = Database['public']['Tables']['campanhas_disparadas']['Row'];

interface Campaign {
  id: number;
  nome: string;
  mensagem: string;
  telefones: string[];
  delay: number;
  dataCriacao: string;
  nomeInstancia: string;
  tipoEnvio: 'texto' | 'imagem' | 'imagem_texto';
  imagemUrl?: string;
  status: string;
}

const CampaignPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [telefones, setTelefones] = useState('');
  const [delay, setDelay] = useState(3);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [nomeInstancia, setNomeInstancia] = useState('');
  const [tipoEnvio, setTipoEnvio] = useState<'texto' | 'imagem' | 'imagem_texto'>('texto');
  const [imagemUrl, setImagemUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { urls } = useWebhookUrls();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Utilitário para extrair números válidos de texto
  const extractPhones = (text: string): string[] => {
    return text
      .split(/\r?\n|,|;/)
      .map(t => t.trim())
      .filter(Boolean)
      .filter(t => /^\d{10,15}(@s.whatsapp.net)?$/.test(t));
  };

  // Leitura de CSV
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast({ title: 'Arquivo inválido', description: 'Envie um arquivo CSV.', variant: 'destructive' });
      return;
    }
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setTelefones(text);
    };
    reader.readAsText(file);
  };

  // Função para baixar modelo de CSV
  const handleDownloadCsvTemplate = () => {
    const csvContent = 'telefone\n11999999999\n11988888888\n11977777777';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_telefones.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Abrir formulário
  const openForm = () => {
    setShowForm(true);
    setNome('');
    setMensagem('');
    setTelefones('');
    setDelay(3);
    setCsvFile(null);
    setNomeInstancia('');
    setTipoEnvio('texto');
    setImagemUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Fechar formulário
  const closeForm = () => {
    setShowForm(false);
  };

  // Buscar campanhas do Supabase ao carregar a página
  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .order('data_envio', { ascending: false });

      if (error) {
        console.error('Erro ao buscar campanhas:', error);
        toast({
          title: 'Erro ao carregar campanhas',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      if (!data) {
        setCampaigns([]);
        return;
      }

      const campanhas: Campaign[] = data.map((c: CampanhaDisparada) => ({
        id: c.id,
        nome: c.nome,
        mensagem: c.mensagem || '',
        nomeInstancia: c.instancia,
        dataCriacao: c.data_envio,
        telefones: Array(c.quantidade_numeros).fill(''),
        delay: c.delay,
        tipoEnvio: c.tipo_envio,
        imagemUrl: c.imagem_url || undefined,
        status: c.status
      }));

      setCampaigns(campanhas);
      
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error);
      toast({
        title: 'Erro ao carregar campanhas',
        description: 'Não foi possível carregar as campanhas. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  // Carregar campanhas ao montar o componente
  React.useEffect(() => {
    fetchCampaigns();
  }, []);

  // Envio da campanha
  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeInstancia.trim()) {
      toast({ title: 'Nome da Instância obrigatório', variant: 'destructive' });
      return;
    }
    if (!nome.trim()) {
      toast({ title: 'Nome da campanha obrigatório', variant: 'destructive' });
      return;
    }
    if (tipoEnvio !== 'imagem' && !mensagem.trim()) {
      toast({ title: 'Mensagem obrigatória', variant: 'destructive' });
      return;
    }
    if (mensagem.length > 1000) {
      toast({ title: 'Mensagem muito longa', description: 'Limite de 1000 caracteres.', variant: 'destructive' });
      return;
    }
    if (delay < 1) {
      toast({ title: 'Delay mínimo de 1 segundo', variant: 'destructive' });
      return;
    }
    if ((tipoEnvio === 'imagem' || tipoEnvio === 'imagem_texto') && !imagemUrl.trim()) {
      toast({ title: 'URL da imagem obrigatória', variant: 'destructive' });
      return;
    }
    let phones = extractPhones(telefones);
    if (phones.length === 0) {
      toast({ title: 'Insira pelo menos um telefone válido', variant: 'destructive' });
      return;
    }
    if (phones.length > 1000) {
      toast({ title: 'Limite de 1000 telefones por campanha', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // Prepara o payload para o webhook de disparo
      const webhookPayload = {
        nomeInstancia,
        nomeCampanha: nome,
        mensagem,
        telefones: phones,
        delay,
        tipoEnvio,
        ...(tipoEnvio === 'imagem_texto' && { imagemUrl })
      };

      // Prepara os dados para o Supabase
      const supabaseData = {
        nome: nome,
        mensagem: mensagem,
        instancia: nomeInstancia,
        data_envio: new Date().toISOString(),
        quantidade_numeros: phones.length,
        delay: delay,
        tipo_envio: tipoEnvio,
        imagem_url: tipoEnvio === 'imagem_texto' ? imagemUrl : null,
        status: 'pendente'
      };

      // Envia os dados simultaneamente
      const [webhookResponse, supabaseResponse] = await Promise.all([
        // Envia para o webhook de disparo
        fetch('https://nwh.devautomatizadores.com.br/webhook/disparador', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload)
        }),
        // Salva no Supabase
        supabase.from('campanhas').insert(supabaseData)
      ]);

      // Verifica se houve erro no webhook
      if (!webhookResponse.ok) {
        throw new Error('Erro ao enviar campanha para o disparador');
      }

      // Verifica se houve erro no Supabase
      if (supabaseResponse.error) {
        throw new Error('Erro ao salvar campanha no histórico');
      }

      toast({ title: 'Campanha enviada com sucesso!' });
      
      // Fecha o formulário e atualiza a lista
      setShowForm(false);
      await fetchCampaigns();
      
    } catch (err) {
      console.error('Erro ao processar campanha:', err);
      toast({ 
        title: 'Erro ao processar campanha', 
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'enviada':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Enviada</Badge>;
      case 'falha':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Falha</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto py-8 space-y-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Campanha</h1>
          {!showForm && (
            <Button onClick={openForm} className="bg-petshop-gold text-petshop-blue font-bold">Criar Nova Campanha</Button>
          )}
        </div>
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nova Campanha</CardTitle>
                <Button type="button" variant="outline" onClick={closeForm}>
                  Voltar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSendCampaign}>
                <Input
                  placeholder="Nome da campanha"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                />
                <Input
                  placeholder="Nome da Instância da Evolution"
                  value={nomeInstancia}
                  onChange={e => setNomeInstancia(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Envio</label>
                  <Select value={tipoEnvio} onValueChange={(value: 'texto' | 'imagem' | 'imagem_texto') => setTipoEnvio(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de envio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="texto">Somente Texto</SelectItem>
                      <SelectItem value="imagem_texto">Imagem com Descrição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {tipoEnvio !== 'imagem' && (
                  <Textarea
                    placeholder="Mensagem a ser enviada (máx. 1000 caracteres)"
                    value={mensagem}
                    onChange={e => setMensagem(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    required
                  />
                )}
                {(tipoEnvio === 'imagem' || tipoEnvio === 'imagem_texto') && (
                  <Input
                    placeholder="URL da imagem"
                    value={imagemUrl}
                    onChange={e => setImagemUrl(e.target.value)}
                    required
                  />
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Telefones</label>
                  <Textarea
                    placeholder="Insira números manualmente (um por linha, vírgula ou ponto e vírgula)"
                    value={telefones}
                    onChange={e => setTelefones(e.target.value)}
                    rows={3}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="file"
                      accept=".csv"
                      ref={fileInputRef}
                      onChange={handleCsvUpload}
                      className="block"
                    />
                    <span className="text-xs text-muted-foreground">ou envie um arquivo CSV</span>
                    <Button type="button" size="sm" variant="outline" onClick={handleDownloadCsvTemplate}>
                      Baixar modelo CSV
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Delay entre disparos <span className='text-xs text-muted-foreground'>(em segundos)</span></label>
                  <Input
                    type="number"
                    min={1}
                    value={delay}
                    onChange={e => setDelay(Number(e.target.value))}
                    required
                    placeholder="Delay entre disparos (segundos)"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={closeForm}>Cancelar</Button>
                  <Button type="submit" disabled={isLoading} className="bg-petshop-gold text-petshop-blue font-bold">
                    {isLoading ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Campanhas Criadas</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Total: {campaigns.length} campanhas
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {campaigns.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">Nenhuma campanha cadastrada ainda.</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="p-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Instância</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nome</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data Criação</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Qtd. Telefones</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Delay (s)</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Imagem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((camp, index) => (
                        <React.Fragment key={camp.id}>
                          <tr className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4">{camp.nomeInstancia}</td>
                            <td className="py-3 px-4 font-medium">{camp.nome}</td>
                            <td className="py-3 px-4">
                              {camp.tipoEnvio === 'texto' && 'Somente Texto'}
                              {camp.tipoEnvio === 'imagem_texto' && 'Imagem com Descrição'}
                            </td>
                            <td className="py-3 px-4">{format(new Date(camp.dataCriacao), 'dd/MM/yyyy HH:mm')}</td>
                            <td className="py-3 px-4">{camp.telefones.length}</td>
                            <td className="py-3 px-4">{camp.delay}</td>
                            <td className="py-3 px-4">{getStatusBadge(camp.status)}</td>
                            <td className="py-3 px-4">
                              {camp.imagemUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedImage(camp.imagemUrl)}
                                  className="p-0 h-8 w-8 hover:bg-muted"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                          {index < campaigns.length - 1 && (
                            <tr>
                              <td colSpan={8} className="p-0">
                                <Separator />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Modal para visualizar imagem */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-2xl max-h-[90vh] overflow-auto shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Imagem da Campanha</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedImage(null)}
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  ✕
                </Button>
              </div>
              <img
                src={selectedImage}
                alt="Imagem da campanha"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default CampaignPage; 