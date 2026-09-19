'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getDashboardStats } from '../actions/dashboard';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Users, ClipboardList, Zap, CircleDollarSign, 
  FilterX, Filter, RefreshCw, BarChart2, LineChart as LineChartIcon, Activity, 
  PieChart as PieChartIcon, CheckCircle2, LayoutTemplate, Download, Calendar,
  Briefcase, ClipboardCheck, XCircle, Clock, TrendingUp, Link as LinkIcon, FileText
} from 'lucide-react';
import { bairrosTeresina, municipiosPiaui } from '@/data/locations';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- MOCK DATA ---
const mockEvolutionData = [
  { name: 'Jan', recebidas: 400, deferidas: 240 },
  { name: 'Fev', recebidas: 300, deferidas: 139 },
  { name: 'Mar', recebidas: 200, deferidas: 980 },
  { name: 'Abr', recebidas: 278, deferidas: 390 },
  { name: 'Mai', recebidas: 189, deferidas: 480 },
  { name: 'Jun', recebidas: 239, deferidas: 380 },
];

const mockRankingData = [
  { name: 'Promorar', count: 420 },
  { name: 'Mocambinho', count: 380 },
  { name: 'Dirceu', count: 350 },
  { name: 'Santa Maria', count: 310 },
  { name: 'Parque Piauí', count: 280 },
];

const mockProfileData = [
  { name: '< 50 m²', value: 65 },
  { name: 'Moradia Precária', value: 25 },
  { name: 'Outros', value: 10 },
];

const mockAgentes = ['Ana Rita (Equipe Sul)', 'Carlos Mendes (Equipe Leste)', 'Juliana Costa (Equipe Norte)', 'Marcos Silva (Equipe Centro)'];
const mockQrCodesPorAgente: Record<string, string[]> = {
  'Ana Rita (Equipe Sul)': ['Todos os QR Codes', 'QR-992 (Vila Irmã Dulce)', 'QR-993 (Promorar)'],
  'Carlos Mendes (Equipe Leste)': ['Todos os QR Codes', 'QR-105 (Vale Quem Tem)'],
  'Juliana Costa (Equipe Norte)': ['Todos os QR Codes', 'QR-401 (Mocambinho)', 'QR-402 (Santa Maria)'],
};

const COLORS = ['#FF007F', '#00E5FF', '#283593', '#00843D', '#FFB300'];

export default function DashboardPage() {
  const [dbStats, setDbStats] = useState<any>(null);
  useEffect(() => { getDashboardStats().then(setDbStats) }, []);
  // Chart states
  const [chart1Type, setChart1Type] = useState<'bar' | 'line' | 'area'>('area');
  const [chart2Type, setChart2Type] = useState<'horizontal' | 'vertical'>('horizontal');
  const [chart3Type, setChart3Type] = useState<'donut' | 'pie'>('donut');
  
  // Loading states
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingFullPdf, setIsGeneratingFullPdf] = useState(false);

  // Filter states
  const [dateInterval, setDateInterval] = useState('Hoje');
  const [channel, setChannel] = useState('Todos');
  const [statusFiltro, setStatusFiltro] = useState('Todos');
  const [selectedPersonQr, setSelectedPersonQr] = useState('');
  const [matricula, setMatricula] = useState('');
  const [selectedFuncionario, setSelectedFuncionario] = useState('');

  const printRef = useRef<HTMLDivElement>(null);

  const filteredStats = useMemo(() => {
    if (!dbStats || !dbStats.solicitacoes) return null;

    let filtered = [...dbStats.solicitacoes];

    // Filter by dateInterval
    const now = new Date();
    if (dateInterval === 'Hoje') {
      filtered = filtered.filter(s => new Date(s.dataCriacao).toDateString() === now.toDateString());
    } else if (dateInterval === 'Últimos 7 dias') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      filtered = filtered.filter(s => new Date(s.dataCriacao) >= past);
    } else if (dateInterval === 'Mês Atual') {
      filtered = filtered.filter(s => new Date(s.dataCriacao).getMonth() === now.getMonth() && new Date(s.dataCriacao).getFullYear() === now.getFullYear());
    } else if (dateInterval === 'Ano de 2026') {
      filtered = filtered.filter(s => new Date(s.dataCriacao).getFullYear() === 2026);
    }

    // Filter by Status (if exist)
    if (statusFiltro && statusFiltro !== 'Todos') {
      filtered = filtered.filter(s => s.status === statusFiltro);
    }

    // Filter by Channel
    if (channel === 'App (Cidadão)') {
      filtered = filtered.filter(s => s.origem === 'APP');
    } else if (channel === 'Ações de Rua (QR Code)') {
      filtered = filtered.filter(s => s.origem === 'QR_CODE');
    } else if (channel === 'Agentes de Campo (Offline)') {
      filtered = filtered.filter(s => s.origem === 'OFFLINE');
    }

    // Filter by Funcionario
    if (selectedFuncionario) {
      filtered = filtered.filter(s => s.funcionario === selectedFuncionario);
    }

    // Recompute Metrics
    const total = filtered.length;
    const pendentes = filtered.filter(s => s.status === 'Pendente' || s.status === 'Em Análise').length;
    const aprovadas = filtered.filter(s => s.status === 'Aprovada').length;
    const recusadas = filtered.filter(s => s.status === 'Recusada').length;

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const evolutionMap = {};
    filtered.forEach(s => {
      const date = new Date(s.dataCriacao);
      const mName = months[date.getMonth()];
      if (!evolutionMap[mName]) {
        evolutionMap[mName] = { name: mName, recebidas: 0, deferidas: 0 };
      }
      evolutionMap[mName].recebidas += 1;
      if (s.status === 'Aprovada') {
        evolutionMap[mName].deferidas += 1;
      }
    });
    const evolution = Object.values(evolutionMap);

    const bairrosCount = {};
    filtered.forEach(s => {
      const b = s.beneficiario?.bairro || 'Outros';
      bairrosCount[b] = (bairrosCount[b] || 0) + 1;
    });
    const rankingBairros = Object.entries(bairrosCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const perfilMoradia = [
      { name: 'App', value: filtered.filter(s => s.origem === 'APP').length },
      { name: 'QR', value: filtered.filter(s => s.origem === 'QR_CODE').length },
      { name: 'Offline', value: filtered.filter(s => s.origem === 'OFFLINE').length }
    ].filter(p => p.value > 0);

    return { total, pendentes, aprovadas, recusadas, evolution, rankingBairros, perfilMoradia };
  }, [dbStats, dateInterval, statusFiltro, channel, selectedFuncionario]);


  // Exportar PDF do Dashboard Visível
  const handleDownloadPdf = async () => {
    const element = printRef.current;
    if (!element) return;
    
    try {
      setIsGeneratingPdf(true);
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        backgroundColor: '#F8FAFC'
      });
      
      const data = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('relatorio-dashboard-tarifa-social.pdf');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Houve um erro ao gerar o PDF. Tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Exportar PDF Completo com Tabela de Municípios
  const handleDownloadFullReport = () => {
    setIsGeneratingFullPdf(true);
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.setTextColor(74, 11, 89); // Roxo profundo
      doc.text("Relatório Geral - Índices por Município", 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
      doc.text(`Filtro Atual: ${dateInterval}`, 14, 36);

      // Gerar dados mockados baseados na lista real de municípios
      const tableData = municipiosPiaui.map((municipio, index) => {
        // Gerando números aleatórios realistas para o mock
        const recebidas = Math.floor(Math.random() * 500) + 50;
        const deferidas = Math.floor(recebidas * (Math.random() * 0.4 + 0.5)); // 50% a 90% aprovadas
        const recusadas = recebidas - deferidas;
        const aprovacao = ((deferidas / recebidas) * 100).toFixed(1) + '%';
        const economia = `R$ ${(deferidas * 38.50).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

        return [municipio, recebidas.toString(), deferidas.toString(), recusadas.toString(), aprovacao, economia];
      });

      autoTable(doc, {
        startY: 45,
        head: [['Município', 'Solicitações', 'Deferidas', 'Recusadas', '% Aprovação', 'Economia Gerada']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [40, 53, 147] }, // Azul royal
        styles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      doc.save('relatorio-completo-municipios.pdf');
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar relatório completo.');
    } finally {
      setIsGeneratingFullPdf(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500" ref={printRef}>
      
      {/* 1. Barra Superior de Filtros Globais */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4" data-html2canvas-ignore="false">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FilterX size={20} className="text-rosa" /> Filtros Globais
          </h2>
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
              <FilterX size={16} /> Limpar
            </button>
            <button className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-rosa rounded-lg hover:bg-pink-600 transition-colors shadow-sm">
              <Filter size={16} /> Filtrar
            </button>
            
            <div className="w-px h-8 bg-slate-200 mx-1 hidden md:block"></div>
            
            {/* Botões de Relatório */}
            <button 
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-azul-royal rounded-lg hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-70"
            >
              <Download size={16} /> 
              {isGeneratingPdf ? 'Gerando...' : 'PDF (Visual)'}
            </button>
            
            <button 
              onClick={handleDownloadFullReport}
              disabled={isGeneratingFullPdf}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70"
            >
              <FileText size={16} /> 
              {isGeneratingFullPdf ? 'Gerando...' : 'PDF Completo (Cidades)'}
            </button>

            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-ciano rounded-lg hover:bg-cyan-400 transition-colors shadow-sm">
              <RefreshCw size={16} /> Atualizar
            </button>
          </div>
        </div>

        {/* Linha principal de filtros */}
        <div className="flex flex-wrap gap-4">
          
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 uppercase">Funcionário (Visão Atendente)</label>
            <div className="relative">
              <Briefcase size={16} className="absolute left-3 top-3 text-slate-400" />
              <select 
                value={selectedFuncionario}
                onChange={(e) => setSelectedFuncionario(e.target.value)}
                className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-ciano transition-colors"
              >
                <option value="">Visão Geral (Todos)</option>
                {mockAgentes.map(agente => <option key={agente} value={agente}>{agente}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 uppercase">Intervalo de Datas</label>
            <select 
              value={dateInterval}
              onChange={(e) => setDateInterval(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-ciano transition-colors"
            >
              <option>Hoje</option>
              <option>Últimos 7 dias</option>
              <option>Mês Atual</option>
              <option>Ano de 2026</option>
              <option>Período Customizado...</option>
            </select>
          </div>

          {dateInterval === 'Período Customizado...' && (
            <div className="flex flex-col gap-1 min-w-[300px] animate-in slide-in-from-top-2">
              <label className="text-xs font-semibold text-ciano uppercase flex items-center gap-1">
                <Calendar size={12} /> Defina o Período
              </label>
              <div className="flex items-center gap-2">
                <input type="date" className="w-full p-2.5 bg-cyan-50 border border-cyan-200 rounded-lg text-sm text-slate-700 outline-none focus:border-ciano transition-colors" />
                <span className="text-slate-400 text-sm font-medium">até</span>
                <input type="date" className="w-full p-2.5 bg-cyan-50 border border-cyan-200 rounded-lg text-sm text-slate-700 outline-none focus:border-ciano transition-colors" />
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 uppercase">Localidade</label>
            <select className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-ciano transition-colors">
              <option>Todos (Piauí)</option>
              <optgroup label="Teresina - Zona Sul">
                {bairrosTeresina["Zona Sul"].map(b => <option key={b}>{b}</option>)}
              </optgroup>
              <optgroup label="Teresina - Zona Norte">
                {bairrosTeresina["Zona Norte"].map(b => <option key={b}>{b}</option>)}
              </optgroup>
              <optgroup label="Teresina - Zona Leste">
                {bairrosTeresina["Zona Leste"].map(b => <option key={b}>{b}</option>)}
              </optgroup>
              <optgroup label="Teresina - Zona Sudeste">
                {bairrosTeresina["Zona Sudeste"].map(b => <option key={b}>{b}</option>)}
              </optgroup>
              <optgroup label="Outros Municípios">
                {municipiosPiaui.map(m => <option key={m}>{m}</option>)}
              </optgroup>
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 uppercase">Canal de Entrada (Origem)</label>
            <select 
              value={channel}
              onChange={(e) => {
                setChannel(e.target.value);
                setSelectedPersonQr(''); 
                setMatricula('');
              }}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-ciano transition-colors"
            >
              <option>Todos</option>
              <option>App Mobile</option>
              <option>Portal Web (QR Code)</option>
              <option>Cadastro Offline (Agentes)</option>
              <option>Conciliados por Matrícula</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 uppercase">Status da Solicitação</label>
            <select 
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-ciano transition-colors"
            >
              <option>Todos</option>
              <option>Ativos</option>
              <option>Em Análise</option>
              <option>Recusados</option>
            </select>
          </div>

          {/* Dinâmico: QR Code */}
          {channel === 'Portal Web (QR Code)' && (
            <>
              <div className="flex flex-col gap-1 flex-1 min-w-[200px] animate-in slide-in-from-top-2">
                <label className="text-xs font-semibold text-rosa uppercase flex items-center gap-1">
                  <Users size={12} /> Selecionar Agente
                </label>
                <select 
                  value={selectedPersonQr}
                  onChange={(e) => setSelectedPersonQr(e.target.value)}
                  className="p-2.5 bg-pink-50 border border-pink-200 rounded-lg text-sm text-slate-700 outline-none focus:border-rosa transition-colors"
                >
                  <option value="">-- Selecione uma pessoa --</option>
                  {mockAgentes.map(agente => (
                    <option key={agente} value={agente}>{agente}</option>
                  ))}
                </select>
              </div>

              {selectedPersonQr && (
                <div className="flex flex-col gap-1 flex-1 min-w-[200px] animate-in slide-in-from-top-2">
                  <label className="text-xs font-semibold text-rosa uppercase">QR Codes Gerados</label>
                  <select className="p-2.5 bg-pink-50 border border-pink-200 rounded-lg text-sm text-slate-700 outline-none focus:border-rosa transition-colors">
                    {mockQrCodesPorAgente[selectedPersonQr]?.map(qr => (
                      <option key={qr}>{qr}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Dinâmico: Matrícula */}
          {channel === 'Conciliados por Matrícula' && (
            <div className="flex flex-col gap-1 flex-1 min-w-[250px] animate-in slide-in-from-top-2">
              <label className="text-xs font-semibold text-azul-royal uppercase">Número da Matrícula</label>
              <input 
                type="text" 
                placeholder="Ex: 12345678-9"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-slate-700 outline-none focus:border-azul-royal transition-colors" 
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. KPIs Executivos */}
      
      {/* Visão de Funcionário Específico */}
      {selectedFuncionario ? (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <h3 className="text-sm font-bold text-slate-700 mb-3 ml-1 uppercase tracking-wider flex items-center gap-2">
            <Briefcase size={16} className="text-rosa" /> Desempenho do Funcionário: <span className="text-rosa">{selectedFuncionario}</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-rosa transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xs font-semibold text-slate-500 leading-tight">Solicitações Atendidas</h4>
                <ClipboardCheck size={16} className="text-emerald-500" />
              </div>
              <span className="text-2xl font-bold text-slate-800">1.240</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-rosa transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xs font-semibold text-slate-500 leading-tight">Famílias Atendidas</h4>
                <Users size={16} className="text-rosa" />
              </div>
              <span className="text-2xl font-bold text-slate-800">1.198</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-rosa transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xs font-semibold text-slate-500 leading-tight">Recusados</h4>
                <XCircle size={16} className="text-red-500" />
              </div>
              <span className="text-2xl font-bold text-slate-800">42</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-rosa transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xs font-semibold text-slate-500 leading-tight">Tempo Médio</h4>
                <Clock size={16} className="text-ciano" />
              </div>
              <span className="text-2xl font-bold text-slate-800">24h</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-rosa transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xs font-semibold text-slate-500 leading-tight">Média por Dia</h4>
                <TrendingUp size={16} className="text-orange-500" />
              </div>
              <span className="text-2xl font-bold text-slate-800">45</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-rosa transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xs font-semibold text-slate-500 leading-tight">Links (QR) por Dia</h4>
                <LinkIcon size={16} className="text-azul-royal" />
              </div>
              <span className="text-2xl font-bold text-slate-800">12</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-rosa transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xs font-semibold text-slate-500 leading-tight">Valor de Economia</h4>
                <CircleDollarSign size={16} className="text-green-600" />
              </div>
              <span className="text-2xl font-bold text-slate-800 text-nowrap">R$ 46k</span>
            </div>

          </div>
        </div>
      ) : (
        /* Visão Geral (Sem funcionário específico) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-semibold text-slate-500">Famílias Beneficiadas</h3>
              <div className="p-2 bg-pink-50 rounded-lg"><Users size={20} className="text-rosa" /></div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-slate-800">{filteredStats ? filteredStats?.total : "..."}</span>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">+12,4%</span>
                <span className="text-xs text-slate-400">este mês</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-semibold text-slate-500">Fila de Triagem</h3>
              <div className="p-2 bg-orange-50 rounded-lg"><ClipboardList size={20} className="text-orange-500" /></div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-slate-800">{filteredStats ? filteredStats?.pendentes : "..."}</span>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-200">
                  48 aguardando fotos
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-semibold text-slate-500">Índice de Deferimento</h3>
              <div className="p-2 bg-cyan-50 rounded-lg"><CheckCircle2 size={20} className="text-ciano" /></div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-slate-800">{filteredStats ? (filteredStats?.aprovadas / (filteredStats?.total||1) * 100).toFixed(1) + "%" : "..."}</span>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Tempo médio:</span>
                <span className="text-xs font-bold text-azul-royal">36 horas</span>
              </div>
            </div>
          </div>

          
        </div>
      )}

      {/* 3. Gráficos com Alternador Dinâmico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
        
        {/* Gráfico 1: Evolução */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-6" data-html2canvas-ignore="true">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Evolução Temporal {selectedFuncionario && <span className="text-sm font-normal text-slate-400">({selectedFuncionario})</span>}
            </h3>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button onClick={() => setChart1Type('bar')} className={`p-1.5 rounded-md transition-all ${chart1Type === 'bar' ? 'bg-white shadow-sm text-rosa' : 'text-slate-400 hover:text-slate-600'}`}><BarChart2 size={18} /></button>
              <button onClick={() => setChart1Type('line')} className={`p-1.5 rounded-md transition-all ${chart1Type === 'line' ? 'bg-white shadow-sm text-rosa' : 'text-slate-400 hover:text-slate-600'}`}><LineChartIcon size={18} /></button>
              <button onClick={() => setChart1Type('area')} className={`p-1.5 rounded-md transition-all ${chart1Type === 'area' ? 'bg-white shadow-sm text-rosa' : 'text-slate-400 hover:text-slate-600'}`}><Activity size={18} /></button>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chart1Type === 'bar' ? (
                <BarChart data={filteredStats?.evolution || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" />
                  <Bar dataKey="recebidas" name="Inscrições Recebidas" fill="#00E5FF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deferidas" name="Concessões Deferidas" fill="#FF007F" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chart1Type === 'line' ? (
                <LineChart data={filteredStats?.evolution || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" />
                  <Line type="monotone" dataKey="recebidas" name="Inscrições Recebidas" stroke="#00E5FF" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey="deferidas" name="Concessões Deferidas" stroke="#FF007F" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                </LineChart>
              ) : (
                <AreaChart data={filteredStats?.evolution || []}>
                  <defs>
                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDef" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF007F" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FF007F" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="recebidas" name="Inscrições Recebidas" stroke="#00E5FF" strokeWidth={2} fillOpacity={1} fill="url(#colorRec)" />
                  <Area type="monotone" dataKey="deferidas" name="Concessões Deferidas" stroke="#FF007F" strokeWidth={2} fillOpacity={1} fill="url(#colorDef)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Ranking Bairros */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-6" data-html2canvas-ignore="true">
            <h3 className="text-lg font-bold text-slate-800">Ranking por Bairro</h3>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button onClick={() => setChart2Type('horizontal')} className={`p-1.5 rounded-md transition-all ${chart2Type === 'horizontal' ? 'bg-white shadow-sm text-ciano' : 'text-slate-400 hover:text-slate-600'}`}><LayoutTemplate size={18} className="rotate-90" /></button>
              <button onClick={() => setChart2Type('vertical')} className={`p-1.5 rounded-md transition-all ${chart2Type === 'vertical' ? 'bg-white shadow-sm text-ciano' : 'text-slate-400 hover:text-slate-600'}`}><BarChart2 size={18} /></button>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredStats?.rankingBairros || []} layout={chart2Type === 'horizontal' ? 'vertical' : 'horizontal'}>
                <CartesianGrid strokeDasharray="3 3" horizontal={chart2Type === 'vertical'} vertical={chart2Type === 'horizontal'} stroke="#E2E8F0" />
                {chart2Type === 'horizontal' ? (
                  <>
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} />
                  </>
                ) : (
                  <>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                  </>
                )}
                <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" name="Solicitações" fill="#283593" radius={chart2Type === 'horizontal' ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
                  {mockRankingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 3: Perfil da Moradia */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-6" data-html2canvas-ignore="true">
            <h3 className="text-lg font-bold text-slate-800">Perfil da Moradia</h3>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button onClick={() => setChart3Type('donut')} className={`p-1.5 rounded-md transition-all ${chart3Type === 'donut' ? 'bg-white shadow-sm text-azul-royal' : 'text-slate-400 hover:text-slate-600'}`}><Activity size={18} /></button>
              <button onClick={() => setChart3Type('pie')} className={`p-1.5 rounded-md transition-all ${chart3Type === 'pie' ? 'bg-white shadow-sm text-azul-royal' : 'text-slate-400 hover:text-slate-600'}`}><PieChartIcon size={18} /></button>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredStats?.perfilMoradia || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={chart3Type === 'donut' ? 80 : 0}
                  outerRadius={120}
                  paddingAngle={chart3Type === 'donut' ? 3 : 0}
                  dataKey="value"
                  stroke="none"
                >
                  {mockProfileData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
