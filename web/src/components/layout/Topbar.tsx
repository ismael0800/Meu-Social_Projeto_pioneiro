'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/app/actions/auth';
import { User, Grid, Info, Globe, Shield, Settings, LogOut } from 'lucide-react';

export function Topbar() {
  const pathname = usePathname();
  if (pathname.startsWith('/c/') || pathname.startsWith('/login')) return null;
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  
  const links = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Solicitações', href: '/solicitacoes' },
    { name: 'Beneficiários', href: '/beneficiarios' },
    { name: 'QR Codes', href: '/qrcodes' },
    { name: 'Relatórios', href: '/relatorios' },
    // @ts-ignore
    ...(user?.cargo === 'Chefe' ? [{ name: 'Equipe', href: '/usuarios' }] : []),
  ];

  return (
    <div className="w-full bg-gradient-to-r from-rosa via-azul-royal to-ciano h-16 flex items-center justify-between px-6 shadow-md text-white">
      <div className="flex items-center gap-8 h-full">
        {/* Logo Branca sem fundo */}
        <div className="flex items-center h-full pt-1">
          <img src="/assets/logo.png" alt="Meu Social+" className="h-12 w-auto object-contain drop-shadow-md" />
        </div>

        {/* Navegação Embutida */}
        <nav className="hidden md:flex items-center gap-6 h-full mt-1">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center h-full px-1 border-b-[3px] text-sm font-bold transition-colors ${
                  isActive
                    ? 'border-white text-white'
                    : 'border-transparent text-white/70 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="flex items-center gap-6">
        
        {/* Dropdown / Menu do Usuário */}
        <div className="group relative flex items-center gap-3 cursor-pointer py-4">
          <div className="flex flex-col text-right">
            <span className="text-sm font-bold leading-tight">{user ? user.nome.split(' ')[0] : 'Carregando...'}</span>
            <span className="text-[10px] text-white/70">{user?.cargo}</span>
          </div>
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-colors">
            <User size={18} />
          </div>

          {/* Menu Hover do Usuário */}
          <div className="absolute top-14 right-0 w-48 bg-white rounded-xl shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden text-slate-700 z-50">
            <Link href="/perfil" className="flex items-center gap-2 px-4 py-3 hover:bg-slate-50 text-sm font-medium transition-colors border-b border-slate-100">
              <Settings size={16} className="text-ciano" /> Meu Perfil
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-sm font-medium text-red-600 transition-colors">
              <LogOut size={16} /> Sair do Sistema
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
