'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Droplet } from 'lucide-react';
import { login } from '../actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    const res = await login(email, senha);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setErro(res.message || 'Erro ao logar');
      setLoading(false);
    }
  };

  return (
    // Overlay massivo para cobrir o menu lateral e topbar do layout padrão durante o mockup
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center p-4">
      
      {/* BACKGROUND DECORATIVO */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-rosa/20 to-transparent blur-3xl"></div>
        <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-azul-royal/20 to-transparent blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative z-10 animate-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER LOGIN */}
        <div className="bg-gradient-to-br from-azul-royal to-indigo-800 p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 rotate-3">
            <Droplet className="text-ciano" size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-white">Tarifa Social PI</h1>
          <p className="text-indigo-200 text-sm mt-1">Portal do Servidor e Gestão</p>
        </div>

        {/* FORMULÁRIO */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {erro && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{erro}</div>}
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">E-mail Corporativo</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input 
                  type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="nome@tarifasocial.pi.gov.br"
                  className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-azul-royal focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase">Senha</label>
                <a href="#" className="text-xs font-bold text-rosa hover:underline">Esqueceu a senha?</a>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input 
                  type="password" required
                  value={senha} onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-azul-royal focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="mt-4 w-full py-3.5 px-4 bg-azul-royal hover:bg-blue-800 text-white font-bold rounded-xl shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-wait"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Entrar no Sistema <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/></>
              )}
            </button>

          </form>
        </div>
        
        {/* FOOTER */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400 font-medium">
            Acesso restrito a funcionários autorizados.<br/>
            &copy; 2026 Governo do Estado do Piauí
          </p>
        </div>

      </div>
    </div>
  );
}
