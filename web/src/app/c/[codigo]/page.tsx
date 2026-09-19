'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle, FileSignature, ArrowRight, ArrowLeft } from 'lucide-react';
import { getCampanhasQr } from '@/app/actions/qrcodes';

export default function PublicQrFormPage({ params }: { params: { codigo: string } }) {
  const [campanha, setCampanha] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Etapas: 1 = Cadastro, 2 = Documentos, 3 = Assinatura, 4 = Sucesso
  const [step, setStep] = useState(1);

  // Dados do Passo 1 (Cadastro)
  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [senha, setSenha] = useState('');
  
  // Dados do Passo 2 (Documentos/Ficha)
  const [cadUnico, setCadUnico] = useState<File | null>(null);
  const [documento, setDocumento] = useState<File | null>(null);
  
  // Dados do Passo 3 (Assinatura)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [protocolo, setProtocolo] = useState('');

  useEffect(() => {
    getCampanhasQr().then(res => {
      if (res.success && res.campanhas) {
        const found = res.campanhas.find((c: any) => c.codigo === params.codigo);
        setCampanha(found || null);
      }
      setLoading(false);
    });
  }, [params.codigo]);

  // --- LÓGICA DA ASSINATURA NO CANVAS ---
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    setHasSignature(true);
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };
  // ----------------------------------------

  const uploadFile = async (file: File | Blob, filename: string) => {
    const fd = new FormData();
    fd.append('file', file, filename);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async () => {
    if (!hasSignature) {
      setErrorMsg('Por favor, assine o termo antes de confirmar.');
      return;
    }
    
    setSubmitting(true);
    setErrorMsg('');

    try {
      let cadUnicoUrl = '';
      let docUrl = '';
      let assUrl = '';

      if (cadUnico) cadUnicoUrl = await uploadFile(cadUnico, 'cadunico.jpg');
      if (documento) docUrl = await uploadFile(documento, 'rg.jpg');
      
      const canvas = canvasRef.current;
      if (canvas) {
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (blob) assUrl = await uploadFile(blob, 'assinatura.png');
      }

      const payload = {
        nome,
        cpf,
        senha,
        matricula,
        origem: 'QR_CODE',
        campanhaId: campanha?.id,
        documentos: [
          { tipo: 'cadunico', url: cadUnicoUrl || '/uploads/mock.jpg' },
          { tipo: 'rg', url: docUrl || '/uploads/mock.jpg' },
          { tipo: 'assinatura', url: assUrl || '/uploads/mock.jpg' }
        ]
      };

      const res = await fetch('/api/solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setProtocolo('TS' + Date.now().toString().slice(-6));
        setStep(4); // Sucesso
      } else {
        setErrorMsg('Erro ao enviar dados. Tente novamente.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão com o servidor.');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Carregando formulário seguro...</div>;
  
  if (!campanha || campanha.status !== 'Ativo') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border-t-4 border-red-500">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Ação Indisponível</h1>
          <p className="text-sm text-slate-600">Este link expirou ou a campanha foi encerrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-4 py-8">
      
      <div className="w-full max-w-md text-center mb-6">
        <h1 className="text-2xl font-bold text-azul-royal">Tarifa Social PI</h1>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{campanha.titulo}</p>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className={`w-1/3 h-2 rounded-full transition-colors ${step >= 1 ? 'bg-ciano' : 'bg-slate-200'}`}></div>
          <div className={`w-1/3 h-2 rounded-full transition-colors ${step >= 2 ? 'bg-ciano' : 'bg-slate-200'}`}></div>
          <div className={`w-1/3 h-2 rounded-full transition-colors ${step >= 3 ? 'bg-ciano' : 'bg-slate-200'}`}></div>
        </div>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
        
        {/* PASSO 1: CADASTRO */}
        {step === 1 && (
          <div className="animate-in slide-in-from-right-4 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Crie seu acesso</h2>
            <p className="text-sm text-slate-500 mb-6">Você precisa de um cadastro para acompanhar o andamento depois pelo App.</p>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Seu Nome Completo</label>
                <input required value={nome} onChange={e=>setNome(e.target.value)} type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-azul-royal transition-colors" placeholder="Digite como está no documento" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nº da Matrícula de Água</label>
                <input required value={matricula} onChange={e=>setMatricula(e.target.value)} type="tel" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-azul-royal transition-colors" placeholder="Encontra-se no canto superior da fatura" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">CEP</label>
                  <input required value={cep} onChange={e=>setCep(e.target.value)} type="tel" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-azul-royal transition-colors" placeholder="00000-000" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Bairro</label>
                  <input required value={bairro} onChange={e=>setBairro(e.target.value)} type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-azul-royal transition-colors" placeholder="Bairro" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Endereço (Rua/Número)</label>
                <input required value={endereco} onChange={e=>setEndereco(e.target.value)} type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-azul-royal transition-colors" placeholder="Rua XYZ, 123" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
                <input required value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-azul-royal transition-colors" placeholder="seu@email.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">WhatsApp / Telefone</label>
                <input required value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} type="tel" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-azul-royal transition-colors" placeholder="(86) 99999-9999" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">CPF</label>
                <input required value={cpf} onChange={e=>setCpf(e.target.value)} type="tel" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-azul-royal transition-colors" placeholder="Apenas números" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Crie uma Senha Segura</label>
                <input required value={senha} onChange={e=>setSenha(e.target.value)} type="password" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-azul-royal transition-colors" placeholder="••••••••" />
              </div>
            </div>

            <button 
              onClick={() => { if(nome && cpf && senha && matricula) setStep(2); else alert('Preencha pelo menos Nome, Matrícula, CPF e Senha.'); }} 
              className="w-full py-4 mt-8 flex items-center justify-center gap-2 bg-azul-royal text-white font-bold rounded-xl shadow-md hover:bg-blue-800 transition-colors"
            >
              Continuar para Ficha <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* PASSO 2: FORMULÁRIO E ANEXOS */}
        {step === 2 && (
          <div className="animate-in slide-in-from-right-4 p-6">
            <button onClick={() => setStep(1)} className="text-sm font-bold text-slate-400 flex items-center gap-1 mb-4 hover:text-slate-600">
              <ArrowLeft size={16} /> Voltar
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Ficha de Solicitação</h2>
            <p className="text-sm text-slate-500 mb-6">Anexe os documentos obrigatórios usando a câmera.</p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Comprovante do Benefício</label>
                <p className="text-[11px] text-slate-400 mb-2">Envie uma foto do seu resumo do CadÚnico, Cartão Bolsa Família ou BPC.</p>
                <div className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-colors cursor-pointer relative overflow-hidden ${cadUnico ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-slate-300 text-slate-400 hover:bg-slate-50'}`}>
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => setCadUnico(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  {cadUnico ? <CheckCircle2 size={32} className="mb-2" /> : <Camera size={32} className="mb-2" />}
                  <span className="text-sm font-bold text-center">{cadUnico ? 'Comprovante Anexado' : 'Tocar para abrir a Câmera'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mt-4">
                <label className="text-xs font-bold text-slate-500 uppercase">Documento de Identidade</label>
                <p className="text-[11px] text-slate-400 mb-2">Uma foto clara do seu RG ou CNH (Frente e Verso).</p>
                <div className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-colors cursor-pointer relative overflow-hidden ${documento ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-slate-300 text-slate-400 hover:bg-slate-50'}`}>
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => setDocumento(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  {documento ? <CheckCircle2 size={32} className="mb-2" /> : <Upload size={32} className="mb-2" />}
                  <span className="text-sm font-bold text-center">{documento ? 'Documento Anexado' : 'Tocar para abrir a Câmera'}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => { if(cadUnico && documento) setStep(3); else alert('Anexe as duas fotos obrigatórias.'); }} 
              className="w-full py-4 mt-8 flex items-center justify-center gap-2 bg-azul-royal text-white font-bold rounded-xl shadow-md hover:bg-blue-800 transition-colors"
            >
              Avançar para Assinatura <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* PASSO 3: ASSINATURA E TERMO */}
        {step === 3 && (
          <div className="animate-in slide-in-from-right-4 p-6 flex flex-col">
            <button onClick={() => setStep(2)} className="text-sm font-bold text-slate-400 flex items-center gap-1 mb-4 hover:text-slate-600">
              <ArrowLeft size={16} /> Voltar
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
              <FileSignature size={24} className="text-rosa" /> Termo de Declaração
            </h2>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 mb-6">
              <p className="text-[11px] text-slate-500 text-justify leading-relaxed">
                Declaro sob as penas da lei que as informações prestadas são verdadeiras e me comprometo a atualizar os dados junto à Aegea PI caso haja qualquer alteração na renda familiar ou composição da residência, estando ciente das penalidades previstas para fraudes no benefício da Tarifa Social.
              </p>
            </div>

            <div className="flex flex-col gap-2 relative">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold text-slate-700 uppercase">Assine no quadro abaixo:</label>
                <button onClick={clearSignature} className="text-[10px] font-bold text-rosa uppercase hover:underline">Limpar</button>
              </div>
              <div className="border-2 border-slate-300 rounded-xl bg-slate-50 overflow-hidden touch-none" style={{ height: '200px' }}>
                <canvas 
                  ref={canvasRef}
                  width={400} 
                  height={200} 
                  className="w-full h-full cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              {!hasSignature && <span className="absolute bottom-4 left-0 right-0 text-center text-slate-300 text-sm font-medium pointer-events-none">Use o dedo para assinar</span>}
            </div>

            {errorMsg && <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-200 flex items-center gap-2"><AlertCircle size={16}/>{errorMsg}</div>}

            <button 
              disabled={submitting} 
              onClick={handleSubmit} 
              className="w-full py-4 mt-6 bg-rosa text-white font-bold rounded-xl shadow-md hover:bg-pink-600 disabled:opacity-50 transition-colors text-lg"
            >
              {submitting ? 'Processando...' : 'Confirmar e Enviar'}
            </button>
          </div>
        )}

        {/* PASSO 4: SUCESSO */}
        {step === 4 && (
          <div className="animate-in zoom-in p-10 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Tudo Certo!</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 w-full">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Seu Protocolo</p>
              <p className="text-lg font-mono font-bold text-azul-royal">{protocolo}</p>
            </div>
            <p className="text-sm text-slate-600 mb-6 text-justify">
              Sua solicitação da Tarifa Social foi enviada com sucesso para nossa central.<br/><br/>
              Acabamos de te enviar um link com este protocolo por <b>SMS</b> e <b>WhatsApp</b> no número {whatsapp || 'informado'}.<br/><br/>
              Você também pode acompanhar o andamento a qualquer momento baixando o aplicativo oficial <b>MEU SOCIAL</b> e acessando com seu <b>CPF</b> e a senha criada.
            </p>
            <button onClick={() => window.location.reload()} className="text-sm font-bold text-azul-royal border border-azul-royal px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
              Fazer Nova Solicitação
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
