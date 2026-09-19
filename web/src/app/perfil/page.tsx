'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../actions/auth';
import { 
  User, Lock, Mail, ShieldAlert, Save, KeyRound, CheckCircle2
} from 'lucide-react';

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [apelido, setApelido] = useState('');
  const [email, setEmail] = useState('');
  
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [salvoFeedback, setSalvoFeedback] = useState('');

  useEffect(() => {
    getCurrentUser().then(u => {
      if (u) {
        setUser(u);
        setApelido(u.nome);
        setEmail(u.email);
      }
      setLoading(false);
    });
  }, []);

  const handleSalvarDados = (e: React.FormEvent) => {
    e.preventDefault();
    setSalvoFeedback('dados');
    setTimeout(() => setSalvoFeedback(''), 3000);
  };


  const handleSalvarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }
    setSalvoFeedback('senha');
    setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('');
    setTimeout(() => setSalvoFeedback(''), 3000);
  };

  if (loading) return <div className="p-8">Carregando...</div>;
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10 max-w-4xl mx-auto">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <User className="text-rosa" size={24} /> Meu Perfil
          </h1>
          <p className="text-sm text-slate-500 mt-1">Atualize suas informações de contato e credenciais de acesso.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: Card de Identificação (Read Only Info) */}
        <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-3xl font-bold mb-4 border-4 border-white shadow-md">
            D
          </div>
          <h2 className="text-lg font-bold text-slate-800">Diretor Chefe</h2>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-700 mt-2">
            <ShieldAlert size={12} className="mr-1"/> Gestor
          </span>
          
          <div className="w-full h-px bg-slate-100 my-6"></div>
          
          <div className="w-full flex flex-col gap-3 text-left">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Nome Completo</label>
              <p className="text-sm font-medium text-slate-700">Diretor Chefe (Você)</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">CPF</label>
              <p className="text-sm font-medium text-slate-700">000.111.222-33</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mt-2 text-xs text-blue-800">
              * Para alterar seu Nome, CPF ou Nível de Acesso, contate o administrador do sistema.
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: Formulários de Atualização */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Form: Dados Editáveis */}
          <form onSubmit={handleSalvarDados} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <User size={18} className="text-ciano" /> Informações Pessoais
              </h3>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Apelido *</label>
                  <input 
                    required type="text" value={apelido} onChange={e => setApelido(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:border-ciano transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">E-mail *</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                      required type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:border-ciano transition-colors"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
                {salvoFeedback === 'dados' ? (
                  <span className="text-sm font-bold text-green-600 flex items-center gap-1 animate-in fade-in"><CheckCircle2 size={16}/> Dados atualizados!</span>
                ) : <span></span>}
                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-azul-royal rounded-lg hover:bg-blue-800 transition-colors shadow-sm">
                  <Save size={16} /> Salvar Alterações
                </button>
              </div>
            </div>
          </form>

          {/* Form: Alterar Senha */}
          <form onSubmit={handleSalvarSenha} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <KeyRound size={18} className="text-rosa" /> Alterar Senha
              </h3>
            </div>
            <div className="p-6 flex flex-col gap-5">
              
              <div className="flex flex-col gap-1.5 md:w-1/2">
                <label className="text-xs font-bold text-slate-500 uppercase">Senha Atual *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input 
                    required type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} placeholder="Sua senha atual"
                    className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:border-rosa transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nova Senha *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                      required type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="No mínimo 6 caracteres"
                      className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:border-rosa transition-colors"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Confirmar Nova Senha *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                      required type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} placeholder="Repita a nova senha"
                      className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:border-rosa transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
                {salvoFeedback === 'senha' ? (
                  <span className="text-sm font-bold text-green-600 flex items-center gap-1 animate-in fade-in"><CheckCircle2 size={16}/> Senha alterada!</span>
                ) : <span></span>}
                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-colors shadow-sm">
                  <KeyRound size={16} /> Atualizar Senha
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>

    </div>
  );
}
