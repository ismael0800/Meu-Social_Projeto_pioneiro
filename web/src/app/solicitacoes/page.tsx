'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { getSolicitacoesList } from '../actions/solicitacoes';
import Link from 'next/link';
import { 
  Search, Filter, FileSpreadsheet, ArrowUpDown,  
  MapPin, UserCheck, Clock, CheckCircle2, XCircle, 
  AlertCircle, Eye, MoreVertical, Calendar
} from 'lucide-react';
import { municipiosPiaui, bairrosTeresina } from '@/data/locations';
import * as XLSX from 'xlsx';

// --- MOCK DATA ---
const mockFuncionarios = ['Ana Rita', 'Carlos Mendes', 'Juliana Costa', 'Marcos Silva', 'Sistema (Auto)'];

type Solicitacao = {
  id: string;
  nome: string;
  cpf: string;
  cidade: string;
  bairro: string;
  dataCriacao: string; // YYYY-MM-DD
  dataAtualizacao: string; // YYYY-MM-DD
  dataEncerramento: string | null; // Data que foi aprovada/recusada, null se pendente
  status: 'Pendente' | 'Em Análise' | 'Aprovada' | 'Recusada';
  funcionario: string;
};

const initialData: Solicitacao[] = [];
// Dados carregados dinamicamente via useEffect

export default function SolicitacoesPage() {
  const [realData, setRealData] = useState<Solicitacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    getSolicitacoesList().then(data => {
      setRealData(data);
      setIsLoading(false);
    });
  }, []);

  
  // Filtros UI State
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('Todos');
  const [ordemFiltro, setOrdemFiltro] = useState('data_desc');
  const [funcionarioFiltro, setFuncionarioFiltro] = useState('Todos');
  const [localidadeFiltro, setLocalidadeFiltro] = useState('Todas'); // Agora serve para cidade ou bairro

  // Filtros Aplicados State (para o botão "Filtrar")
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    busca: '',
    status: 'Todos',
    ordem: 'data_desc',
    funcionario: 'Todos',
    localidade: 'Todas'
  });

  const handleFiltrar = () => {
    setFiltrosAplicados({
      busca,
      status: statusFiltro,
      ordem: ordemFiltro,
      funcionario: funcionarioFiltro,
      localidade: localidadeFiltro
    });
  };

  // Processamento dos dados filtrados
  useEffect(() => { setCurrentPage(1); }, [filtrosAplicados, realData]);

  const dadosFiltrados = useMemo(() => {
    let dados = [...realData];

    // Busca de texto
    if (filtrosAplicados.busca) {
      const lowerBusca = filtrosAplicados.busca.toLowerCase();
      dados = dados.filter(d => 
        d.nome.toLowerCase().includes(lowerBusca) || 
        d.id.toLowerCase().includes(lowerBusca) ||
        d.cpf.includes(filtrosAplicados.busca)
      );
    }

    // Status
    if (filtrosAplicados.status !== 'Todos') {
      dados = dados.filter(d => d.status === filtrosAplicados.status);
    }

    // Localidade (Pode ser uma cidade do Piauí ou um bairro específico de Teresina)
    if (filtrosAplicados.localidade !== 'Todas') {
      dados = dados.filter(d => d.cidade === filtrosAplicados.localidade || d.bairro === filtrosAplicados.localidade);
    }

    // Funcionário
    if (filtrosAplicados.funcionario !== 'Todos') {
      if (filtrosAplicados.funcionario === 'Encerrados por Funcionários') {
        dados = dados.filter(d => ['Aprovada', 'Recusada'].includes(d.status) && d.funcionario !== 'Sistema (Auto)' && d.funcionario !== 'Aguardando');
      } else {
        dados = dados.filter(d => d.funcionario === filtrosAplicados.funcionario);
      }
    }

    // Ordenação
    dados.sort((a, b) => {
      switch (filtrosAplicados.ordem) {
        case 'data_desc':
          return new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime();
        case 'data_asc':
          return new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime();
        case 'alpha_asc':
          return a.nome.localeCompare(b.nome);
        case 'mod_desc':
          return new Date(b.dataAtualizacao).getTime() - new Date(a.dataAtualizacao).getTime();
        default:
          return 0;
      }
    });

    return dados;
  }, [filtrosAplicados]);

  // Função para exportar Excel
  const handleExportarPlanilha = () => {
    // Preparar dados para o Excel
    const dadosExcel = dadosFiltrados.map(d => ({
      'Código': d.id,
      'Solicitante': d.nome,
      'CPF': d.cpf,
      'Cidade': d.cidade,
      'Bairro': d.bairro,
      'Data de Entrada': d.dataCriacao.split('-').reverse().join('/'),
      'Data de Encerramento': d.dataEncerramento ? d.dataEncerramento.split('-').reverse().join('/') : '*',
      'Status': d.status,
      'Responsável': d.funcionario
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Solicitações");
    
    XLSX.writeFile(workbook, "Relatorio_Solicitacoes_Tarifa_Social.xlsx");
  };

  // Helper para Badges de Status
  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'Aprovada':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircle2 size={12}/> Aprovada</span>;
      case 'Recusada':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 border border-red-200"><XCircle size={12}/> Recusada</span>;
      case 'Em Análise':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200"><Clock size={12}/> Em Análise</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200"><AlertCircle size={12}/> Pendente</span>;
    }
  };

    const dadosPaginados = dadosFiltrados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      
      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Solicitações de Tarifa Social</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie, filtre e audite todas as entradas do programa.</p>
        </div>
        <button 
          onClick={handleExportarPlanilha}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-green-700 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200 hover:text-green-800 transition-colors shadow-sm"
        >
          <FileSpreadsheet size={18} />
          Gerar Planilha (.xlsx)
        </button>
      </div>

      {/* Card de Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-5">
        
        {/* Linha 1: Busca Livre */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por Nome, CPF ou ID da Solicitação..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-ciano transition-colors"
          />
        </div>

        {/* Linha 2: Dropdowns de Filtro */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Situação */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Situação</label>
            <select 
              value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-ciano transition-colors"
            >
              <option value="Todos">Todas as Situações</option>
              <option value="Pendente">Pendente</option>
              <option value="Em Análise">Em Análise</option>
              <option value="Aprovada">Aprovada</option>
              <option value="Recusada">Recusada</option>
            </select>
          </div>

          {/* Organização (Ordem) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Organizar por</label>
            <div className="relative">
              <ArrowUpDown size={14} className="absolute left-3 top-3 text-slate-400" />
              <select 
                value={ordemFiltro} onChange={(e) => setOrdemFiltro(e.target.value)}
                className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-ciano transition-colors"
              >
                <option value="data_desc">Data (Mais Recentes)</option>
                <option value="data_asc">Data (Mais Antigas)</option>
                <option value="mod_desc">Últimas Modificações</option>
                <option value="alpha_asc">Ordem Alfabética (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Localidade (Cidade ou Bairro) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Localidade</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-3 text-slate-400" />
              <select 
                value={localidadeFiltro} onChange={(e) => setLocalidadeFiltro(e.target.value)}
                className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-ciano transition-colors"
              >
                <option value="Todas">Todas as Regiões</option>
                
                <optgroup label="Teresina - Zonas e Bairros">
                  {bairrosTeresina["Zona Sul"].map(b => <option key={b} value={b}>Zona Sul - {b}</option>)}
                  {bairrosTeresina["Zona Norte"].map(b => <option key={b} value={b}>Zona Norte - {b}</option>)}
                  {bairrosTeresina["Zona Leste"].map(b => <option key={b} value={b}>Zona Leste - {b}</option>)}
                  {bairrosTeresina["Zona Sudeste"].map(b => <option key={b} value={b}>Zona Sudeste - {b}</option>)}
                </optgroup>

                <optgroup label="Outros Municípios (Piauí)">
                  {municipiosPiaui.map(m => <option key={m} value={m}>{m}</option>)}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Responsável/Funcionário */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Responsável</label>
            <div className="relative">
              <UserCheck size={14} className="absolute left-3 top-3 text-slate-400" />
              <select 
                value={funcionarioFiltro} onChange={(e) => setFuncionarioFiltro(e.target.value)}
                className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-ciano transition-colors"
              >
                <option value="Todos">Todos (Incluir Auto)</option>
                <option value="Encerrados por Funcionários">Apenas Encerrados por Funcionários</option>
                <optgroup label="Funcionários Específicos">
                  {mockFuncionarios.map(f => <option key={f} value={f}>{f}</option>)}
                </optgroup>
              </select>
            </div>
          </div>

        </div>

        {/* Linha 3: Botão de Ação */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button 
            onClick={handleFiltrar}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-rosa rounded-lg hover:bg-pink-600 transition-colors shadow-md"
          >
            <Filter size={18} /> Filtrar Resultados
          </button>
        </div>

      </div>

      {/* Resumo de Exibição */}
      <div className="flex items-center text-sm text-slate-500 font-medium">
        Exibindo <span className="text-slate-800 font-bold mx-1">{dadosFiltrados.length}</span> resultados de acordo com os filtros.
      </div>

      {/* Tabela de Dados Corporativa */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4 w-28">Código</th>
                <th className="p-4 min-w-[200px]">Solicitante</th>
                <th className="p-4">Localidade</th>
                <th className="p-4 text-center">Datas</th>
                <th className="p-4 text-center">Situação</th>
                <th className="p-4">Responsável</th>
                <th className="p-4 text-center w-16">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {dadosFiltrados.length > 0 ? (
                dadosPaginados.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-500">{item.id}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{item.nome}</div>
                      <div className="text-xs text-slate-400 mt-0.5">CPF: {item.cpf}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{item.cidade}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{item.bairro}</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5 text-slate-600" title="Data de Entrada">
                          <Calendar size={12} className="text-slate-400"/> 
                          {item.dataCriacao.split('-').reverse().join('/')}
                        </div>
                        <div className={`text-xs font-medium px-2 py-0.5 rounded ${item.dataEncerramento ? 'bg-slate-100 text-slate-600' : 'bg-transparent text-slate-400'}`} title="Data de Encerramento">
                          {item.dataEncerramento ? `Fim: ${item.dataEncerramento.split('-').reverse().join('/')}` : '*'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {renderStatusBadge(item.status)}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">
                        {item.funcionario}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link href={`/solicitacoes/${item.id}`} className="p-2 text-slate-400 hover:text-ciano hover:bg-cyan-50 rounded-lg transition-colors mx-auto block w-fit">
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhuma solicitação encontrada com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Controles de Paginação Elegantes */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
            <span className="text-sm text-slate-500 font-medium">
              Mostrando <span className="font-bold text-slate-700">{Math.min((currentPage - 1) * itemsPerPage + 1, dadosFiltrados.length)}</span> até <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, dadosFiltrados.length)}</span> de <span className="font-bold text-slate-700">{dadosFiltrados.length}</span> registros
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Anterior
              </button>
              
              <div className="flex items-center gap-1 px-3">
                <span className="text-sm font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm">
                  {currentPage}
                </span>
                <span className="text-sm text-slate-400">/</span>
                <span className="text-sm text-slate-500 font-medium">
                  {Math.max(1, Math.ceil(dadosFiltrados.length / itemsPerPage))}
                </span>
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(dadosFiltrados.length / itemsPerPage), p + 1))}
                disabled={currentPage >= Math.ceil(dadosFiltrados.length / itemsPerPage)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
