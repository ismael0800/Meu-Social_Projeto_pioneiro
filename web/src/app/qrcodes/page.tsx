'use client';

import React, { useState, useEffect } from 'react';
import { 
  QrCode, Save, FileText, Search, Filter, Ban, 
  MapPin, Clock, Calendar as CalendarIcon, User, 
  CheckCircle2, XCircle, AlertTriangle, AlertCircle, Eye, EyeOff,
  Copy, ExternalLink
} from 'lucide-react';
import { municipiosPiaui, bairrosTeresina } from '@/data/locations';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import { getCampanhasQr, criarCampanhaQr, toggleStatusCampanha } from '../actions/qrcodes';
import { getCurrentUser } from '../actions/auth';

export default function QRCodesPage() {
  const [campanhas, setCampanhas] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [municipio, setMunicipio] = useState('Teresina');
  const [bairro, setBairro] = useState('Centro');
  const [validade, setValidade] = useState('');
  
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [previewCampanha, setPreviewCampanha] = useState<any>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    const res = await getCampanhasQr();
    if (res.success && res.campanhas) setCampanhas(res.campanhas);
    setLoading(false);
  };

  const handleGerarQrCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !municipio || !bairro || !validade) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    const res = await criarCampanhaQr({ titulo, descricao, municipio, bairro, validade });
    if (res.success) {
      const baseUrl = window.location.origin;
      const payload = `\${baseUrl}/c/\${res.campanha.codigo}`;
      setGeneratedUrl(payload);
      setPreviewCampanha(res.campanha);
      setCampanhas([res.campanha, ...campanhas]);
      setTitulo(''); setDescricao(''); setMunicipio('Teresina'); setBairro('Centro'); setValidade('');
    } else {
      alert(res.message);
    }
  };

  const handleToggleStatus = async (id: string, status: string) => {
    const res = await toggleStatusCampanha(id, status);
    if (res.success) {
      setCampanhas(campanhas.map(c => c.id === id ? { ...c, status: res.status } : c));
    } else {
      alert(res.message);
    }
  };

  const handleDownloadPNG = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    let downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = 'campanha_qrcode.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleDownloadPDF = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    
    // Layout corporativo do PDF
    pdf.setFillColor(40, 53, 147); // Azul royal
    pdf.rect(0, 0, 210, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.text("Tarifa Social PI - Escaneie e Participe", 105, 25, { align: 'center' });
    
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(18);
    pdf.text(`Campanha: \${previewCampanha?.titulo || 'Tarifa Social'}`, 105, 60, { align: 'center' });
    
    // Adiciona a imagem no centro
    pdf.addImage(imgData, 'PNG', 55, 80, 100, 100);
    
    pdf.setFontSize(14);
    if(previewCampanha) {
      pdf.text(`Localidade: \${previewCampanha.bairro}, \${previewCampanha.municipio}`, 105, 200, { align: 'center' });
      pdf.text(`Validade: \${previewCampanha.validade.split('-').reverse().join('/')}`, 105, 210, { align: 'center' });
    }
    
    pdf.save(`campanha_cartaz.pdf`);
  };

  if (loading) return <div className="p-8">Carregando campanhas...</div>;

  const campanhasPaginadas = campanhas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <QrCode className="text-ciano" size={24} /> Ações e QR Codes
          </h1>
          <p className="text-sm text-slate-500 mt-1">Crie links para ações de rua e gerencie campanhas ativas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-rosa" size={18} /> Nova Campanha
            </h2>
            
            <form onSubmit={handleGerarQrCode} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Título da Ação *</label>
                <input required value={titulo} onChange={e=>setTitulo(e.target.value)} type="text" placeholder="Ex: Mutirão Vila Irmã Dulce" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-ciano transition-colors" />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Descrição Opcional</label>
                <textarea value={descricao} onChange={e=>setDescricao(e.target.value)} rows={2} placeholder="Detalhes do local, equipe presente..." className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-ciano transition-colors resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Município *</label>
                  <select required value={municipio} onChange={e=>setMunicipio(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-ciano">
                    {municipiosPiaui.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Bairro Principal *</label>
                  <select required value={bairro} onChange={e=>setBairro(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-ciano">
                    {municipio === 'Teresina' ? Object.values(bairrosTeresina).flat().sort().map(b => <option key={b} value={b}>{b}</option>) : <option value="Centro">Centro</option>}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Data de Validade do Link *</label>
                <input required value={validade} onChange={e=>setValidade(e.target.value)} type="date" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-ciano transition-colors" />
              </div>

              <button type="submit" className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-2.5 text-sm font-bold text-white bg-azul-royal rounded-lg hover:bg-blue-800 transition-colors shadow-sm">
                <QrCode size={18} /> Gerar QR Code
              </button>
            </form>
          </div>

          {generatedUrl && (
            <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-5 animate-in zoom-in-95 flex flex-col items-center text-center">
              <h3 className="text-sm font-bold text-emerald-700 mb-4 flex items-center gap-2">
                <QrCode size={18} /> QR Code da Campanha
              </h3>
              
              <div className="bg-white p-3 border-2 border-slate-100 rounded-xl mb-4 shadow-sm inline-block">
                <QRCodeCanvas 
                  id="qr-canvas"
                  value={generatedUrl} 
                  size={160}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#0F172A"
                />
              </div>

              <div className="flex items-center justify-between w-full bg-slate-50 p-2 rounded-lg mb-4 border border-slate-200">
                <p className="text-xs text-slate-600 font-medium truncate mr-2" title={generatedUrl}>
                  {generatedUrl}
                </p>
                <div className="flex gap-1 shrink-0">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedUrl);
                      alert('Link copiado!');
                    }} 
                    type="button"
                    className="p-1.5 text-slate-500 hover:text-ciano hover:bg-slate-200 rounded transition-colors"
                    title="Copiar Link"
                  >
                    <Copy size={16} />
                  </button>
                  <a 
                    href={generatedUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-ciano hover:bg-slate-200 rounded transition-colors"
                    title="Abrir Link"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              <div className="flex gap-2 w-full">
                <button onClick={handleDownloadPNG} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                  <Save size={14} /> Salvar PNG
                </button>
                <button onClick={handleDownloadPDF} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-rosa rounded-lg hover:bg-pink-600 transition-colors">
                  <FileText size={14} /> PDF Cartaz
                </button>
              </div>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: LISTA */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="text-azul-royal" size={18} /> Campanhas Registradas
            </h2>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4 w-20">ID</th>
                  <th className="p-4">Detalhes da Ação</th>
                  <th className="p-4">Localização</th>
                  <th className="p-4">Criador</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700">
                {campanhasPaginadas.map((qr) => (
                  <tr key={qr.codigo} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-xs font-bold text-azul-royal bg-blue-50 px-2 py-1 rounded">{qr.codigo}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{qr.titulo}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Clock size={12} className="text-slate-400" /> Validade: {qr.validade.split('-').reverse().join('/')}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{qr.bairro}</div>
                      <div className="text-xs text-slate-500">{qr.municipio}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <User size={14} className="text-slate-400"/> {qr.funcionario}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] uppercase font-bold \${
                        qr.status === 'Ativo' ? 'bg-green-100 text-green-700' : 
                        qr.status === 'Finalizado' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {qr.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => {
                            setGeneratedUrl(`${window.location.origin}/c/${qr.codigo}`);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-ciano hover:bg-slate-200 transition-colors"
                          title="Ver QR Code"
                        >
                          <QrCode size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/c/${qr.codigo}`);
                            alert('Link copiado!');
                          }} 
                          className="p-1.5 rounded-lg text-slate-400 hover:text-ciano hover:bg-slate-200 transition-colors"
                          title="Copiar Link"
                        >
                          <Copy size={16} />
                        </button>
                        <a 
                          href={`/c/${qr.codigo}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-ciano hover:bg-slate-200 transition-colors"
                          title="Abrir Link na Web"
                        >
                          <ExternalLink size={16} />
                        </a>
                        <button 
                          onClick={() => handleToggleStatus(qr.id, qr.status)}
                          disabled={!currentUser || currentUser.cargo !== 'Chefe'}
                          className={`p-1.5 rounded-lg transition-colors ${!currentUser || currentUser.cargo !== 'Chefe' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'}`}
                          title={currentUser?.cargo === 'Chefe' ? "Alterar Status" : "Apenas chefes podem alterar o status"}
                        >
                          <Ban size={16} className="text-slate-400 hover:text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
            <span className="text-sm text-slate-500 font-medium">
              Mostrando <span className="font-bold text-slate-700">{Math.min((currentPage - 1) * itemsPerPage + 1, campanhas.length || 1)}</span> até <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, campanhas.length)}</span> de <span className="font-bold text-slate-700">{campanhas.length}</span> campanhas
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 shadow-sm"
              >
                Anterior
              </button>
              <div className="flex items-center gap-1 px-3">
                <span className="text-sm font-semibold text-slate-700">{currentPage}</span>
                <span className="text-sm text-slate-400">/</span>
                <span className="text-sm text-slate-500">{Math.max(1, Math.ceil(campanhas.length / itemsPerPage)) || 1}</span>
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(campanhas.length / itemsPerPage), p + 1))}
                disabled={currentPage >= Math.ceil(campanhas.length / itemsPerPage)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 shadow-sm"
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
