"use client";
import React, { useState } from 'react';
import { Camera, CheckCircle, ArrowRight } from 'lucide-react';

export default function SolicitarPublico() {
  const [step, setStep] = useState(1);

  const mockOCR = () => {
    // Simula a leitura OCR e preenchimento
    setTimeout(() => {
      setStep(2);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-superficie flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-roxo-profundo p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Tarifa Social</h1>
          <p className="text-ciano text-sm mt-1">Solicite seu benefício pelo celular</p>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="font-medium text-slate-800 mb-2">Envie sua Fatura</h3>
                <p className="text-sm text-slate-500 mb-4">Fotografe sua conta de água para preenchermos os dados automaticamente.</p>
                <button 
                  onClick={mockOCR}
                  className="w-full py-3 px-4 bg-roxo-profundo text-white rounded-xl font-medium hover:bg-rosa transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <Camera size={18} /> Tirar Foto da Conta
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-3 text-sm">
                <CheckCircle className="mt-0.5 shrink-0" size={16} />
                <p>Conta lida com sucesso! Matrícula <strong>12345678</strong> (Consumo: 8m³).</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input type="tel" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" placeholder="(86) 99999-9999" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" placeholder="seu@email.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Crie uma Senha</label>
                <input type="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" placeholder="••••••••" />
              </div>

              <button className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-magenta text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2 mt-4">
                Criar Minha Conta <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
