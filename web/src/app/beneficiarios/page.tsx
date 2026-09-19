'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Smartphone, QrCode, WifiOff, X, 
  CheckCircle2, Clock, XCircle, FileText, ChevronRight, User, MapPin,
  ArrowUpDown, ChevronUp, ChevronDown, Paperclip, ImageIcon, FileSignature
} from 'lucide-react';
import { getBeneficiariosData } from '../actions/dashboard';

type Historico = {
  data: string;
  evento: string;
};

type Beneficiario = {
  id: string;
  nome: string;
  matricula: string;
  origem: 'APP' | 'QR_CODE' | 'OFFLINE' | string;
  detalheOrigem: string;
  status: 'ATIVO' | 'EM_ANALISE' | 'RECUSADO' | string;
  dataInscricao: string;
  cpf: string;
  endereco: string;
  historico: Historico[];
};


type SortField = 'nome' | 'data' | null;

export default function BeneficiariosPage() {
  const [beneficiariosList, setBeneficiariosList] = useState<Beneficiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getBeneficiariosData().then(data => {
      setBeneficiariosList(data);
      setLoading(false);
    });
  }, []);
  const [origemFiltro, setOrigemFiltro] = useState<string>('TODOS');
  const [selectedBen, setSelectedBen] = useState<Beneficiario | null>(null);

  // Estados de Edição de Status
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [draftStatus, setDraftStatus] = useState<string>('');
  const [draftMotivo, setDraftMotivo] = useState<string>('');
  const [draftCustomMotivo, setDraftCustomMotivo] = useState<string>('');
  
  // Estados de Ordenação
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, origemFiltro, sortField, sortDir]);

  const getOrigemIcon = (origem: string) => {
    switch(origem) {
      case 'APP': return <Smartphone size={18} className="text-blue-500" />;
      case 'QR_CODE': return <QrCode size={18} className="text-purple-500" />;
      case 'OFFLINE': return <WifiOff size={18} className="text-slate-500" />;
      default: return null;
    }
  };

  const getOrigemLabel = (origem: string) => {
    switch(origem) {
      case 'APP': return 'Aplicativo';
      case 'QR_CODE': return 'QR Code';
      case 'OFFLINE': return 'Offline';
      default: return origem;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ATIVO': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14}/> Ativo</span>;
      case 'EM_ANALISE': return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={14}/> Em Análise</span>;
      case 'RECUSADO': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={14}/> Recusado</span>;
      default: return null;
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-slate-300 group-hover:text-slate-400 transition-colors" />;
    return sortDir === 'asc' ? <ChevronUp size={14} className="text-azul-royal" /> : <ChevronDown size={14} className="text-azul-royal" />;
  };

  const handleConfirmStatus = () => {
    if (!selectedBen || !draftStatus || !draftMotivo) return;
    if (draftMotivo === 'OUTRO' && !draftCustomMotivo) return;

    const motivoFinal = draftMotivo === 'OUTRO' ? draftCustomMotivo : draftMotivo;
    
    // Formatting date to DD/MM/YYYY HH:MM
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    let statusMsg = '';
    if (draftStatus === 'ATIVO') statusMsg = 'Benefício Ativado';
    else if (draftStatus === 'RECUSADO') statusMsg = 'Benefício Recusado';
    else statusMsg = 'Status alterado para Em Análise';

    const historyMsg = `${statusMsg} - Motivo: ${motivoFinal}`;

    const updatedBeneficiarios = beneficiariosList.map(b => {
      if (b.id === selectedBen.id) {
        const updated = {
          ...b,
          status: draftStatus as any,
          historico: [...b.historico, { data: dateStr, evento: historyMsg }]
        };
        setSelectedBen(updated);
        return updated;
      }
      return b;
    });

    setBeneficiariosList(updatedBeneficiarios);
    setIsEditingStatus(false);
  };

  let filteredData = beneficiariosList.filter(b => {
    const matchesSearch = b.nome.toLowerCase().includes(searchTerm.toLowerCase()) || b.cpf.includes(searchTerm) || b.matricula.includes(searchTerm);
    const matchesOrigem = origemFiltro === 'TODOS' || b.origem === origemFiltro;
    return matchesSearch && matchesOrigem;
  });

  if (sortField) {
    filteredData = [...filteredData].sort((a, b) => {
      if (sortField === 'nome') {
        return sortDir === 'asc' ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome);
      } else if (sortField === 'data') {
        const dateA = a.dataInscricao.split('/').reverse().join('-');
        const dateB = b.dataInscricao.split('/').reverse().join('-');
        return sortDir === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
      }
      return 0;
    });
  }

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative h-full">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <User className="text-azul-royal" size={28} />
            Beneficiários
          </h1>
          <p className="text-slate-500 mt-1">Consulte os cidadãos cadastrados, suas origens e histórico.</p>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar por Nome, CPF ou Matrícula..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ciano focus:border-transparent shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {['TODOS', 'APP', 'QR_CODE', 'OFFLINE'].map((origem) => (
            <button
              key={origem}
              onClick={() => setOrigemFiltro(origem)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                origemFiltro === origem ? 'bg-azul-royal text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {origem === 'TODOS' ? 'Todas Origens' : getOrigemLabel(origem)}
            </button>
          ))}
        </div>
      </div>

      {/* TABELA DE BENEFICIÁRIOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-semibold">
              <th 
                className="p-4 pl-6 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                onClick={() => handleSort('nome')}
              >
                <div className="flex items-center gap-2">
                  Nome do Cidadão
                  {getSortIcon('nome')}
                </div>
              </th>
              <th className="p-4">Matrícula</th>
              <th className="p-4">Origem do Cadastro</th>
              <th 
                className="p-4 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                onClick={() => handleSort('data')}
              >
                <div className="flex items-center gap-2">
                  Data Cadastro
                  {getSortIcon('data')}
                </div>
              </th>
              <th className="p-4">Status</th>
              <th className="p-4 pr-6 text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">Nenhum beneficiário encontrado.</td>
              </tr>
            ) : (
              paginatedData.map((ben) => (
                <tr key={ben.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="font-bold text-slate-800">{ben.nome}</div>
                    <div className="text-xs text-slate-400">CPF: {ben.cpf}</div>
                  </td>
                  <td className="p-4 text-slate-600 font-medium">{ben.matricula}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getOrigemIcon(ben.origem)}
                      <span className="text-sm text-slate-700 font-medium">{getOrigemLabel(ben.origem)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{ben.dataInscricao}</td>
                  <td className="p-4">{getStatusBadge(ben.status)}</td>
                  <td className="p-4 pr-6 text-right">
                    <button 
                      onClick={() => setSelectedBen(ben)}
                      className="text-ciano font-bold hover:text-azul-royal transition-colors text-sm flex items-center justify-end gap-1 w-full"
                    >
                      Ver Detalhes <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINAÇÃO */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <span className="text-sm text-slate-500">
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length} beneficiários
          </span>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 font-medium"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-slate-700 font-medium">
              Página {currentPage} de {totalPages}
            </span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 font-medium"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* MODAL / SLIDE-OVER DE DETALHES */}
      {selectedBen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Dossiê do Cidadão</h2>
              <button 
                onClick={() => setSelectedBen(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Resumo */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{selectedBen.nome}</h3>
                  <p className="text-slate-500 mt-1">Matrícula: {selectedBen.matricula}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(selectedBen.status)}
                  <button 
                    onClick={() => {
                      setIsEditingStatus(!isEditingStatus);
                      setDraftStatus(selectedBen.status);
                      setDraftMotivo('');
                      setDraftCustomMotivo('');
                    }}
                    className="text-xs text-ciano font-bold hover:text-azul-royal hover:underline transition-colors"
                  >
                    {isEditingStatus ? 'Cancelar Edição' : 'Alterar Status'}
                  </button>
                </div>
              </div>

              {/* Formulário de Edição de Status */}
              {isEditingStatus && (
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <FileText size={18} className="text-azul-royal" />
                    Atualizar Status da Solicitação
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Novo Status</label>
                      <select 
                        value={draftStatus} 
                        onChange={(e) => setDraftStatus(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-700 focus:ring-2 focus:ring-ciano focus:border-transparent outline-none"
                      >
                        <option value="EM_ANALISE">Em Análise</option>
                        <option value="ATIVO">Ativo</option>
                        <option value="RECUSADO">Recusado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Motivo / Justificativa</label>
                      <select 
                        value={draftMotivo} 
                        onChange={(e) => setDraftMotivo(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-700 focus:ring-2 focus:ring-ciano focus:border-transparent outline-none"
                      >
                        <option value="" disabled>Selecione um motivo...</option>
                        <option value="Aprovado via Auditoria">Aprovado via Auditoria</option>
                        <option value="Documentação Incompleta">Documentação Incompleta</option>
                        <option value="Documento Inlegível / Desfocado">Documento Inlegível / Desfocado</option>
                        <option value="Renda Incompatível">Renda Incompatível</option>
                        <option value="Fraude Identificada">Fraude Identificada</option>
                        <option value="OUTRO">Outro (Diverso)</option>
                      </select>
                    </div>
                  </div>
                  
                  {draftMotivo === 'OUTRO' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Especifique o Motivo</label>
                      <input 
                        type="text" 
                        value={draftCustomMotivo}
                        onChange={(e) => setDraftCustomMotivo(e.target.value)}
                        placeholder="Escreva a justificativa detalhada..."
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-700 focus:ring-2 focus:ring-ciano focus:border-transparent outline-none"
                      />
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={handleConfirmStatus}
                      disabled={!draftStatus || !draftMotivo || (draftMotivo === 'OUTRO' && !draftCustomMotivo)}
                      className="bg-azul-royal hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                    >
                      Confirmar Atualização
                    </button>
                  </div>
                </div>
              )}

              {/* Dados Pessoais */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} /> Dados Cadastrais
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">CPF</span>
                    <span className="font-semibold text-slate-700">{selectedBen.cpf}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Data de Solicitação</span>
                    <span className="font-semibold text-slate-700">{selectedBen.dataInscricao}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-slate-400 block mb-1">Endereço</span>
                    <span className="font-semibold text-slate-700 flex items-start gap-1">
                      <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                      {selectedBen.endereco}
                    </span>
                  </div>
                </div>
              </div>

              {/* Origem do Cadastro */}
              <div className={`p-5 rounded-xl border ${selectedBen.origem === 'APP' ? 'bg-blue-50 border-blue-100' : selectedBen.origem === 'QR_CODE' ? 'bg-purple-50 border-purple-100' : 'bg-slate-100 border-slate-200'}`}>
                <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 mb-2">
                  {getOrigemIcon(selectedBen.origem)} Origem da Captação
                </h4>
                <p className="font-semibold text-slate-800">{getOrigemLabel(selectedBen.origem)}</p>
                <p className="text-sm text-slate-600 mt-1">{selectedBen.detalheOrigem}</p>
              </div>

              {/* Documentos do Cidadão (Galeria / Câmera) */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Paperclip size={16} /> Documentos Anexados (Salvos)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <ImageIcon size={18} className="text-azul-royal" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Documento de Identidade</p>
                        <p className="text-[10px] text-slate-400">RG/CNH - Salvo no Perfil</p>
                      </div>
                    </div>
                    <button className="text-xs text-ciano font-bold hover:underline bg-slate-50 px-2 py-1 rounded">Ver</button>
                  </div>
                  <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <ImageIcon size={18} className="text-azul-royal" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Comprovante de Renda</p>
                        <p className="text-[10px] text-slate-400">CadÚnico - Salvo no Perfil</p>
                      </div>
                    </div>
                    <button className="text-xs text-ciano font-bold hover:underline bg-slate-50 px-2 py-1 rounded">Ver</button>
                  </div>
                </div>
              </div>

              {/* Termo de Autodeclaração / Assinatura */}
              <div className="bg-green-50 p-5 rounded-xl border border-green-200 space-y-3">
                <h4 className="text-sm font-bold text-green-700 uppercase tracking-wider flex items-center gap-2">
                  <FileSignature size={16} /> Termo de Autodeclaração
                </h4>
                <p className="text-xs text-green-800 leading-relaxed text-justify bg-green-100/50 p-3 rounded-lg">
                  O titular declarou, sob as penas da lei, que as informações prestadas no momento da solicitação são verdadeiras. Confirmou que o imóvel possui área construída de até 50m², renda mensal familiar adequada e encontra-se em situação de vulnerabilidade social.
                </p>
                <div className="flex items-center gap-2 mt-2 bg-white/80 p-2.5 rounded-lg border border-green-200">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <span className="text-xs font-bold text-green-700">Assinatura Digital Validada (Aceite Eletrônico)</span>
                </div>
              </div>

              {/* Linha do Tempo (Timeline) */}
              <div>
                <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Clock size={20} className="text-azul-royal" /> Histórico da Solicitação
                </h4>
                
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {selectedBen.historico.map((hist, index) => (
                    <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      
                      {/* Ícone da Linha */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-ciano text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <CheckCircle2 size={16} />
                      </div>
                      
                      {/* Card do Evento */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-azul-royal">{hist.data}</span>
                          <span className="text-sm font-semibold text-slate-700">{hist.evento}</span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
