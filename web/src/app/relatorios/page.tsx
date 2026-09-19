'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { getRelatorioData } from '../actions/relatorios';
import { 
  FileSpreadsheet, Filter, Database, Download, MapPin, 
  Calendar, UserCheck, CheckSquare, Layers, Search, AlertCircle, Smartphone
} from 'lucide-react';
import { municipiosPiaui, bairrosTeresina } from '@/data/locations';
import * as XLSX from 'xlsx';

export default function RelatoriosPage() {
  const [realData, setRealData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getRelatorioData().then(data => {
      setRealData(data);
      setIsLoading(false);
    });
  }, []);
  
  // --- STATE DE FILTROS AVANÇADOS ---
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [municipioFiltro, setMunicipioFiltro] = useState('Todos');
  const [zonaFiltro, setZonaFiltro] = useState('Todas');
  const [statusFiltro, setStatusFiltro] = useState('Todos');
  const [analistaFiltro, setAnalistaFiltro] = useState('Todos');
  const [canalFiltro, setCanalFiltro] = useState('Todos');
  
  // Filtros Técnicos
  const [tamanhoFiltro, setTamanhoFiltro] = useState('Todos');
  const [estruturaFiltro, setEstruturaFiltro] = useState('Todas');
  const [pisoFiltro, setPisoFiltro] = useState('Todos');

  // Lógica de Filtragem (Motor de Busca)
  const dadosFiltrados = useMemo(() => {
    return realData.filter(item => {
      if (dataInicio && new Date(item.dataEntrada) < new Date(dataInicio)) return false;
      if (dataFim && new Date(item.dataEntrada) > new Date(dataFim)) return false;
      if (municipioFiltro !== 'Todos' && item.municipio !== municipioFiltro) return false;
      if (zonaFiltro !== 'Todas' && item.zona !== zonaFiltro) return false;
      if (statusFiltro !== 'Todos' && item.status !== statusFiltro) return false;
      if (analistaFiltro !== 'Todos' && item.analista !== analistaFiltro) return false;
      if (canalFiltro !== 'Todos' && item.canal !== canalFiltro) return false;
      if (tamanhoFiltro !== 'Todos' && item.tamanhoImovel !== tamanhoFiltro) return false;
      if (estruturaFiltro !== 'Todas' && item.estrutura !== estruturaFiltro) return false;
      if (pisoFiltro !== 'Todos' && item.piso !== pisoFiltro) return false;
      return true;
    });
  }, [
    dataInicio, dataFim, municipioFiltro, zonaFiltro, statusFiltro, 
    analistaFiltro, canalFiltro, tamanhoFiltro, estruturaFiltro, pisoFiltro
  ]);

  // Geração de Planilha Bruta (Tabela Dinâmica Ready)
  const analistasUnicos = useMemo(() => {
    const set = new Set(realData.map(d => d.analista));
    return Array.from(set).sort();
  }, [realData]);

  const handleExportarBase = () => {
    // Formatação exata para facilitar tabela dinâmica no Excel
    const baseExportacao = dadosFiltrados.map(d => ({
      'CÓDIGO': d.id,
      'DATA ENTRADA': d.dataEntrada.split('-').reverse().join('/'),
      'DATA ENCERRAMENTO': d.dataEncerramento === '-' ? '-' : d.dataEncerramento.split('-').reverse().join('/'),
      'STATUS': d.status,
      'MUNICÍPIO': d.municipio,
      'ZONA': d.zona,
      'BAIRRO': d.bairro,
      'CANAL ORIGEM': d.canal,
      'ANALISTA RESP.': d.analista,
      'TAMANHO IMÓVEL': d.tamanhoImovel,
      'ESTRUTURA CONSTRUTIVA': d.estrutura,
      'PISO INTERNO': d.piso,
      'ECONOMIA GERADA (R$)': parseFloat(d.economiaMensalEstimada)
    }));

    const worksheet = XLSX.utils.json_to_sheet(baseExportacao);
    
    // Auto-ajuste simples de colunas
    const wscols = [
      { wch: 10 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 20 }, 
      { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, 
      { wch: 25 }, { wch: 20 }, { wch: 20 }
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Base de Dados (Raw)");
    
    XLSX.writeFile(workbook, "Extracao_Relatorio_TarifaSocial.xlsx");
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-6 rounded-2xl shadow-md text-white">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database size={24} className="text-ciano" /> Extração de Dados e Relatórios
          </h1>
          <p className="text-sm text-slate-300 mt-1">Gere bases brutas (Raw Data) para cruzamento de dados e Tabelas Dinâmicas no Excel.</p>
        </div>
        <button 
          onClick={handleExportarBase}
          className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-slate-900 bg-ciano rounded-xl hover:bg-cyan-300 transition-colors shadow-sm"
        >
          <FileSpreadsheet size={20} />
          Exportar Base de Dados (.xlsx)
        </button>
      </div>

      {/* MOTOR DE FILTROS AVANÇADOS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider border-b border-slate-100 pb-3">
          <Filter size={16} className="text-rosa" /> Painel de Filtros Profundos
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
          
          {/* Dimensão: Tempo */}
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <Calendar size={12} /> Período de Entrada
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-ciano transition-colors"
              />
              <span className="text-slate-400 font-medium">até</span>
              <input 
                type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-ciano transition-colors"
              />
            </div>
          </div>

          {/* Dimensão: Geografia */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <MapPin size={12} /> Município
            </label>
            <select 
              value={municipioFiltro} onChange={e => { setMunicipioFiltro(e.target.value); if(e.target.value !== 'Teresina') setZonaFiltro('Todas'); }}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-ciano transition-colors"
            >
              <option value="Todos">Todos os Municípios</option>
              {municipiosPiaui.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <MapPin size={12} /> Zona (Teresina)
            </label>
            <select 
              disabled={municipioFiltro !== 'Teresina' && municipioFiltro !== 'Todos'}
              value={zonaFiltro} onChange={e => setZonaFiltro(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-ciano disabled:opacity-50 transition-colors"
            >
              <option value="Todas">Todas as Zonas</option>
              <option value="Zona Sul">Zona Sul</option>
              <option value="Zona Norte">Zona Norte</option>
              <option value="Zona Leste">Zona Leste</option>
              <option value="Zona Sudeste">Zona Sudeste</option>
            </select>
          </div>

          {/* Dimensão: Operacional */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <CheckSquare size={12} /> Status Global
            </label>
            <select 
              value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-ciano transition-colors"
            >
              <option value="Todos">Todos</option>
              <option value="Pendente">Pendente</option>
              <option value="Em Análise">Em Análise</option>
              <option value="Aprovada">Aprovada</option>
              <option value="Recusada">Recusada</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <UserCheck size={12} /> Analista Responsável
            </label>
            <select 
              value={analistaFiltro} onChange={e => setAnalistaFiltro(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-ciano transition-colors"
            >
              <option value="Todos">Qualquer Analista</option>
              {analistasUnicos.map(a => <option key={a} value={a}>{a === 'Sistema' ? 'Sistema (Auto)' : a}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <Smartphone size={12} /> Canal de Origem
            </label>
            <select 
              value={canalFiltro} onChange={e => setCanalFiltro(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-ciano transition-colors"
            >
              <option value="Todos">Todas as Origens</option>
              <option value="App">Aplicativo Meu Social+</option>
              <option value="QR Code">Portal Web (QR Code)</option>
              <option value="Agente">Cadastro Offline (Agente)</option>
            </select>
          </div>

          {/* Dimensão: Técnica / Imóvel (EXCLUSIVO RELATÓRIOS) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 text-azul-royal">
              <Layers size={12} /> Estrutura da Moradia
            </label>
            <select 
              value={estruturaFiltro} onChange={e => setEstruturaFiltro(e.target.value)}
              className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-sm outline-none focus:border-azul-royal transition-colors"
            >
              <option value="Todas">Todas</option>
              <option value="Alvenaria Compacta">Alvenaria Compacta</option>
              <option value="Taipa">Taipa</option>
              <option value="Madeira">Madeira</option>
              <option value="Mista">Mista</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 text-azul-royal">
              <Layers size={12} /> Piso Interno
            </label>
            <select 
              value={pisoFiltro} onChange={e => setPisoFiltro(e.target.value)}
              className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-sm outline-none focus:border-azul-royal transition-colors"
            >
              <option value="Todos">Todos</option>
              <option value="Chão Batido">Chão Batido</option>
              <option value="Cimento Queimado">Cimento Queimado</option>
              <option value="Cerâmica Simples">Cerâmica Simples</option>
            </select>
          </div>

        </div>

        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-2 mt-2">
          <AlertCircle size={16} className="text-amber-600" />
          <p className="text-xs text-amber-800">
            <strong>Dica:</strong> Para análises avançadas (ex: cruzamento de Estrutura vs. Bairro), gere a planilha e utilize o recurso de <strong>Tabela Dinâmica (Pivot Table)</strong> no Microsoft Excel ou Google Sheets.
          </p>
        </div>

      </div>

      {/* PRÉVIA DOS DADOS BRUTOS */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Search size={16} /> Prévia da Base de Dados ({dadosFiltrados.length} registros encontrados)
          </h3>
          <span className="text-xs text-slate-400">Mostrando apenas os 10 primeiros resultados</span>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-800 text-slate-200 text-[10px] uppercase font-bold tracking-wider">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Dt. Entrada</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Município</th>
                <th className="px-4 py-3">Zona</th>
                <th className="px-4 py-3">Analista</th>
                <th className="px-4 py-3">Estrutura</th>
                <th className="px-4 py-3">Piso</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600 divide-y divide-slate-100">
              {dadosFiltrados.slice(0, 10).map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-slate-900">{row.id}</td>
                  <td className="px-4 py-2">{row.dataEntrada}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.status === 'Aprovada' ? 'bg-green-100 text-green-700' :
                      row.status === 'Recusada' ? 'bg-red-100 text-red-700' : 'bg-slate-100'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-medium">{row.municipio}</td>
                  <td className="px-4 py-2">{row.zona}</td>
                  <td className="px-4 py-2">{row.analista}</td>
                  <td className="px-4 py-2">{row.estrutura}</td>
                  <td className="px-4 py-2">{row.piso}</td>
                </tr>
              ))}
              {dadosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Nenhum dado encontrado para a combinação de filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
