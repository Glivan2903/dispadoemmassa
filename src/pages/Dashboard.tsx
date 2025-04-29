import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import MetricsCard from '@/components/dashboard/MetricsCard';
import ChatsCard from '@/components/dashboard/ChatsCard';
import KnowledgeCard from '@/components/dashboard/KnowledgeCard';
import ClientsCard from '@/components/dashboard/ClientsCard';
import EvolutionCard from '@/components/dashboard/EvolutionCard';
import ScheduleCard from '@/components/dashboard/ScheduleCard';
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { useWebhookUrls } from '@/hooks/useWebhookUrls';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CampaignStats {
  total: number;
  porTipo: {
    texto: number;
    imagem: number;
    imagem_texto: number;
  };
  porStatus: {
    pendente: number;
    enviada: number;
    falha: number;
  };
  totalNumeros: number;
  ultimaCampanha: string | null;
  dadosGrafico: Array<{
    tipo: string;
    quantidade: number;
  }>;
  dadosGraficoStatus: Array<{
    status: string;
    quantidade: number;
  }>;
}

interface Campaign {
  id: number;
  tipo_envio: 'texto' | 'imagem' | 'imagem_texto';
  status: string;
  quantidade_numeros: number;
  data_envio: string;
}

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<CampaignStats>({
    total: 0,
    porTipo: {
      texto: 0,
      imagem: 0,
      imagem_texto: 0
    },
    porStatus: {
      pendente: 0,
      enviada: 0,
      falha: 0
    },
    totalNumeros: 0,
    ultimaCampanha: null,
    dadosGrafico: [],
    dadosGraficoStatus: []
  });
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'texto' | 'imagem' | 'imagem_texto'>('todos');
  const { urls } = useWebhookUrls();
  
  // Initialize real-time updates for the dashboard
  useDashboardRealtime();
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);
  
  const fetchStats = async () => {
    let query = supabase
      .from('campanhas')
      .select('*')
      .order('data_envio', { ascending: false });

    // Aplicar filtro se não for 'todos'
    if (filtroTipo !== 'todos') {
      query = query.eq('tipo_envio', filtroTipo);
    }

    const { data, error } = await query;

    if (!error && data) {
      const campaigns = data as Campaign[];
      const total = campaigns.length;
      const porTipo = {
        texto: campaigns.filter(c => c.tipo_envio === 'texto').length,
        imagem: campaigns.filter(c => c.tipo_envio === 'imagem').length,
        imagem_texto: campaigns.filter(c => c.tipo_envio === 'imagem_texto').length
      };
      const porStatus = {
        pendente: campaigns.filter(c => c.status === 'pendente').length,
        enviada: campaigns.filter(c => c.status === 'enviada').length,
        falha: campaigns.filter(c => c.status === 'falha').length
      };
      const totalNumeros = campaigns.reduce((acc, curr) => acc + (curr.quantidade_numeros || 0), 0);
      const ultimaCampanha = campaigns.length > 0 ? format(new Date(campaigns[0].data_envio), 'dd/MM/yyyy HH:mm') : null;

      // Preparar dados para o gráfico de tipos
      const dadosGrafico = [
        { tipo: 'Texto', quantidade: porTipo.texto },
        { tipo: 'Imagem com Texto', quantidade: porTipo.imagem_texto }
      ];

      // Preparar dados para o gráfico de status
      const dadosGraficoStatus = [
        { status: 'Pendente', quantidade: porStatus.pendente },
        { status: 'Enviada', quantidade: porStatus.enviada },
        { status: 'Falha', quantidade: porStatus.falha }
      ];

      setStats({ 
        total, 
        porTipo, 
        porStatus, 
        totalNumeros, 
        ultimaCampanha, 
        dadosGrafico,
        dadosGraficoStatus
      });
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filtroTipo]); // Adicionado filtroTipo como dependência
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-petshop-blue dark:bg-gray-900">
        <div className="h-16 w-16 border-4 border-t-transparent border-petshop-gold rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <Select value={filtroTipo} onValueChange={(value: 'todos' | 'texto' | 'imagem' | 'imagem_texto') => setFiltroTipo(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="texto">Somente Texto</SelectItem>
                <SelectItem value="imagem_texto">Imagem com Descrição</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Campanhas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Números</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNumeros}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campanhas Enviadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.porStatus.enviada}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Campanha</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ultimaCampanha || 'Nenhuma'}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Campanhas por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.dadosGrafico}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tipo" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantidade" fill="#8884d8" name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status das Campanhas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.dadosGraficoStatus}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantidade" fill="#82ca9d" name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>URL da API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">URL da API</label>
                <div className="text-sm text-muted-foreground break-all">
                  {urls.campaignSend}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
