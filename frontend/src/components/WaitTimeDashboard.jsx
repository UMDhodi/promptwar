import React, { useMemo, memo } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import {
  Clock, Utensils, Droplet, ArrowRightCircle, Car, HeartPulse,
  TrendingUp, TrendingDown, Minus, Users, AlertTriangle, ShieldCheck,
  BarChart2, Zap, Navigation
} from 'lucide-react';

/* ─── colour helpers ─────────────────────────────────────────── */
const waitText = w => w > 15 ? 'text-red-600'  : w > 5 ? 'text-amber-600' : 'text-emerald-600';
const waitBgSoft = w => w > 15 ? 'bg-red-50'   : w > 5 ? 'bg-amber-50'    : 'bg-emerald-50';
const densityBg  = p => p >= 90 ? 'bg-red-500' : p >= 75 ? 'bg-orange-400' : p >= 55 ? 'bg-amber-400' : 'bg-emerald-500';
const densityText= p => p >= 90 ? 'text-red-600' : p >= 75 ? 'text-orange-600' : p >= 55 ? 'text-amber-600' : 'text-emerald-600';

const TrendIcon = ({ val }) =>
  val > 2 ? <TrendingUp className="w-3.5 h-3.5 text-red-500"/>
  : val < -2 ? <TrendingDown className="w-3.5 h-3.5 text-emerald-500"/>
  : <Minus className="w-3.5 h-3.5 text-gray-400"/>;

/* ─── Mini bar chart ──────────────────────────────────────────── */
function MiniBar({ pct, color = '#3b82f6' }) {
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}/>
    </div>
  );
}

/**
 * SparkLine — mini SVG line chart showing the last 8 data ticks.
 *
 * Deterministically constructs a stable, pure historical progression from
 * the facility ID and current value. This avoids any render-phase impure
 * Math.random calls, useState, or useEffect triggers, eliminating React state
 * cascading warnings and rendering flicker.
 *
 * @param {{ id: string, value: number, max?: number, color?: string }} props
 */
const SparkLine = memo(function SparkLine({ id = 'default', value, max = 30, color = '#3b82f6' }) {
  const pts = useMemo(() => {
    // Basic stable string hash to create unique deterministic paths per ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
    }
    hash = Math.abs(hash);

    const seed = [];
    let prev = value;
    for (let i = 0; i < 7; i++) {
      const step = ((hash + i) % 5) - 2; // -2 to +2 step offset
      prev = Math.max(1, prev + step);
      seed.push(prev);
    }
    return [...seed, value];
  }, [id, value]);

  const h = 28;
  const w = 80;
  const ys = pts.map(v => h - (v / max) * h);
  const d  = pts.map((_, i) => `${i === 0 ? 'M' : 'L'} ${(i / (pts.length - 1)) * w} ${ys[i]}`).join(' ');

  return (
    <svg width={w} height={h} className="overflow-visible" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={w} cy={ys[ys.length - 1]} r="3" fill={color}/>
    </svg>
  );
});

/* ─── Facility row ───────────────────────────────────────────── */
function FacilityRow({ item, type, isBest }) {
  const wait = item.wait_minutes ?? item.wait_minutes_to_exit ?? 0;
  return (
    <div className={`flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 group transition-colors hover:bg-gray-50/60 rounded-lg px-1 -mx-1`}>
      <div className="flex flex-col min-w-0 flex-1 mr-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-bold text-gray-800 truncate">{item.name || item.id}</span>
          {isBest && (
            <span className="shrink-0 px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] rounded font-black uppercase tracking-widest shadow-sm">Best</span>
          )}
          {item.accessible && <span className="text-[9px] text-blue-500 font-bold shrink-0">♿</span>}
        </div>
        {type === 'Parking' && (
          <div className="mt-1">
            <MiniBar pct={((item.capacity - item.available) / item.capacity) * 100}
                     color={item.available < 200 ? '#ef4444' : item.available < 500 ? '#f59e0b' : '#22c55e'}/>
          </div>
        )}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-0.5">
        {type === 'Parking' ? (
          <>
            <span className={`text-[11px] font-black ${item.available < 200 ? 'text-red-600' : 'text-emerald-600'}`}>
              {item.available} free
            </span>
            <span className="text-[9px] text-gray-400 font-semibold">{item.wait_minutes_to_exit}m exit</span>
          </>
        ) : type === 'Medical' ? (
          <span className="text-[11px] font-bold text-blue-600">{item.is_24hr ? '24-hour' : 'Staffed'}</span>
        ) : (
          <div className={`flex items-center gap-1 ${waitBgSoft(wait)} ${waitText(wait)} px-2.5 py-1 rounded-xl text-[11px] font-black border border-black/5`}>
            <Clock className="w-3 h-3 opacity-70"/>
            {wait}m
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Section card ───────────────────────────────────────────── */
function SectionCard({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm mb-4 border border-gray-100 overflow-hidden shrink-0">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
        {icon}
        <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-900">{title}</h3>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

/* ─── Crowd Analytics panel ──────────────────────────────────── */
function CrowdAnalytics({ zones }) {
  const total    = zones.reduce((s, z) => s + z.current_occupancy, 0);
  const capacity = zones.reduce((s, z) => s + z.capacity, 0);
  const overallPct = (total / capacity) * 100;
  const hotZone = zones.reduce((a, b) => (b.current_occupancy / b.capacity > a.current_occupancy / a.capacity ? b : a));
  const calmZone= zones.reduce((a, b) => (b.current_occupancy / b.capacity < a.current_occupancy / a.capacity ? b : a));
  const riskCount = zones.filter(z => z.current_occupancy / z.capacity >= 0.85).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Overall gauge */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-black text-gray-900">{overallPct.toFixed(1)}%</div>
          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Overall Capacity</div>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-black text-gray-800">{total.toLocaleString()}</div>
          <div className="text-[10px] text-gray-400 font-medium">/ {capacity.toLocaleString()} seats</div>
        </div>
      </div>

      {/* Full-width gauge bar */}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${densityBg(overallPct)}`}
          style={{ width: `${Math.min(100, overallPct)}%` }}
        />
      </div>

      {/* Zone bars */}
      <div className="flex flex-col gap-2 mt-1">
        {zones.filter(z => z.id !== 'Z5').map(zone => {
          const pct = (zone.current_occupancy / zone.capacity) * 100;
          return (
            <div key={zone.id} className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-500 w-24 truncate">{zone.name}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${densityBg(pct)}`} style={{ width: `${pct}%` }}/>
              </div>
              <span className={`text-[10px] font-black w-8 text-right ${densityText(pct)}`}>{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>

      {/* Insights row */}
      <div className="grid grid-cols-3 gap-2 mt-1">
        <div className="bg-red-50 rounded-xl p-2.5 text-center border border-red-100">
          <div className="text-lg font-black text-red-600">{riskCount}</div>
          <div className="text-[8px] text-red-500 font-bold uppercase tracking-wider">High Risk Zones</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-2.5 text-center border border-amber-100">
          <div className="text-[9px] font-black text-amber-700 leading-tight truncate">{hotZone.name.split(' ')[0]}</div>
          <div className="text-[8px] text-amber-500 font-bold uppercase tracking-wider">Busiest Stand</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
          <div className="text-[9px] font-black text-emerald-700 leading-tight truncate">{calmZone.name.split(' ')[0]}</div>
          <div className="text-[8px] text-emerald-500 font-bold uppercase tracking-wider">Most Space</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Wait-time sparkline panel ─────────────────────────────── */
function WaitSparklines({ items, extractor }) {
  const sorted = [...items].sort((a, b) => extractor(a) - extractor(b));
  return (
    <div className="flex flex-col gap-2">
      {sorted.map((item) => {
        const w = extractor(item);
        return (
          <div key={item.id} className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-gray-600 w-24 truncate">{item.name || item.id}</span>
            <div className="flex-1"><SparkLine id={item.id} value={w} color={w > 15 ? '#ef4444' : w > 5 ? '#f59e0b' : '#22c55e'}/></div>
            <span className={`text-[10px] font-black w-8 text-right ${waitText(w)}`}>{w}m</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Live alert strip ──────────────────────────────────────── */
function AlertStrip({ zones, gates, concessions }) {
  const alerts = [];
  zones.forEach(z => {
    const pct = (z.current_occupancy / z.capacity) * 100;
    if (pct >= 90) alerts.push({ level: 'critical', msg: `${z.name}: CRITICAL (${pct.toFixed(0)}%)` });
    else if (pct >= 80) alerts.push({ level: 'warn', msg: `${z.name}: High density (${pct.toFixed(0)}%)` });
  });
  gates.forEach(g => { if (g.wait_minutes > 12) alerts.push({ level: 'warn', msg: `${g.name}: ${g.wait_minutes}m queue` }); });
  concessions.forEach(c => { if (c.wait_minutes > 15) alerts.push({ level: 'warn', msg: `${c.name}: ${c.wait_minutes}m wait` }); });

  if (!alerts.length) return (
    <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-bold p-2 bg-emerald-50 rounded-xl border border-emerald-100">
      <ShieldCheck className="w-4 h-4"/> All zones within safe limits
    </div>
  );

  return (
    <div className="flex flex-col gap-1.5">
      {alerts.slice(0, 4).map((a, i) => (
        <div key={i} className={`flex items-center gap-2 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border ${a.level === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0"/>
          {a.msg}
        </div>
      ))}
    </div>
  );
}

/* ─── Multilingual Localization dictionary for FIFA World Cup 2026 ─── */
const TRANSLATIONS = {
  en: {
    analyticsTitle: "Analytics & Directory",
    liveLabel: "Apex Football Stadium · Live",
    crowdAnalytics: "Crowd Analytics",
    overallCapacity: "Overall Capacity",
    seats: "seats",
    highRiskZones: "High Risk Zones",
    busiestStand: "Busiest Stand",
    mostSpace: "Most Space",
    liveAlerts: "Live Alerts",
    gatesTitle: "Entry / Exit Gates",
    waitTrend: "Wait-time trend",
    concessionsTitle: "Concessions",
    restroomsTitle: "Restrooms",
    medicalTitle: "Medical Posts",
    parkingTitle: "Parking",
    spotsFree: "spots free",
    exitMin: "exit",
    aiRecTitle: "AI Recommendation",
    safeLimits: "All zones within safe limits",
    staffTitle: "Operational Decision Support",
    dispatchSecurity: "Dispatch Security Patrol to East Stand",
    openGate4: "Open auxiliary Gate G4 (Accessible)",
    greenTransitTitle: "Transit & Green Goals",
    transitTitle: "FIFA Express Transit",
    cupStatus: "Recyclable cups: 88% returned",
    metroLine: "Metro Line 1: 3 min wait",
    shuttleLine: "Eco-Shuttle: 5 min wait",
    fastestExit: "Fastest exit",
    manageable: "Conditions are manageable.",
  },
  es: {
    analyticsTitle: "Análisis y Directorio",
    liveLabel: "Estadio de Fútbol Apex · En Vivo",
    crowdAnalytics: "Análisis de Multitud",
    overallCapacity: "Capacidad General",
    seats: "asientos",
    highRiskZones: "Zonas de Alto Riesgo",
    busiestStand: "Tribuna Más Concurrida",
    mostSpace: "Más Espacio",
    liveAlerts: "Alertas en Vivo",
    gatesTitle: "Puertas de Entrada / Salida",
    waitTrend: "Tendencia de tiempo de espera",
    concessionsTitle: "Concesiones de Comida",
    restroomsTitle: "Baños Públicos",
    medicalTitle: "Puestos Médicos",
    parkingTitle: "Estacionamiento",
    spotsFree: "lugares libres",
    exitMin: "salida",
    aiRecTitle: "Recomendación de IA",
    safeLimits: "Todas las zonas en límites seguros",
    staffTitle: "Soporte de Decisión Operativa",
    dispatchSecurity: "Despachar patrulla de seguridad a Tribuna Este",
    openGate4: "Abrir puerta auxiliar G4 (Accesible)",
    greenTransitTitle: "Tránsito y Metas Ecológicas",
    transitTitle: "Tránsito Expreso FIFA",
    cupStatus: "Vasos reciclables: 88% devueltos",
    metroLine: "Línea 1 del Metro: 3 min de espera",
    shuttleLine: "Eco-Transbordo: 5 min de espera",
    fastestExit: "Salida más rápida",
    manageable: "Las condiciones son manejables.",
  },
  fr: {
    analyticsTitle: "Analyses et Répertoire",
    liveLabel: "Stade de Football Apex · En Direct",
    crowdAnalytics: "Analyse de la Foule",
    overallCapacity: "Capacité Globale",
    seats: "sièges",
    highRiskZones: "Zones à Haut Risque",
    busiestStand: "Tribune la Plus Chargée",
    mostSpace: "Plus d'Espace",
    liveAlerts: "Alertes en Direct",
    gatesTitle: "Portes d'Entrée / Sortie",
    waitTrend: "Tendance du temps d'attente",
    concessionsTitle: "Concessions Alimentaires",
    restroomsTitle: "Toilettes",
    medicalTitle: "Postes Médicaux",
    parkingTitle: "Parking",
    spotsFree: "places libres",
    exitMin: "sortie",
    aiRecTitle: "Recommandation d'IA",
    safeLimits: "Toutes les zones sous les limites de risque",
    staffTitle: "Support aux Décisions Opérationnelles",
    dispatchSecurity: "Déployer la patrouille de sécurité à la Tribune Est",
    openGate4: "Ouvrir la porte auxiliaire G4 (Accessible)",
    greenTransitTitle: "Transit et Objectifs Verts",
    transitTitle: "Transit Express FIFA",
    cupStatus: "Gobelets recyclables: 88% retournés",
    metroLine: "Métro Ligne 1: 3 min d'attente",
    shuttleLine: "Navette Éco: 5 min d'attente",
    fastestExit: "Sortie la plus rapide",
    manageable: "Les conditions sont gérables.",
  }
};

/* ─── Main component ─────────────────────────────────────────── */
export default function WaitTimeDashboard({ isAccessibleFilter, language = 'en', isStaffMode = false }) {
  const { venueData, loading, lastUpdated } = useFirestore();

  // Memoised sorts — placed at the top of the component to follow the rules of hooks
  const sortedGates = useMemo(() => {
    if (!venueData) return [];
    return [...venueData.gates].sort((a, b) => a.wait_minutes - b.wait_minutes);
  }, [venueData]);

  const sortedConcessions = useMemo(() => {
    if (!venueData) return [];
    return [...venueData.concessions].sort((a, b) => a.wait_minutes - b.wait_minutes);
  }, [venueData]);

  const sortedRestrooms = useMemo(() => {
    if (!venueData) return [];
    return [...venueData.restrooms]
      .filter(r => !isAccessibleFilter || r.accessible !== false)
      .sort((a, b) => a.wait_minutes - b.wait_minutes);
  }, [venueData, isAccessibleFilter]);

  const sortedParking = useMemo(() => {
    if (!venueData) return [];
    return [...venueData.parking].sort((a, b) => b.available - a.available);
  }, [venueData]);

  // Translate labels dynamically based on selected language
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  if (loading || !venueData) return null;

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-3 border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-gray-900 tracking-tight">{t.analyticsTitle}</h2>
            <p className="text-[9px] text-gray-400 font-medium mt-0.5 uppercase tracking-wider">
              {t.liveLabel}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
            <span className="text-[9px] text-gray-400 font-bold">
              {lastUpdated ? lastUpdated.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">

        {/* ── Staff Operations Card (Operational Intelligence Mode) ── */}
        {isStaffMode && (
          <div className="bg-orange-50 rounded-2xl p-4 mb-4 border border-orange-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-black text-orange-800 uppercase tracking-widest flex items-center gap-1">
                🛠️ {t.staffTitle}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <button className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors">
                🚨 {t.dispatchSecurity}
              </button>
              <button className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors">
                🚪 {t.openGate4}
              </button>
            </div>
          </div>
        )}

        {/* ── Crowd Analytics ── */}
        <SectionCard
          title={`🔥 ${t.crowdAnalytics}`}
          icon={<BarChart2 className="w-4 h-4 text-orange-500"/>}
        >
          <CrowdAnalytics zones={venueData.zones}/>
        </SectionCard>

        {/* ── Live Alerts ── */}
        <SectionCard
          title={`⚡ ${t.liveAlerts}`}
          icon={<Zap className="w-4 h-4 text-yellow-500"/>}
        >
          <AlertStrip zones={venueData.zones} gates={venueData.gates} concessions={venueData.concessions}/>
        </SectionCard>

        {/* ── Entry / Exit Gates ── */}
        <SectionCard
          title={t.gatesTitle}
          icon={<ArrowRightCircle className="w-4 h-4 text-indigo-600"/>}
        >
          <div className="flex flex-col">
            {sortedGates.map((item, i) => (
              <FacilityRow key={item.id} item={item} type="Gates" isBest={i === 0 && item.wait_minutes < 10}/>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50">
            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-2">{t.waitTrend}</div>
            <WaitSparklines items={venueData.gates} extractor={i => i.wait_minutes}/>
          </div>
        </SectionCard>

        {/* ── Concessions ── */}
        <SectionCard
          title={t.concessionsTitle}
          icon={<Utensils className="w-4 h-4 text-orange-500"/>}
        >
          <div className="flex flex-col">
            {sortedConcessions.map((item, i) => (
              <FacilityRow key={item.id} item={item} type="Concessions" isBest={i === 0 && item.wait_minutes < 10}/>
            ))}
          </div>
        </SectionCard>

        {/* ── Restrooms ── */}
        <SectionCard
          title={t.restroomsTitle}
          icon={<Droplet className="w-4 h-4 text-blue-500"/>}
        >
          <div className="flex flex-col">
            {sortedRestrooms.map((item, i) => (
              <FacilityRow key={item.id} item={item} type="Restrooms" isBest={i === 0 && item.wait_minutes < 8}/>
            ))}
          </div>
        </SectionCard>

        {/* ── Green Transit & Goals (Sustainability & Transport alignment) ── */}
        <SectionCard
          title={t.greenTransitTitle}
          icon={<Car className="w-4 h-4 text-emerald-600"/>}
        >
          <div className="flex flex-col gap-2 text-[11px] font-semibold text-gray-700">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <span className="text-[9px] px-1 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black">ECO</span>
              {t.transitTitle}
            </div>
            <div className="pl-1 border-l-2 border-emerald-300 flex flex-col gap-1">
              <div>🚇 {t.metroLine}</div>
              <div>🚌 {t.shuttleLine}</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">🌱 {t.cupStatus}</div>
            </div>
          </div>
        </SectionCard>

        {/* ── Medical ── */}
        <SectionCard
          title={t.medicalTitle}
          icon={<HeartPulse className="w-4 h-4 text-red-500"/>}
        >
          <div className="flex flex-col">
            {venueData.medical_posts?.map(item => (
              <FacilityRow key={item.id} item={item} type="Medical" isBest={false}/>
            ))}
          </div>
        </SectionCard>

        {/* ── Parking ── */}
        <SectionCard
          title={t.parkingTitle}
          icon={<Car className="w-4 h-4 text-gray-700"/>}
        >
          <div className="flex flex-col">
            {sortedParking.map((item, i) => (
              <FacilityRow key={item.id} item={item} type="Parking" isBest={i === 0}/>
            ))}
          </div>
        </SectionCard>

        {/* ── Crowd flow recommendation ── */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-4 mb-4 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-4 h-4 text-blue-300"/>
            <span className="text-[11px] font-black text-blue-200 uppercase tracking-widest">{t.aiRecTitle}</span>
          </div>
          <p className="text-white text-[12px] font-semibold leading-relaxed">
            {(() => {
              const z = venueData.zones.find(z => z.id === 'Z3');
              const pct = z ? (z.current_occupancy / z.capacity * 100) : 0;
              if (pct > 85) return '🔴 East Premium is at critical capacity. Redirect fans to West Family Zone — 40% more space available.';
              const g = sortedGates[0];
              return `✅ Conditions are manageable. Fastest exit: ${g?.name || 'South Gate'} with only ${g?.wait_minutes || 3}-min queue.`;
            })()}
          </p>
        </div>

      </div>
    </div>
  );
}
