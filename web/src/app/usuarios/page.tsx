'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Mail, Lock, 
  MoreVertical, Edit, Key, ShieldAlert
} from 'lucide-react';
import { getEquipe, addUsuario, toggleStatusUsuario } from '../actions/equipe';
import { getCurrentUser } from '../actions/auth';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState('Funcionario');
  const [erroForm, setErroForm] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    if (user && user.cargo === 'Chefe') {
      const res = await getEquipe();
      if (res.success && res.equipe) setUsuarios(res.equipe);
    }
    setLoading(false);
  };

  const handleSalvarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm('');
    const res = await addUsuario(nome, email, cargo);
    if (res.success) {
      setUsuarios([res.usuario, ...usuarios]);
      setModalOpen(false);
      setNome(''); setEmail(''); setCargo('Funcionario');
    } else {
      setErroForm(res.message);
    }
  };

  const handleToggleStatus = async (id: string, ativo: boolean) => {
    const res = await toggleStatusUsuario(id, ativo);
    if (res.success) {
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, ativo: res.ativo } : u));
    } else {
      alert(res.message);
    }
  };

  if (loading) return <div className="p-8">Carregando equipe...</div>;
  if (!currentUser || currentUser.cargo !== 'Chefe') return <div className="p-8 text-red-600 font-bold">Acesso restrito a Chefia.</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      
      {/* CABECALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="text-ciano" size={24} /> Gestao de Equipe
          </h1>
          <p className="text-sm text-slate-500 mt-1">Crie e gerencie os acessos.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-azul-royal rounded-xl hover:bg-blue-800 transition-colors shadow-sm">
          <UserPlus size={18} /> Novo Usuario
        </button>
      </div>

      {/* LISTA DE USUARIOS */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4 w-10"></th>
                <th className="p-4">Funcionario</th>
                <th className="p-4">Cargo</th>
                <th className="p-4">Contato</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Acoes</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {usuarios.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-center">
                    <div className="w-8 h-8 rounded-full bg-azul-royal/10 text-azul-royal flex items-center justify-center font-bold text-xs">
                      {user.nome.charAt(0)}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-slate-800">
                    {user.nome}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                      user.cargo === 'Chefe' ? 'bg-rosa/10 text-rosa' : 
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {user.cargo === 'Chefe' && <ShieldAlert size={12} className="mr-1"/>}
                      {user.cargo}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Mail size={14} className="text-slate-400"/> {user.email}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${user.ativo ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleToggleStatus(user.id, user.ativo)}
                      className={`text-xs font-bold px-3 py-1 rounded ${user.ativo ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {user.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-azul-royal p-5 flex items-center gap-3 text-white">
              <UserPlus size={24} />
              <div>
                <h2 className="text-lg font-bold">Cadastrar Novo Funcionario</h2>
                <p className="text-xs text-blue-200">Preencha os dados (a senha inicial sera 123).</p>
              </div>
            </div>

            <form onSubmit={handleSalvarUsuario} className="p-6 flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo *</label>
                  <input required value={nome} onChange={e=>setNome(e.target.value)} type="text" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-azul-royal" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Cargo *</label>
                  <select value={cargo} onChange={(e) => setCargo(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-ciano/50 focus:border-ciano transition-all appearance-none">
                    <option value="Funcionario">Funcionario (Atendente/Auditor)</option>
                    <option value="Chefe">Gestor Chefe</option>
                  </select>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                    <Key size={16} className="text-rosa" /> Dados de Login
                  </h3>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">E-mail Corporativo *</label>
                  <input required value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="nome@tarifasocial.pi.gov.br" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-azul-royal" />
                </div>
                <div className="md:col-span-2 text-xs text-slate-500">
                  * A senha padrao inicial sera <strong>123</strong>.
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-azul-royal hover:bg-blue-800 rounded-lg transition-colors">
                  Criar Conta
                </button>
              </div>
              {erroForm && <div className="mt-2 text-red-500 text-sm font-bold">{erroForm}</div>}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
