
import React, { useState, useMemo } from 'react';
import { INITIAL_CONFIG, IVA_RATE } from './constants';
import { ProjectConfig, QuoteResult, MaterialType, QuoteItem } from './types';
import { processNaturalLanguage } from './services/geminiService';
import { 
  Calculator, 
  Layers, 
  Users, 
  Send, 
  Printer, 
  RefreshCw,
  PlusCircle,
  DollarSign,
  Tag,
  Clock,
  Briefcase,
  ArrowRight,
  Truck,
  ChevronDown,
  AlertTriangle,
  Info
} from 'lucide-react';

const MATERIAL_PRESETS = {
  'Impermeabilizante': [
    { brand: 'Fester Vaportite', yield: 34, price: 1850 },
    { brand: 'Sika Acril Techo', yield: 34, price: 1650 },
    { brand: 'Comex Top', yield: 34, price: 1400 },
  ],
  'Pintura': [
    { brand: 'Vinimex Total', yield: 120, price: 2400 },
    { brand: 'Comex Pro 1000', yield: 100, price: 1800 },
    { brand: 'Behr Premium', yield: 140, price: 2900 },
  ],
  'Sellador': [
    { brand: 'Sellador 5x1 Sayer', yield: 60, price: 1300 },
    { brand: 'Sika Vinilo', yield: 50, price: 1100 },
    { brand: 'Comex 5x1', yield: 55, price: 1250 },
  ]
};

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
      detail: `Cobertura total para ${m2} m²`,
      quantity: `${mainBucketsNeeded} Cub.`,
      unitPrice: mainMaterial.price,
      total: mainMaterialCost,
      brand: mainMaterial.brand,
      yieldDisplay: `${mainMaterial.yield} m²/c`
    });

    // 2. Sellador (Always included)
    const sealerBucketsNeeded = Math.ceil(m2 / sealerMaterial.yield);
    const sealerCost = sealerBucketsNeeded * sealerMaterial.price;
    items.push({
      concept: 'Sellador Primario',
      detail: `Base de adherencia`,
      quantity: `${sealerBucketsNeeded} Cub.`,
      unitPrice: sealerMaterial.price,
      total: sealerCost,
      brand: sealerMaterial.brand,
      yieldDisplay: `${sealerMaterial.yield} m²/c`
    });

    // 3. Auxiliary Material
    const auxCost = (m2 / 100) * config.auxMaterialRate;
    items.push({
      concept: 'Material Auxiliar',
      detail: 'Insumos varios de aplicación',
      quantity: `${m2} m²`,
      unitPrice: config.auxMaterialRate / 100,
      total: auxCost,
      brand: 'Varios',
      yieldDisplay: 'N/A'
    });

    // 4. Scaffolding Rental (Andamios)
    const isScaffoldActive = config.scaffoldCount > 0;
    const scaffoldTotal = isScaffoldActive ? (config.scaffoldCount * config.scaffoldDailyRate * config.scaffoldDays) : 0;
    items.push({
      concept: 'Renta de andamio',
      detail: 'Equipo de altura certificado',
      quantity: isScaffoldActive ? `${config.scaffoldCount} Und.` : '0',
      unitPrice: config.scaffoldDailyRate,
      total: scaffoldTotal,
      brand: isScaffoldActive ? `SÍ` : `NO`,
      yieldDisplay: isScaffoldActive ? `${config.scaffoldDays} Días` : '0 D'
    });

    // 5. Labor
    const laborCostTotal = config.numWorkers * config.workerDailyRate * config.workDays;
    items.push({
      concept: 'Mano de Obra',
      detail: `Ejecución especializada`,
      quantity: `${config.numWorkers * config.workDays} Jorn.`,
      unitPrice: config.workerDailyRate,
      total: laborCostTotal,
      brand: `${config.numWorkers} Trab.`,
      yieldDisplay: `${config.workDays} Días`
    });

    // 6. Masonry Repairs
    if (config.masonryRepairEnabled) {
      items.push({
        concept: 'Reparaciones Albañilería',
        detail: 'DAÑO ESTRUCTURAL: Resanes y parches profundos previos.',
        quantity: '1 Serv.',
        unitPrice: config.masonryRepairCost,
        total: config.masonryRepairCost,
        brand: 'URGENTE',
        yieldDisplay: 'Previo',
        isWarning: true
      });
    }

    // 7. Profit
    const profit = m2 * config.profitRate;
    items.push({
      concept: 'Admin / Supervisión',
      detail: 'Dirección técnica Mauro/Omar',
      quantity: `${m2} m²`,
      unitPrice: config.profitRate,
      total: profit,
      brand: 'Supervisión',
      yieldDisplay: 'N/A'
    });

    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const iva = subtotal * IVA_RATE;
    const total = subtotal + iva;

    return { items, subtotal, iva, total };
  }, [config]);

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
        if (updates.scaffoldCount !== undefined) next.scaffoldCount = updates.scaffoldCount;
        if (updates.scaffoldDailyRate !== undefined) next.scaffoldDailyRate = updates.scaffoldDailyRate;
        if (updates.scaffoldDays !== undefined) next.scaffoldDays = updates.scaffoldDays;
        if (updates.masonryRepairEnabled !== undefined) next.masonryRepairEnabled = updates.masonryRepairEnabled;
        if (updates.masonryRepairCost !== undefined) next.masonryRepairCost = updates.masonryRepairCost;
        
        const target = prompt.toLowerCase().includes('sellador') ? 'Sellador' : next.selectedMaterial;
        if (updates.brand) next.materials[target].brand = updates.brand;
        if (updates.yield) next.materials[target].yield = updates.yield;
        if (updates.price) next.materials[target].price = updates.price;
        return next;
      });
      setPrompt('');
    }
    setIsProcessing(false);
  };

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-6 space-y-6">
      {/* Header Compacto */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">RENUEVA KOBA</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sistemas de Recubrimiento</p>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={() => setConfig(INITIAL_CONFIG)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-all border border-slate-100"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-slate-900 hover:bg-black text-white rounded-lg transition-all font-bold text-sm shadow-lg shadow-slate-200">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Controls - Reduced to 3 columns */}
        <div className="lg:col-span-3 space-y-4 no-print">
          
          <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest border-b pb-2 border-slate-50">
              <Calculator className="w-3 h-3 text-indigo-500" /> General Obra
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Metraje Total</label>
                <div className="relative">
                  <input type="number" value={config.m2} onChange={(e) => setConfig(p => ({ ...p, m2: Number(e.target.value) }))}
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-lg focus:ring-2 focus:ring-indigo-100 outline-none" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 font-black italic text-xs">M²</span>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Acabado</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Impermeabilizante', 'Pintura'] as MaterialType[]).map((mat) => (
                    <button key={mat} onClick={() => setConfig(p => ({ ...p, selectedMaterial: mat }))}
                      className={`py-2 rounded-xl border-2 font-black text-[9px] transition-all ${config.selectedMaterial === mat ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                      {mat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className={`p-4 rounded-2xl shadow-sm border transition-all space-y-3 ${config.masonryRepairEnabled ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-center">
              <h2 className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
                <AlertTriangle className={`w-3 h-3 ${config.masonryRepairEnabled ? 'text-rose-600' : 'text-slate-400'}`} /> Albañilería
              </h2>
              <button 
                onClick={() => setConfig(p => ({ ...p, masonryRepairEnabled: !p.masonryRepairEnabled }))}
                className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${config.masonryRepairEnabled ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400'}`}
              >
                {config.masonryRepairEnabled ? "SÍ" : "NO"}
              </button>
            </div>
            {config.masonryRepairEnabled && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-300 font-black text-xs">$</span>
                <input 
                  type="number" 
                  value={config.masonryRepairCost} 
                  onChange={(e) => setConfig(p => ({ ...p, masonryRepairCost: Number(e.target.value) }))}
                  className="w-full p-2 pl-6 bg-white border border-rose-200 rounded-xl font-black text-rose-900 text-sm focus:ring-2 focus:ring-rose-100 outline-none" 
                />
              </div>
            )}
          </section>

          <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
            <h2 className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest border-b pb-2 border-slate-50">
              <Truck className="w-3 h-3 text-indigo-500" /> Andamios
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <div className="relative">
                  <select 
                    value={config.scaffoldCount > 0 ? "SI" : "NO"} 
                    onChange={(e) => setConfig(p => ({ ...p, scaffoldCount: e.target.value === "SI" ? (p.scaffoldCount || 1) : 0 }))}
                    className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg font-bold text-[10px] appearance-none"
                  >
                    <option value="NO">NO APLICA</option>
                    <option value="SI">APLICA RENTA</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                </div>
              </div>
              {config.scaffoldCount > 0 && (
                <>
                  <input type="number" placeholder="Días" value={config.scaffoldDays} onChange={(e) => setConfig(p => ({ ...p, scaffoldDays: Number(e.target.value) }))}
                    className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold" />
                  <input type="number" placeholder="$/Día" value={config.scaffoldDailyRate} onChange={(e) => setConfig(p => ({ ...p, scaffoldDailyRate: Number(e.target.value) }))}
                    className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold" />
                </>
              )}
            </div>
          </section>

          <section className="bg-slate-900 p-4 rounded-2xl shadow-xl space-y-3 text-white">
            <h2 className="flex items-center gap-2 text-xs font-bold">
              <PlusCircle className="w-3 h-3 text-indigo-400" /> IA Renueva
            </h2>
            <form onSubmit={handleAiSubmit} className="relative">
              <input 
                type="text"
                placeholder="Ajustar cotización..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isProcessing}
                className="w-full pl-3 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-400 outline-none"
              />
              <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 rounded-md">
                {isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </button>
            </form>
          </section>
        </div>

        {/* The Service Quote Table - Increased to 9 columns */}
        <div className="lg:col-span-9 space-y-4">
          <section className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-50">
            <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-900">
              <div className="space-y-2">
                <div className="bg-slate-900 text-white px-3 py-1 rounded text-[8px] font-black uppercase tracking-[0.2em] inline-block">Cotización Formal</div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">PRESUPUESTO DE SERVICIO</h2>
                <div className="flex gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Tag className="w-2.5 h-2.5" /> RK-{Math.floor(Math.random()*1000)}</span>
                  <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {new Date().toLocaleDateString('es-MX')}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-indigo-600 tracking-tighter">RENUEVA</div>
                <div className="text-[10px] font-black text-slate-900 tracking-widest uppercase italic">KOBA S.A.</div>
              </div>
            </div>

            <div className="w-full overflow-hidden">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-900">
                    <th className="p-3 w-[25%] font-black text-white text-[9px] uppercase tracking-widest rounded-tl-xl">Concepto</th>
                    <th className="p-3 w-[20%] font-black text-white text-[9px] uppercase tracking-widest">Detalle / Marca</th>
                    <th className="p-3 w-[15%] font-black text-white text-[9px] uppercase tracking-widest">Plazo/Rend.</th>
                    <th className="p-3 w-[10%] font-black text-white text-[9px] uppercase tracking-widest text-center">Cant.</th>
                    <th className="p-3 w-[15%] font-black text-white text-[9px] uppercase tracking-widest text-right">Unitario</th>
                    <th className="p-3 w-[15%] font-black text-white text-[9px] uppercase tracking-widest text-right rounded-tr-xl">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.items.map((item, idx) => (
                    <tr key={idx} className={`group transition-colors ${item.isWarning ? 'bg-rose-50 hover:bg-rose-100' : 'hover:bg-slate-50'}`}>
                      <td className="p-3 align-top">
                        <p className={`font-black text-xs ${item.isWarning ? 'text-rose-600' : 'text-slate-900'}`}>{item.concept}</p>
                        <p className={`text-[8px] font-bold leading-tight uppercase truncate ${item.isWarning ? 'text-rose-500 italic' : 'text-slate-400'}`}>{item.detail}</p>
                      </td>
                      <td className="p-3 align-top">
                        <div className={`p-1.5 rounded-lg border text-center ${item.isWarning ? 'bg-rose-100 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                           <p className={`text-[9px] font-black truncate ${item.isWarning ? 'text-rose-700' : 'text-slate-600'}`}>{item.brand}</p>
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <p className={`text-[9px] font-black italic truncate ${item.isWarning ? 'text-rose-600' : 'text-slate-500'}`}>{item.yieldDisplay}</p>
                      </td>
                      <td className="p-3 text-center align-top">
                        <span className={`text-[10px] font-black px-2 py-1 rounded ${item.isWarning ? 'bg-rose-200 text-rose-800' : 'bg-slate-100 text-slate-800'}`}>{item.quantity}</span>
                      </td>
                      <td className="p-3 text-right align-top">
                        <p className={`text-[10px] font-bold ${item.isWarning ? 'text-rose-600' : 'text-slate-600'}`}>${item.unitPrice.toLocaleString('es-MX')}</p>
                      </td>
                      <td className="p-3 text-right align-top">
                        <p className={`text-xs font-black ${item.isWarning ? 'text-rose-700' : 'text-slate-900'}`}>${item.total.toLocaleString('es-MX')}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mt-8">
              <div className="w-full md:max-w-[40%] space-y-3">
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Info className="w-3 h-3" /> Notas Importantes
                    </p>
                    <ul className="text-[8px] font-bold text-slate-500 space-y-1">
                      <li className="flex gap-1.5"><ArrowRight className="w-2 h-2 mt-0.5 text-indigo-500" /> Vigencia: 15 días naturales.</li>
                      <li className="flex gap-1.5"><ArrowRight className="w-2 h-2 mt-0.5 text-indigo-500" /> Anticipo del 50% para programar.</li>
                      <li className="flex gap-1.5"><ArrowRight className="w-2 h-2 mt-0.5 text-indigo-500" /> No incluye daños estructurales no listados.</li>
                    </ul>
                 </div>
              </div>
              <div className="flex flex-col items-end gap-2 min-w-[300px]">
                <div className="flex justify-between w-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-slate-900">${result.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between w-full text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  <span>IVA 16%</span>
                  <span>${result.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="w-full h-0.5 bg-slate-900 my-2"></div>
                <div className="flex justify-between w-full text-slate-900 items-baseline">
                  <span className="text-sm font-black uppercase tracking-widest italic">Total Final</span>
                  <div className="text-right">
                    <span className="text-4xl font-black tracking-tighter">${result.total.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                    <span className="text-[10px] font-black text-slate-400 ml-1">MXN</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 pt-8 border-t border-slate-100 flex justify-around items-center opacity-60">
              <div className="text-center">
                <div className="h-px bg-slate-200 w-32 mb-2"></div>
                <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest">MAURO / OMAR</p>
                <p className="text-[7px] font-bold text-slate-400 uppercase">Dirección Técnica</p>
              </div>
              <div className="text-center">
                <div className="h-px bg-slate-200 w-32 mb-2"></div>
                <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest">ACEPTACIÓN CLIENTE</p>
                <p className="text-[7px] font-bold text-slate-400 uppercase">Firma de Conformidad</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer Resumen Sticky - Optimizado para visibilidad */}
      <footer className="no-print bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl flex flex-wrap justify-center md:justify-between gap-6 items-center sticky bottom-4 z-50 ring-1 ring-white/10 max-w-6xl mx-auto">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <p className="text-[8px] font-black text-indigo-300 uppercase tracking-[0.2em]">Utilidad</p>
            <p className="text-base font-black text-white">${(config.m2 * config.profitRate).toLocaleString()}</p>
          </div>
          <div className="w-px h-6 bg-white/10"></div>
          <div className="flex flex-col">
            <p className="text-[8px] font-black text-emerald-300 uppercase tracking-[0.2em]">Material</p>
            <p className="text-base font-black text-white">${(result.items[0].total + result.items[1].total).toLocaleString()}</p>
          </div>
          <div className="w-px h-6 bg-white/10"></div>
          <div className="flex flex-col">
            <p className="text-[8px] font-black text-rose-300 uppercase tracking-[0.2em]">Jornadas</p>
            <p className="text-base font-black text-white">{config.numWorkers * config.workDays}</p>
          </div>
        </div>
        <div className="text-right border-l border-white/10 pl-6">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-0.5">Liquidación Total</p>
          <p className="text-3xl font-black text-white tracking-tighter leading-none">${result.total.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
        </div>
      </footer>
    </div>
  );
}
