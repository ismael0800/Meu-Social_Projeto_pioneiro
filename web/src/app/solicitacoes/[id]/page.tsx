'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, User, Hash, MapPin, Phone, Mail, Lock, 
  FileText, FileImage, Maximize2, CheckCircle2, XCircle, 
  AlertCircle, Camera, Check, FileCheck, FileDown, Eye,
  Play, Send, History, ThumbsUp, ThumbsDown, MessageSquareWarning, ArrowRightLeft, Clock, FileSignature
} from 'lucide-react';

// Mock do usuário logado no sistema
const CURRENT_USER = 'Você (Ana Rita)';

type LogEntry = {
  id: number;
  dataHora: string;
  usuario: string;
  acao: string;
};

type DocStatus = 'Pendente' | 'Aprovado' | 'Recusado';

export default function SolicitacaoDetailsPage({ params }: { params: { id: string } }) {
  
  // --- STATE PRINCIPAL ---
  const [statusGlobal, setStatusGlobal] = useState<'Esperando Análise' | 'Em Análise' | 'Aprovada' | 'Recusada'>('Esperando Análise');
  const [analistaAtual, setAnalistaAtual] = useState<string | null>(null);

  // --- STATE DOS ARQUIVOS ---
  const [documentos, setDocumentos] = useState([
    { id: 1, tipo: 'Identificação Oficial', descricao: 'RG (Frente e Verso)', formato: 'PDF', status: 'Pendente' as DocStatus },
    { id: 2, tipo: 'CadÚnico', descricao: 'Folha Resumo (NIS: 12345678901)', formato: 'PDF', status: 'Pendente' as DocStatus },
    { id: 3, tipo: 'Fatura de Água', descricao: 'Águas de Teresina - 8m³', formato: 'PDF', status: 'Pendente' as DocStatus },
    { id: 4, tipo: 'Faturas Anteriores', descricao: 'Comprovante de Adimplência', formato: 'PDF', status: 'Pendente' as DocStatus },
  ]);

  const [fotos, setFotos] = useState([
    { id: 'f1', titulo: 'Fachada', status: 'Pendente' as DocStatus, url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80' },
    { id: 'f2', titulo: 'Piso Interno', status: 'Pendente' as DocStatus, url: 'https://images.unsplash.com/photo-1581622558667-3419a8dc5f83?w=600&q=80' },
    { id: 'f3', titulo: 'Paredes', status: 'Pendente' as DocStatus, url: 'https://images.unsplash.com/photo-1518640089240-622dc652ed9a?w=600&q=80' }
  ]);

  // --- STATE DE LOGS ---
  const [logs, setLogs] = useState<any[]>([]);

  React.useEffect(() => {
    import('../../actions/solicitacao').then(({ getSolicitacaoById }) => {
      getSolicitacaoById(params.id).then(data => {
        if (data && data.historico) {
          setLogs(data.historico.map((h: any) => ({
            id: h.id,
            dataHora: new Date(h.dataHora).toLocaleString('pt-BR'),
            usuario: h.usuario,
            acao: h.acao
          })));
        }
      });
    });
  }, [params.id]);

  const [termoValidado, setTermoValidado] = useState<DocStatus>('Pendente');

  // --- STATE MODAL ---
  const [modalAtivo, setModalAtivo] = useState<'Aprovar' | 'Recusar' | 'Alerta' | null>(null);
  const [mensagemModal, setMensagemModal] = useState('');

  // --- FUNÇÕES DE AÇÃO ---
  const registrarLog = (acao: string, usuario = CURRENT_USER) => {
    const dataHora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    setLogs(prev => [{ id: Date.now(), dataHora, usuario, acao }, ...prev]);
  };

  const handleIniciarAnalise = () => {
    setStatusGlobal('Em Análise');
    setAnalistaAtual(CURRENT_USER);
    registrarLog('Iniciou a análise da solicitação.');
  };

  const handleAssumirAnalise = () => {
    const analistaAnterior = analistaAtual;
    setAnalistaAtual(CURRENT_USER);
    registrarLog(`Assumiu a análise (anteriormente com ${analistaAnterior}).`);
  };

  const handleValidarItem = (tipo: 'doc' | 'foto' | 'termo', id: string | number, novoStatus: DocStatus, nomeItem: string) => {
    if (tipo === 'termo') {
      setTermoValidado(novoStatus);
    } else if (tipo === 'doc') {
      setDocumentos(prev => prev.map(d => d.id === id ? { ...d, status: novoStatus } : d));
    } else {
      setFotos(prev => prev.map(f => f.id === id ? { ...f, status: novoStatus } : f));
    }
    registrarLog(`Marcou o item "${nomeItem}" como ${novoStatus.toUpperCase()}.`);
  };

  const confirmarModal = () => {
    if (modalAtivo === 'Alerta') {
      registrarLog(`Enviou um ALERTA (SMS/Email) ao titular: "${mensagemModal}"`);
    } else if (modalAtivo === 'Aprovar') {
      setStatusGlobal('Aprovada');
      registrarLog(`APROVOU a solicitação. SMS/Email de sucesso enviado.${mensagemModal ? ` Obs: ${mensagemModal}` : ''}`);
    } else if (modalAtivo === 'Recusar') {
      setStatusGlobal('Recusada');
      registrarLog(`RECUSOU a solicitação. SMS/Email de rejeição enviado.${mensagemModal ? ` Obs: ${mensagemModal}` : ''}`);
    }
    setModalAtivo(null);
    setMensagemModal('');
  };

  const canEdit = statusGlobal === 'Em Análise' && analistaAtual === CURRENT_USER;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      
      {/* Barra de Navegação e Ações (TOPO) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/solicitacoes" className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800">Solicitação {params.id}</h1>
              {statusGlobal === 'Esperando Análise' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200"><Clock size={12}/> Esperando Análise</span>}
              {statusGlobal === 'Em Análise' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200"><AlertCircle size={12}/> Em Análise por {analistaAtual}</span>}
              {statusGlobal === 'Aprovada' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircle2 size={12}/> Aprovada</span>}
              {statusGlobal === 'Recusada' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 border border-red-200"><XCircle size={12}/> Recusada</span>}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">Recebida em 12/09/2026</p>
          </div>
        </div>

        {/* Botões do Topo Dinâmicos Baseados no Status */}
        <div className="flex gap-3 w-full md:w-auto">
          {statusGlobal === 'Esperando Análise' && (
            <button onClick={handleIniciarAnalise} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-azul-royal rounded-lg hover:bg-blue-800 transition-colors shadow-sm animate-pulse">
              <Play size={18} fill="currentColor" /> Iniciar Análise
            </button>
          )}

          {statusGlobal === 'Em Análise' && analistaAtual !== CURRENT_USER && (
            <button onClick={handleAssumirAnalise} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors">
              <ArrowRightLeft size={18} /> Assumir Análise (Roubar)
            </button>
          )}

          {canEdit && (
            <>
              <button onClick={() => setModalAtivo('Alerta')} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
                <MessageSquareWarning size={18} /> Enviar Alerta
              </button>
              <div className="w-px h-10 bg-slate-200 mx-1"></div>
              <button onClick={() => setModalAtivo('Recusar')} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                <XCircle size={18} /> Recusar
              </button>
              <button onClick={() => setModalAtivo('Aprovar')} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-verde-sucesso rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                <CheckCircle2 size={18} /> Aprovar Benefício
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Coluna Esquerda: Dados e Documentos */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* 1. Dados Pessoais */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <User size={18} className="text-rosa" /> Dados Pessoais e de Contato
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Nome Completo</label>
                <div className="text-sm font-medium text-slate-800 mt-1 flex items-center gap-2">
                  <User size={16} className="text-slate-400" /> Maria do Carmo Silva
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">CPF</label>
                <div className="text-sm font-medium text-slate-800 mt-1 flex items-center gap-2">
                  <FileText size={16} className="text-slate-400" /> 123.456.789-00
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Número da Matrícula</label>
                <div className="text-sm font-medium text-azul-royal mt-1 flex items-center gap-2 bg-blue-50 w-max px-2 py-1 rounded">
                  <Hash size={16} className="text-azul-royal" /> 87654321-9
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Contato</label>
                <div className="text-sm font-medium text-slate-800 mt-1 flex items-center gap-2">
                  <Phone size={16} className="text-green-500" /> (86) 99999-0000
                </div>
              </div>
            </div>
          </div>

          {/* 2. Documentação */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileCheck size={18} className="text-ciano" /> Documentação Obrigatória
              </h2>
            </div>
            <div className="p-0">
              <ul className="flex flex-col">
                {documentos.map((doc, index) => (
                  <li key={doc.id} className={`flex flex-col lg:flex-row lg:items-center justify-between p-4 ${index !== documentos.length - 1 ? 'border-b border-slate-100' : ''} ${doc.status === 'Recusado' ? 'bg-red-50' : doc.status === 'Aprovado' ? 'bg-green-50' : 'hover:bg-slate-50'} transition-colors`}>
                    
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${doc.status === 'Recusado' ? 'bg-red-100 text-red-600' : doc.status === 'Aprovado' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-azul-royal'}`}>
                        {doc.status === 'Recusado' ? <XCircle size={20}/> : doc.status === 'Aprovado' ? <CheckCircle2 size={20}/> : <FileText size={20} />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{doc.tipo}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{doc.descricao}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 lg:mt-0 flex items-center gap-2 lg:ml-auto">
                      <button className="px-3 py-1.5 text-xs font-bold text-azul-royal bg-blue-50 border border-blue-100 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1.5">
                        <Eye size={14} /> Visualizar
                      </button>
                      {canEdit && (
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-1 ml-2">
                          <button onClick={() => handleValidarItem('doc', doc.id, 'Aprovado', doc.tipo)} className={`p-1.5 rounded ${doc.status === 'Aprovado' ? 'bg-green-100 text-green-700' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`} title="Validar / OK">
                            <ThumbsUp size={16} />
                          </button>
                          <button onClick={() => handleValidarItem('doc', doc.id, 'Recusado', doc.tipo)} className={`p-1.5 rounded ${doc.status === 'Recusado' ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`} title="Recusar / Ilegível">
                            <ThumbsDown size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3.B TERMO DE AUTODECLARAÇÃO E ASSINATURA */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="bg-slate-100 border-b border-slate-200 px-5 py-3">
              <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileSignature size={18} className="text-ciano" /> Autodeclaração e Assinatura Digital
              </h2>
            </div>
            <div className={`p-5 ${termoValidado === 'Recusado' ? 'bg-red-50' : termoValidado === 'Aprovado' ? 'bg-green-50' : ''} transition-colors`}>
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                <div className="flex-1">
                  <p className="text-xs text-slate-600 leading-relaxed text-justify mb-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    "Declaro, sob as penas da lei, que as informações prestadas são verdadeiras. Confirmo que meu imóvel possui área construída de até 50m², e que me encontro em situação de vulnerabilidade social. Estou ciente de que posso perder o benefício caso qualquer informação seja falsa."
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="bg-green-100 text-green-700 p-1.5 rounded-full">
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-bold text-slate-800">Aceite Eletrônico Confirmado</span>
                    <span className="text-xs text-slate-500 ml-2">12/09/2026 09:14</span>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex flex-col items-center gap-2 bg-white border border-slate-200 rounded-xl p-3 shrink-0 w-full lg:w-auto shadow-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Validar Assinatura</span>
                    <div className="flex gap-2 w-full">
                      <button onClick={() => handleValidarItem('termo', 'term-1', 'Aprovado', 'Assinatura Digital')} className={`flex-1 lg:flex-none px-4 py-2 flex justify-center items-center gap-1.5 rounded-lg border text-xs font-bold transition-colors ${termoValidado === 'Aprovado' ? 'bg-green-500 text-white border-green-600' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200'}`}>
                        <ThumbsUp size={14} /> Válido
                      </button>
                      <button onClick={() => handleValidarItem('termo', 'term-1', 'Recusado', 'Assinatura Digital')} className={`flex-1 lg:flex-none px-4 py-2 flex justify-center items-center gap-1.5 rounded-lg border text-xs font-bold transition-colors ${termoValidado === 'Recusado' ? 'bg-red-500 text-white border-red-600' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'}`}>
                        <ThumbsDown size={14} /> Inválido
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. HISTÓRICO DE LOGS */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-200 px-5 py-3">
              <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <History size={16} /> Log de Ações e Histórico
              </h2>
            </div>
            <div className="p-5 max-h-[300px] overflow-y-auto">
              <div className="relative border-l-2 border-slate-200 ml-3 flex flex-col gap-5">
                {logs.map((log) => (
                  <div key={log.id} className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-ciano rounded-full -left-[7px] top-1.5 border-2 border-slate-50"></div>
                    <div className="text-xs font-bold text-slate-500 mb-0.5">{log.dataHora} • <span className="text-azul-royal">{log.usuario}</span></div>
                    <div className="text-sm text-slate-800 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">{log.acao}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Coluna Direita: Fotos do Imóvel */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Camera size={18} className="text-rosa" /> Padrão do Imóvel
              </h2>
            </div>
            <div className="p-5 flex flex-col gap-6">
              
              {fotos.map((foto) => (
                <div key={foto.id} className={`flex flex-col gap-2 p-3 rounded-xl border transition-colors ${foto.status === 'Recusado' ? 'bg-red-50 border-red-200' : foto.status === 'Aprovado' ? 'bg-green-50 border-green-200' : 'bg-white border-transparent'}`}>
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-800">{foto.titulo}</h4>
                    {foto.status !== 'Pendente' && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${foto.status === 'Aprovado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {foto.status}
                      </span>
                    )}
                  </div>
                  
                  <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={foto.url} alt={foto.titulo} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <button className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-colors">
                        <Maximize2 size={24} />
                      </button>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => handleValidarItem('foto', foto.id, 'Aprovado', foto.titulo)} className={`flex-1 py-1.5 flex justify-center items-center gap-1.5 rounded-lg border text-xs font-bold transition-colors ${foto.status === 'Aprovado' ? 'bg-green-500 text-white border-green-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                        <ThumbsUp size={14} /> OK
                      </button>
                      <button onClick={() => handleValidarItem('foto', foto.id, 'Recusado', foto.titulo)} className={`flex-1 py-1.5 flex justify-center items-center gap-1.5 rounded-lg border text-xs font-bold transition-colors ${foto.status === 'Recusado' ? 'bg-red-500 text-white border-red-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                        <ThumbsDown size={14} /> Recusar
                      </button>
                    </div>
                  )}
                </div>
              ))}

            </div>
          </div>
        </div>

      </div>

      {/* --- MODAIS DE AÇÃO --- */}
      {modalAtivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            
            {/* Cabecalho Modal */}
            <div className={`p-5 flex items-center gap-3 border-b ${
              modalAtivo === 'Alerta' ? 'bg-orange-50 border-orange-100' : 
              modalAtivo === 'Aprovar' ? 'bg-green-50 border-green-100' : 
              'bg-red-50 border-red-100'
            }`}>
              <div className={`p-2 rounded-full ${
                modalAtivo === 'Alerta' ? 'bg-orange-100 text-orange-600' : 
                modalAtivo === 'Aprovar' ? 'bg-green-100 text-green-600' : 
                'bg-red-100 text-red-600'
              }`}>
                {modalAtivo === 'Alerta' && <MessageSquareWarning size={24} />}
                {modalAtivo === 'Aprovar' && <CheckCircle2 size={24} />}
                {modalAtivo === 'Recusar' && <XCircle size={24} />}
              </div>
              <div>
                <h2 className={`text-lg font-bold ${
                  modalAtivo === 'Alerta' ? 'text-orange-800' : 
                  modalAtivo === 'Aprovar' ? 'text-green-800' : 
                  'text-red-800'
                }`}>
                  {modalAtivo === 'Alerta' ? 'Enviar Alerta ao Titular' : 
                   modalAtivo === 'Aprovar' ? 'Confirmar Aprovação' : 
                   'Confirmar Recusa'}
                </h2>
                <p className="text-xs opacity-70">Esta ação enviará uma notificação (SMS/Email).</p>
              </div>
            </div>

            {/* Corpo Modal */}
            <div className="p-6 flex flex-col gap-5">
              
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                <Send size={18} className="text-azul-royal mt-0.5 shrink-0" />
                <p className="text-sm text-blue-900 leading-relaxed">
                  O sistema disparará automaticamente uma mensagem via SMS para <strong>(86) 99999-0000</strong> e um E-mail informando o status da solicitação.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">
                  Adicionar observação na mensagem (Opcional)
                </label>
                <textarea 
                  rows={4}
                  value={mensagemModal}
                  onChange={(e) => setMensagemModal(e.target.value)}
                  placeholder={
                    modalAtivo === 'Alerta' ? "Ex: A foto da sua fachada está muito escura, por favor reenvie..." :
                    modalAtivo === 'Recusar' ? "Motivo da recusa (ex: A casa não se enquadra nos critérios)..." :
                    "Deixe uma nota interna ou mensagem extra de parabenização..."
                  }
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none focus:border-ciano resize-none"
                />
              </div>

            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => { setModalAtivo(null); setMensagemModal(''); }}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarModal}
                className={`px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-colors flex items-center gap-2 ${
                  modalAtivo === 'Alerta' ? 'bg-orange-600 hover:bg-orange-700' : 
                  modalAtivo === 'Aprovar' ? 'bg-verde-sucesso hover:bg-green-700' : 
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                <Send size={16} /> Confirmar e Enviar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
