import React from 'react';
import { Bell, User, Settings, LogOut } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="bg-primary text-white sticky top-0 z-50 shadow-md">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="font-bold text-xl tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-md bg-ciano text-roxo-profundo flex items-center justify-center font-black">P</span>
            Pioneiros <span className="font-light text-accent opacity-90">Insight</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button className="text-gray-300 hover:text-white transition-colors relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border border-primary"></span>
          </button>
          
          <div className="h-6 w-px bg-white/20"></div>
          
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium group-hover:text-accent transition-colors">Administrador</span>
              <span className="text-xs text-gray-300">Aegea Teresina</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 group-hover:border-accent transition-colors">
              <User size={18} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Secondary Menu Navigation */}
      <div className="bg-primary/95 border-t border-white/10 px-6 py-2 flex gap-6 text-sm font-medium">
        <a href="/" className="text-white border-b-2 border-accent pb-1">Fila de Triagem</a>
        <a href="#" className="text-white/70 hover:text-white transition-colors pb-1">Campanhas QR Code</a>
        <a href="#" className="text-white/70 hover:text-white transition-colors pb-1">Dashboards</a>
        <a href="#" className="text-white/70 hover:text-white transition-colors pb-1">Configurações</a>
      </div>
    </header>
  );
}
