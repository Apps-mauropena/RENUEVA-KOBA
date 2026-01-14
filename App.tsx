
import React, { useState, useMemo } from 'react';
import { INITIAL_CONFIG, IVA_RATE } from './constants';
import { ProjectConfig, QuoteResult, MaterialType, QuoteItem } from './types';
import { processNaturalLanguage } from './services/geminiService';
import { 
  Calculator, 
  Paintbrush, 
  Waves, 
  Layers, 
  Users, 
  Wrench, 
  Send, 
  Printer, 
  RefreshCw,
  PlusCircle,
  FileText,
  DollarSign,
  Tag,
  Clock,
  Briefcase
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<ProjectConfig>(INITIAL_CONFIG);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Core Logic: Dynamic Calculation
  const result: QuoteResult = useMemo(() => {
    const mainMaterial = config.materials[config.selectedMaterial];
    const sealerMaterial = config.materials['Sellador'];
    const m2 = config.m2;
    
    const items: QuoteItem[] = [];

    // 1. Main Material Calculation
    const mainBucketsNeeded = Math.ceil(m2 / mainMaterial.yield);
    const mainMaterialCost = mainBucketsNeeded * mainMaterial.price;
    items.push({
      concept: config.selectedMaterial,
      detail: `Rendimiento: ${mainMaterial.yield} m²/cubeta`,
      quantity: `${mainBucketsNeeded} Cubetas`,
      unitPrice: mainMaterial.price,
      total: mainMaterialCost,
      brand: mainMaterial.brand
    });

    // 2. Sellador (Primer) Calculation
    if (config.selectedMaterial !== 'Sellador') {
      const sealerBucketsNeeded = Math.ceil(m2 / sealerMaterial.yield);
      const sealerCost = sealerBucketsNeeded * sealerMaterial.price;
      items.push({
        concept: 'Sellador (Base)',
        detail: `Rendimiento: ${sealerMaterial.yield} m²/cubeta`,
        quantity: `${sealerBucketsNeeded} Cubetas`,
        unitPrice: sealerMaterial.price,
        total: sealerCost,
        brand: sealerMaterial.brand
      });
    }

    // 3. Auxiliary Material
    const auxCost = (m2 / 100) * config.auxMaterialRate;
    items.push({
      concept: 'Material Auxiliar',
      detail: 'Insumos varios de obra',
      quantity: `${m2} m²`,
      unitPrice: config.auxMaterialRate / 100,
      total: auxCost
    });

    // 4. Labor (New Logic: Workers * Rate * Days)
    const laborCostTotal = config.numWorkers * config.workerDailyRate * config.workDays;
    items.push({
      concept: 'Mano de Obra',
      detail: `${config.numWorkers} Trabajadores x ${config.workDays} Días`,
      quantity: `${config.numWorkers * config.workDays} Jornadas`,
      unitPrice: config.workerDailyRate,
      total: laborCostTotal,
      laborDetails: {
        workers: config.numWorkers,
        rate: config.workerDailyRate,
        days: config.workDays
      }
    });

    // 5. Profit
    const profit = m2 * config.profitRate;
    items.push({
      concept: 'Utilidad Socios',
      detail: 'Gestión Mauro y Omar',
      quantity: `${m2} m²`,
      unitPrice: config.profitRate,
      total: profit
    });

    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const iva = subtotal * IVA_RATE;
    const total = subtotal + iva;

    return { items, subtotal, iva, total };
  }, [config]);

  const handleM2Change = (val: number) => {
    setConfig(prev => ({ ...prev, m2: val }));
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsProcessing(true);
    const updates = await processNaturalLanguage(prompt, config);
    if (updates) {
      setConfig(prev => {
        const next = { ...prev, materials: { ...prev.materials } };
        if (updates.m2 !== undefined) next.m2 = updates.m2;
        if (updates.selectedMaterial) next.selectedMaterial = updates.selectedMaterial as MaterialType;
        if (updates.numWorkers !== undefined) next.numWorkers = updates.numWorkers;
        if (updates.workerDailyRate !== undefined) next.workerDailyRate = updates.workerDailyRate;
        if (updates.workDays !== undefined) next.workDays = updates.workDays;
        if (updates.profitRate !== undefined) next.profitRate = updates.profitRate;
        return next;
      });
      setPrompt('');
    }
    setIsProcessing(false);
  };

  const handlePrint = () => window.print();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">RENUEVA KOBA</h1>
            <p className="text-sm text-slate-500 font-medium">Cotizador de Obra e Infraestructura</p>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          <button 
            onClick={() => setConfig(INITIAL_CONFIG)}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
            Reiniciar
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-md active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Imprimir PDF
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-6 no-print">
          {/* Project Basics */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <Calculator className="w-5 h-5 text-indigo-500" />
              Datos de la Obra
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Superficie (m²)</label>
                <input 
                  type="number"
                  value={config.m2}
                  onChange={(e) => handleM2Change(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tipo de Acabado</label>
                <select 
                  value={config.selectedMaterial}
                  onChange={(e) => setConfig(prev => ({ ...prev, selectedMaterial: e.target.value as MaterialType }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                >
                  <option value="Impermeabilizante">Impermeabilizante</option>
                  <option value="Pintura">Pintura</option>
                  <option value="Sellador">Sellador Solo</option>
                </select>
              </div>
            </div>
          </section>

          {/* New Labor Configuration Section */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <Users className="w-5 h-5 text-indigo-500" />
              Mano de Obra (Maestros)
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Num. Trabajadores</label>
                <select 
                  value={config.numWorkers}
                  onChange={(e) => setConfig(prev => ({ ...prev, numWorkers: Number(e.target.value) }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Trabajador{n > 1 ? 'es' : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo x Día ($)</label>
                <select 
                  value={config.workerDailyRate}
                  onChange={(e) => setConfig(prev => ({ ...prev, workerDailyRate: Number(e.target.value) }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  {[500, 600, 700, 800, 900, 1000].map(r => <option key={r} value={r}>${r}.00</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Días de Trabajo</label>
                <input 
                  type="number"
                  min="1"
                  max="60"
                  value={config.workDays}
                  onChange={(e) => setConfig(prev => ({ ...prev, workDays: Number(e.target.value) }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div className="col-span-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-600">Total Mano de Obra:</span>
                <span className="text-lg font-black text-indigo-700">${(config.numWorkers * config.workerDailyRate * config.workDays).toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* AI Helper */}
          <section className="bg-slate-900 p-6 rounded-2xl shadow-xl space-y-4 text-white">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <PlusCircle className="w-5 h-5 text-indigo-400" />
              Ajuste Inteligente
            </h2>
            <form onSubmit={handleAiSubmit} className="relative">
              <input 
                type="text"
                placeholder="Ej: Sube a 3 trabajadores y 10 días..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isProcessing}
                className="w-full pl-4 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none transition-all placeholder:text-slate-500 text-sm"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 rounded-lg">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </section>
        </div>

        {/* Main Content: The Quote */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-100 min-h-full">
            <div className="flex justify-between items-start mb-10 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">PRESUPUESTO DE SERVICIO</h2>
                <div className="flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>CLIENTE: PARTICULAR</span>
                  <span>FECHA: {new Date().toLocaleDateString('es-MX')}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-sm tracking-tighter">RENUEVA KOBA</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-200">Concepto</th>
                    <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-200">Marca/Detalle</th>
                    <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-200 text-center">Cant.</th>
                    <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-200 text-right">Precio U.</th>
                    <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-200 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.items.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50/50">
                      <td className="p-4 align-top">
                        <p className="font-bold text-slate-800 text-sm">{item.concept}</p>
                      </td>
                      <td className="p-4 align-top">
                        {item.brand ? (
                          <span className="inline-block px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-tighter border border-indigo-100 mb-1">
                            {item.brand}
                          </span>
                        ) : null}
                        <p className="text-[10px] text-slate-500 font-medium leading-tight">{item.detail}</p>
                      </td>
                      <td className="p-4 text-center align-top">
                        <span className="text-xs font-bold text-slate-700">{item.quantity}</span>
                      </td>
                      <td className="p-4 text-right align-top">
                        <p className="text-xs text-slate-600 font-medium">${item.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                      </td>
                      <td className="p-4 text-right align-top">
                        <p className="text-sm font-black text-slate-900">${item.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-12 flex flex-col items-end gap-2 pr-4">
              <div className="flex justify-between w-full max-w-[280px] text-sm font-bold text-slate-500 uppercase tracking-tighter">
                <span>Subtotal Neto</span>
                <span className="text-slate-900">${result.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between w-full max-w-[280px] text-sm font-bold text-slate-400 uppercase tracking-tighter">
                <span>I.V.A. (16%)</span>
                <span>${result.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="w-full max-w-[320px] h-0.5 bg-slate-900 my-4"></div>
              <div className="flex justify-between w-full max-w-[320px] text-indigo-600">
                <span className="text-lg font-black uppercase tracking-widest">TOTAL</span>
                <span className="text-3xl font-black">${result.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="mt-20 pt-10 border-t-2 border-slate-900 grid grid-cols-2 gap-20">
              <div className="text-center space-y-4">
                <div className="h-0.5 bg-slate-200 w-full mx-auto"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aceptación del Cliente</p>
              </div>
              <div className="text-center space-y-4">
                <div className="h-0.5 bg-slate-200 w-full mx-auto"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sello Renueva Koba</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer Summary */}
      <footer className="no-print bg-white p-6 rounded-3xl shadow-xl border border-slate-200 flex flex-wrap justify-between gap-6 items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-4 border-r border-slate-100 pr-8">
           <div className="bg-emerald-500/10 p-2.5 rounded-2xl"><DollarSign className="w-6 h-6 text-emerald-600" /></div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">Utilidad Proyectada</p>
              <p className="text-xl font-black text-emerald-700">${(config.m2 * config.profitRate).toLocaleString()}</p>
           </div>
        </div>
        <div className="flex items-center gap-4 border-r border-slate-100 pr-8">
           <div className="bg-indigo-500/10 p-2.5 rounded-2xl"><Users className="w-6 h-6 text-indigo-600" /></div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">Num. Trabajadores</p>
              <p className="text-xl font-black text-indigo-700">{config.numWorkers}</p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-amber-500/10 p-2.5 rounded-2xl"><Clock className="w-6 h-6 text-amber-600" /></div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">Duración Obra</p>
              <p className="text-xl font-black text-amber-700">{config.workDays} Días</p>
           </div>
        </div>
        <div className="flex-1 text-right">
           <p className="text-[9px] font-black text-slate-400 uppercase">Monto Total de Obra</p>
           <p className="text-3xl font-black text-slate-900 tracking-tighter">${result.total.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN</p>
        </div>
      </footer>
    </div>
  );
}
