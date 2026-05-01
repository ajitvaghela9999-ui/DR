import React, { useEffect, useState, useRef } from 'react';
import {
  Activity,
  Bed as BedIcon,
  Users,
  Stethoscope,
  AlertTriangle,
  LayoutDashboard,
  Map as MapIcon,
  TrendingUp,
  Settings,
  Bell,
  Search,
  Plus,
  ArrowRight,
  Clock,
  ShieldAlert,
  HeartPulse,
  Calendar,
  Brain,
  Sparkles,
  MessageSquare,
  Microscope,
  Zap,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { format } from 'date-fns';
import { cn } from './lib/utils';
import { HospitalState, ServerEvent, Ward, Bed, Patient, Doctor, Equipment, User } from './types';
import { Auth } from './components/Auth';
import { div } from 'motion/react-client';

// --- Functions & Hooks ---

const useVitals = (active: boolean) => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setData((prev: string | any[]) => {
        const last = prev.length > 0 ? prev[prev.length - 1].value : 70;
        // Brownian motion-like walk with reversion to mean
        const targetMean = 75;
        const drift = (targetMean - last) * 0.1;
        const shock = (Math.random() - 0.5) * 4;
        const next = Math.max(60, Math.min(100, last + drift + shock));

        const newData = [...prev, {
          time: new Date().toLocaleTimeString(),
          value: Math.round(next),
          spo2: Math.round(95 + Math.random() * 4),
          bp: `${Math.round(110 + Math.random() * 20)}/${Math.round(70 + Math.random() * 15)}`
        }];
        return newData.slice(-20);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [active]);

  return data;
};

// --- Components ---

const StatCard = ({ title, value, icon: Icon, trend, color, onClick }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.05, translateY: -5 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between cursor-pointer transition-all hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 relative overflow-hidden group"
  >
    <div className={cn("absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 transition-transform group-hover:scale-150", color)} />
    <div className="relative z-10">
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
        {trend !== undefined && (
          <div className={cn("flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-lg", trend >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "bg-rose-50 dark:bg-rose-900/20 text-rose-600")}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
    </div>
    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center relative z-10 transition-transform group-hover:rotate-12", color.replace('bg-', 'bg-').replace('-600', '-50'), "dark:bg-slate-700/50")}>
      <Icon className={cn("w-7 h-7", color.replace('bg-', 'text-'))} />
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse hidden group-hover:block" />
    </div>
  </motion.div>
);
const AIInsightCard = ({ title, description, badge, badgeColor, icon: Icon, progress }: any) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    whileHover={{ scale: 1.02 }}
    className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group"
  >
    <div className={cn("absolute top-0 left-0 w-1 h-full", badgeColor)} />
    <div className="flex items-start gap-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", badgeColor.replace('bg-', 'bg-').replace('-600', '-50'))}>
        <Icon className={cn("w-5 h-5", badgeColor.replace('bg-', 'text-'))} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
          <span className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase", badgeColor.replace('bg-', 'bg-').replace('-600', '-100'), badgeColor.replace('bg-', 'text-'), "dark:bg-slate-700 dark:text-white")}>
            {badge}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{description}</p>
        {progress !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-[8px] font-bold text-slate-400 dark:text-slate-500">
              <span>CONFIDENCE</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className={cn("h-full", badgeColor)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);


const PatientVitalsMonitor = ({ active }: { active: boolean }) => {
  const vitals = useVitals(active);
  const latest = vitals.length > 0 ? vitals[vitals.length - 1] : null;

  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
          <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Blood Pressure</p>
          <p className="text-lg font-black text-cyan-400 font-mono">{latest?.bp || '--/--'}</p>
        </div>
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
          <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">SpO2 Level</p>
          <p className="text-lg font-black text-emerald-400 font-mono">{latest?.spo2 || '--'}%</p>
        </div>
      </div>

      <div className="h-40 w-full bg-slate-900 rounded-2xl p-4 overflow-hidden border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Heart Rate</span>
          </div>
          <span className="text-xl font-black text-rose-500 font-mono">
            {latest?.value || '--'} <span className="text-[10px]">BPM</span>
          </span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={vitals}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10px' }}
              itemStyle={{ color: '#f43f5e' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#f43f5e"
              strokeWidth={3}
              dot={false}
              animationDuration={500}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const WardMap = ({ wards, beds, onBedClick, patients, equipment }: { wards: Ward[], beds: Bed[], onBedClick: (bed: Bed) => void, patients: Patient[], equipment: Equipment[] }) => {
  const [filter, setFilter] = useState<'all' | 'available' | 'occupied'>('all');
  const [showIoT, setShowIoT] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex gap-2">
          {(['all', 'available', 'occupied'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                filter === f
                  ? "bg-slate-900 dark:bg-cyan-600 text-white shadow-lg"
                  : "bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600"
              )}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> Available</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-rose-500 rounded-full" /> Occupied</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-amber-500 rounded-full" /> Cleaning</div>
        </div>
        <button
          onClick={() => setShowIoT(!showIoT)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors",
            showIoT ? "bg-indigo-600 dark:bg-indigo-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
          )}
        >
          <Zap className="w-3 h-3" />
          IoT Tracking {showIoT ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {wards.map((ward) => {
          const wardBeds = beds.filter(b => b.wardId === ward.id);
          const filteredBeds = wardBeds.filter(b => filter === 'all' || b.status === filter);
          const occupiedCount = wardBeds.filter(b => b.status === 'occupied').length;
          const occupancyRate = Math.round((occupiedCount / ward.capacity) * 100);

          return (
            <motion.div
              key={ward.id}
              layout
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6 border-b border-slate-50 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/30">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className={cn(
                      "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase mb-1 inline-block",
                      ward.type === 'ICU' ? "bg-rose-100 text-rose-600" : ward.type === 'Normal' ? "bg-cyan-100 text-cyan-600" : "bg-indigo-100 text-indigo-600"
                    )}>
                      {ward.type} UNIT
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">{ward.name}</h4>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xl font-black", occupancyRate > 80 ? "text-rose-600" : "text-emerald-600")}>
                      {occupancyRate}%
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Occupancy</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${occupancyRate}%` }}
                    className={cn("h-full transition-all duration-1000", occupancyRate > 80 ? "bg-rose-500" : "bg-emerald-500")}
                  />
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-6 gap-3">
                  {filteredBeds.map((bed) => {
                    const patient = patients.find(p => p.bedId === bed.id);
                    return (
                      <button
                        key={bed.id}
                        onClick={() => onBedClick(bed)}
                        className={cn(
                          "aspect-square rounded-xl flex flex-col items-center justify-center transition-all hover:scale-110 relative group",
                          bed.status === 'available' && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40",
                          bed.status === 'occupied' && "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40",
                          bed.status === 'cleaning' && "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40",
                          bed.status === 'maintenance' && "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600"
                        )}
                      >
                        <BedIcon className="w-4 h-4" />
                        <span className="text-[8px] font-bold mt-1">{bed.id.split('-b')[1]}</span>

                        {patient && (
                          <div className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm">
                            !
                          </div>
                        )}

                        {/* Advanced Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
                          <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border border-slate-800 min-w-[160px]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bed {bed.id.split('-b')[1]}</span>
                              <div className={cn("w-2 h-2 rounded-full animate-pulse",
                                bed.status === 'available' ? "bg-emerald-500" :
                                  bed.status === 'occupied' ? "bg-rose-500" : "bg-amber-500"
                              )} />
                            </div>
                            <p className="text-xs font-bold mb-1">{patient ? patient.name : 'Unoccupied'}</p>
                            <p className="text-[9px] text-slate-400 mb-2">{patient ? patient.condition : 'Ready for admission'}</p>
                            {patient && (
                              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                                <span className="text-[8px] text-slate-500">SEVERITY</span>
                                <span className={cn("text-[8px] font-bold uppercase",
                                  patient.severity === 'critical' ? "text-rose-500" : "text-amber-500"
                                )}>{patient.severity}</span>
                              </div>
                            )}
                          </div>
                          <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1 border-r border-b border-slate-800" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {showIoT && (
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Microscope className="w-3 h-3 text-indigo-600" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nearby IoT Equipment</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {equipment.filter(e => e.location.includes(ward.name)).length > 0 ? (
                        equipment.filter(e => e.location.includes(ward.name)).map(e => (
                          <div key={e.id} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 group relative cursor-help">
                            <Zap className={cn("w-3 h-3", e.status === 'in-use' ? "text-amber-500" : "text-emerald-500")} />
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{e.name}</span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-20 pointer-events-none transition-opacity">
                              Serial: {e.id} • Battery: {e.battery}% • {e.status}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[9px] text-slate-400 italic">No equipment tracked in this ward.</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                  <span>{occupiedCount} / {ward.capacity} Beds Occupied</span>
                  <button
                    onClick={() => {
                      alert(`Ward Details: ${ward.name}\nType: ${ward.type}\nCapacity: ${ward.capacity}\nOccupancy: ${occupancyRate}%`);
                    }}
                    className="text-cyan-600 hover:underline"
                  >
                    Ward Details
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const AlertToast = ({ alert, onClose }: { alert: any, onClose: () => void, key?: React.Key }) => (
  <motion.div
    initial={{ opacity: 0, x: 100 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 100 }}
    className={cn(
      "p-4 rounded-xl shadow-lg border flex items-start gap-3 max-w-sm mb-3 pointer-events-auto",
      alert.severity === 'error' && "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-400",
      alert.severity === 'warning' && "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400",
      alert.severity === 'info' && "bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-900/30 dark:border-sky-700 dark:text-sky-400"
    )}
  >
    <div className="mt-0.5">
      {alert.severity === 'error' ? <ShieldAlert className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-slate-900 dark:text-white">{alert.message}</p>
      <p className="text-xs opacity-70 mt-1 text-slate-500 dark:text-slate-400">{format(new Date(), 'HH:mm:ss')}</p>
    </div>
    <button onClick={onClose} className="opacity-50 hover:opacity-100 text-slate-500 dark:text-slate-400">
      <Plus className="w-4 h-4 rotate-45" />
    </button>
  </motion.div>
);

const AIDiagnosticSidebar = ({ isOpen, onClose, onDiagnosisGenerated }: { isOpen: boolean, onClose: () => void, onDiagnosisGenerated?: (report: any) => void }) => {
  const [symptoms, setSymptoms] = useState('');
  const [history, setHistory] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDiagnose = async () => {
    if (!symptoms) return;
    setLoading(true);
    try {
      const response = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, history }),
      });
      const data = await response.json();
      if (data.success) {
        setDiagnosis(data.diagnosis);
        if (onDiagnosisGenerated) {
          onDiagnosisGenerated({
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            symptoms,
            history,
            diagnosis: data.diagnosis
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl z-[101] border-l border-slate-200 dark:border-slate-800 flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-hospital-green-50/50 dark:bg-hospital-green-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-hospital-green-600 rounded-xl flex items-center justify-center text-white">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Diagnostic Assistant</h2>
                  <p className="text-xs text-hospital-green-600 font-medium">PulsePoint Clinical Intelligence</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <Plus className="w-6 h-6 rotate-45 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Patient Symptoms</label>
                  <textarea
                    value={symptoms}
                    onChange={(e: { target: { value: any; }; }) => setSymptoms(e.target.value)}
                    placeholder="Describe symptoms, duration, and severity..."
                    className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-hospital-green-500 outline-none transition-all dark:text-white resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Medical History (Optional)</label>
                  <textarea
                    value={history}
                    onChange={(e: { target: { value: any; }; }) => setHistory(e.target.value)}
                    placeholder="Relevant past conditions, allergies, or medications..."
                    className="w-full h-24 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-hospital-green-500 outline-none transition-all dark:text-white resize-none"
                  />
                </div>
                <button
                  onClick={handleDiagnose}
                  disabled={loading || !symptoms}
                  className="w-full py-4 bg-hospital-green-600 hover:bg-hospital-green-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-hospital-green-200 dark:shadow-none"
                >
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate AI Analysis
                    </>
                  )}
                </button>
              </div>

              {diagnosis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-hospital-green-500 to-emerald-500" />
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      AI Analysis Result
                    </h3>
                    <button
                      onClick={() => {
                        const blob = new Blob([diagnosis], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `diagnosis-${Date.now()}.txt`;
                        a.click();
                      }}
                      className="text-[10px] font-bold text-hospital-green-600 hover:underline"
                    >
                      EXPORT REPORT
                    </button>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {diagnosis}
                    </div>
                  </div>

                  {/* Visual Report Summary Cards */}
                  <div className="mt-8 space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <LayoutDashboard className="w-3 h-3" />
                      Visual Report Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-hospital-green-50 dark:bg-hospital-green-900/20 rounded-2xl border border-hospital-green-100 dark:border-hospital-green-800 transition-all hover:shadow-md">
                        <Activity className="w-5 h-5 text-hospital-green-600 mb-2" />
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Skin Analysis</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Generated</p>
                      </div>
                      <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl border border-cyan-100 dark:border-cyan-800 transition-all hover:shadow-md">
                        <Zap className="w-5 h-5 text-cyan-600 mb-2" />
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Hydration Plan</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Ready</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        Recommended Protocols
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                         {/* Product 1 */}
                         <div className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-black rounded-xl overflow-hidden flex items-center justify-center p-1 shrink-0 border border-slate-100 dark:border-slate-800">
                               <img src="file:///C:/Users/PRENEEL/.gemini/antigravity/brain/14fccec1-ba1b-4c27-a3d6-feb148a1b67d/medical_skin_cream_1777617301129.png" alt="Cream" className="w-full h-full object-contain" />
                            </div>
                            <div className="min-w-0">
                               <p className="text-[8px] font-black text-hospital-green-600 uppercase mb-0.5">Dermatology</p>
                               <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">Clinical Repair Cream</h5>
                               <p className="text-[9px] text-slate-500 truncate">Apply to affected area twice daily.</p>
                            </div>
                         </div>

                         {/* Product 2 */}
                         <div className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-black rounded-xl overflow-hidden flex items-center justify-center p-1 shrink-0 border border-slate-100 dark:border-slate-800">
                               <img src="file:///C:/Users/PRENEEL/.gemini/antigravity/brain/14fccec1-ba1b-4c27-a3d6-feb148a1b67d/hydration_supplement_1777617315462.png" alt="Supplement" className="w-full h-full object-contain" />
                            </div>
                            <div className="min-w-0">
                               <p className="text-[8px] font-black text-cyan-600 uppercase mb-0.5">Hydration</p>
                               <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">Cellular Water Matrix</h5>
                               <p className="text-[9px] text-slate-500 truncate">Mix with 500ml water for recovery.</p>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl">
                    <p className="text-[9px] text-amber-700 dark:text-amber-400 font-medium leading-tight">
                      DISCLAIMER: This analysis is generated by AI for educational and supportive purposes. All medical decisions must be verified by a licensed professional.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Main App ---

export default function App() {
  const [state, setState] = useState<HospitalState | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'patients' | 'doctors' | 'messages' | 'doctor-dashboard' | 'doctor-schedule' | 'doctor-patients' | 'ai-reports'>('dashboard');
  const [aiReports, setAiReports] = useState<any[]>(() => {
    const saved = localStorage.getItem('ai_reports');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ai_reports', JSON.stringify(aiReports));
  }, [aiReports]);
  const [userRole, setUserRole] = useState<'patient' | 'doctor'>('patient');
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDoctorFormOpen, setIsDoctorFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      if (user.role === 'doctor') {
        setUserRole('doctor');
        setCurrentDoctorId(user.referenceId || null);
        setActiveTab('doctor-dashboard');
      } else {
        // Patients or others go to patient panel
        setUserRole('patient');
        setActiveTab('dashboard');
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    if (user.role === 'doctor') {
      setUserRole('doctor');
      setCurrentDoctorId(user.referenceId || null);
      setActiveTab('doctor-dashboard');
    } else {
      setUserRole('patient');
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
  };

  const handleConnectDoctor = async (doctor: Doctor) => {
    const condition = prompt(`Reason for connecting with Dr. ${doctor.name}:`);
    if (!condition) return;

    const apptData = {
      id: `a-${Date.now()}`,
      patientName: currentUser?.name || 'Patient',
      patientAge: 30, // Default or prompt
      condition,
      severity: 'medium',
      doctorId: doctor.id,
      status: 'pending',
      requestTime: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apptData),
      });

      if (response.ok) {
        alert('Appointment request sent! The doctor will review it soon.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [dashboardFilter, setDashboardFilter] = useState<'all' | 'critical' | 'available'>('all');
  const scheduleRef = useRef<HTMLDivElement>(null);
  const patientsRef = useRef<HTMLDivElement>(null);
  const appointmentsRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);

    socket.onmessage = (event) => {
      const data: ServerEvent = JSON.parse(event.data);

      switch (data.type) {
        case 'INITIAL_STATE':
          setState(data.payload);
          if (!currentDoctorId && data.payload.doctors.length > 0) {
            setCurrentDoctorId(data.payload.doctors[0].id);
          }
          break;
        case 'BED_UPDATE':
          setState((prev: { beds: any[]; }) => prev ? ({
            ...prev,
            beds: prev.beds.map((b: { id: string; }) => b.id === data.payload.id ? data.payload : b)
          }) : null);
          break;
        case 'PATIENT_UPDATE':
          setState((prev: { patients: any[]; }) => prev ? ({
            ...prev,
            patients: [...prev.patients.filter((p: { id: string; }) => p.id !== data.payload.id), data.payload]
          }) : null);
          break;
        case 'DOCTOR_UPDATE':
          setState((prev: { doctors: any[]; }) => prev ? ({
            ...prev,
            doctors: prev.doctors.map((d: { id: string; }) => d.id === data.payload.id ? data.payload : d)
          }) : null);
          break;
        case 'APPOINTMENT_UPDATE':
          setState((prev: { appointments: any[]; }) => prev ? ({
            ...prev,
            appointments: [...prev.appointments.filter((a: { id: string; }) => a.id !== data.payload.id), data.payload]
          }) : null);
          break;
        case 'MESSAGE_UPDATE':
          setState((prev: { messages: any; }) => prev ? ({
            ...prev,
            messages: [...(prev.messages || []).filter((m: { id: string; }) => m.id !== data.payload.id), data.payload]
          }) : null);
          break;
        case 'ALERT':
          if (pushNotificationsEnabled) {
            setAlerts((prev: any) => [{ ...data.payload, id: Date.now() }, ...prev].slice(0, 5));
          }
          break;
      }
    };

    ws.current = socket;
    return () => socket.close();
  }, []);

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-slate-500 font-medium">Initializing PulsePoint Twin...</p>
        </div>
      </div>
    );
  }

  const occupiedBeds = state.beds.filter((b: { status: string; }) => b.status === 'occupied').length;
  const totalBeds = state.beds.length;
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);
  const activeDoctors = state.doctors.filter((d: { status: string; }) => d.status === 'on-duty').length;
  const criticalPatients = state.patients.filter((p: { severity: string; }) => p.severity === 'critical').length;

  const chartData = [
    { name: '00:00', load: 45, predicted: 48 },
    { name: '02:00', load: 38, predicted: 40 },
    { name: '04:00', load: 30, predicted: 32 },
    { name: '06:00', load: 42, predicted: 45 },
    { name: '08:00', load: 65, predicted: 62 },
    { name: '10:00', load: 78, predicted: 80 },
    { name: '12:00', load: 85, predicted: 82 },
    { name: '14:00', load: 82, predicted: 85 },
    { name: '16:00', load: 75, predicted: 78 },
    { name: '18:00', load: 68, predicted: 70 },
    { name: '20:00', load: 60, predicted: 58 },
    { name: '22:00', load: 52, predicted: 50 },
  ];

  const pieData = state.wards.map((ward: { name: any; id: any; }) => ({
    name: ward.name,
    value: state.beds.filter((b: { wardId: any; status: string; }) => b.wardId === ward.id && b.status === 'occupied').length
  })).filter((d: { value: number; }) => d.value > 0);

  const COLORS = ['#0891b2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className={cn(
        "w-64 border-r flex flex-col hidden md:flex transition-colors duration-300",
        darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-hospital-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-hospital-green-200/50">
            <HeartPulse className="text-white w-6 h-6" />
          </div>
          <h1 className={cn("font-bold text-xl tracking-tight", darkMode ? "text-white" : "text-slate-900")}>PulsePoint</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {userRole === 'patient' ? (
            <div className="px-4 py-2">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Patient Portal</p>
              <div className="space-y-1">
                {[
                  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                  { id: 'map', icon: MapIcon, label: 'Ward Status' },
                  { id: 'patients', icon: Users, label: 'My Records' },
                  { id: 'doctors', icon: Stethoscope, label: 'Find Doctors' },
                  { id: 'messages', icon: MessageSquare, label: 'Messages' },
                  { id: 'ai-reports', icon: Sparkles, label: 'AI Health Reports' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                      activeTab === item.id
                        ? (darkMode ? "bg-slate-800 text-cyan-400 shadow-lg shadow-cyan-900/20" : "bg-cyan-50 text-cyan-600")
                        : (darkMode ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 py-2">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Doctor Portal</p>
              <div className="space-y-1">
                {[
                  { id: 'doctor-dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
                  { id: 'doctor-schedule', icon: Clock, label: 'My Schedule' },
                  { id: 'doctor-patients', icon: Users, label: 'My Patients' },
                  { id: 'messages', icon: MessageSquare, label: 'Messages' },
                  { id: 'ai-reports', icon: Sparkles, label: 'AI Health Reports' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                      activeTab === item.id
                        ? (darkMode ? "bg-slate-800 text-cyan-400" : "bg-cyan-50 text-cyan-600")
                        : (darkMode ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => alert('System Health: All services operational.\nLatency: 24ms\nUptime: 99.99%')}
            className="w-full bg-slate-900 rounded-2xl p-4 text-white hover:bg-slate-800 transition-all text-left group"
          >
            <p className="text-xs text-slate-400 mb-1 group-hover:text-slate-300 transition-colors">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Live Sync Active</span>
            </div>
          </button>

          <button
            onClick={() => setPushNotificationsEnabled(!pushNotificationsEnabled)}
            className={cn(
              "w-full mt-3 rounded-2xl p-4 flex items-center justify-between transition-all group",
              pushNotificationsEnabled 
                ? "bg-emerald-600/10 border border-emerald-500/20 text-emerald-600" 
                : "bg-rose-600/10 border border-rose-500/20 text-rose-600"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                pushNotificationsEnabled ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
              )}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Notifications</p>
                <p className="text-sm font-bold">{pushNotificationsEnabled ? 'ACTIVE' : 'MUTED'}</p>
              </div>
            </div>
            <div className={cn(
              "w-10 h-5 rounded-full relative transition-colors",
              pushNotificationsEnabled ? "bg-emerald-500" : "bg-slate-300"
            )}>
              <motion.div
                animate={{ x: pushNotificationsEnabled ? 20 : 0 }}
                className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"
              />
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-cyan-600 transition-colors" />
              <input
                type="text"
                placeholder="Search patients, doctors, or equipment..."
                value={searchQuery}
                onChange={(e: { target: { value: any; }; }) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all dark:text-white"
              />

              <AnimatePresence>
                {searchQuery.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-[60] overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Quick Results</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {state.patients.filter((p: { name: string; }) => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p: { id: any; name: any; condition: any; }) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedPatient(p);
                            setSearchQuery('');
                          }}
                          className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left border-b border-slate-50 dark:border-slate-700 last:border-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 rounded-full flex items-center justify-center text-[10px] font-bold">PT</div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Patient • {p.condition}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                        </button>
                      ))}
                      {state.doctors.filter((d: { name: string; }) => d.name.toLowerCase().includes(searchQuery.toLowerCase())).map((d: { id: any; name: any; specialty: any; }) => (
                        <button
                          key={d.id}
                          onClick={() => {
                            setSelectedDoctor(d);
                            setSearchQuery('');
                          }}
                          className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left border-b border-slate-50 dark:border-slate-700 last:border-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-[10px] font-bold">DR</div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{d.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Doctor • {d.specialty}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                        </button>
                      ))}
                      {state.patients.filter((p: { name: string; }) => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 &&
                        state.doctors.filter((d: { name: string; }) => d.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                          <div className="p-8 text-center">
                            <p className="text-xs text-slate-400 italic">No results found for "{searchQuery}"</p>
                          </div>
                        )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {userRole === 'doctor' && (
              <button
                onClick={() => setIsAIModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-hospital-green-600 hover:bg-hospital-green-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-hospital-green-200 dark:shadow-none shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                AI Consult
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Role Switcher Removed for Security */}

            {/* Only internal staff viewing as patient can switch which account they view */}
            {currentUser.role === 'staff' && userRole === 'doctor' && (
              <select
                value={currentDoctorId || ''}
                onChange={(e: { target: { value: any; }; }) => setCurrentDoctorId(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-none rounded-xl text-xs font-bold px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {state.doctors.map((d: { id: any; name: any; }) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}

            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={cn(
                  "p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative transition-colors",
                  isNotificationsOpen && "bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400"
                )}
              >
                <Bell className="w-5 h-5" />
                {alerts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                )}
              </button>

              <button
                onClick={() => setPushNotificationsEnabled(!pushNotificationsEnabled)}
                className={cn(
                  "ml-2 p-2 rounded-full transition-all flex items-center justify-center",
                  pushNotificationsEnabled 
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" 
                    : "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                )}
                title={pushNotificationsEnabled ? "Turn Notifications OFF" : "Turn Notifications ON"}
              >
                {pushNotificationsEnabled ? <Zap className="w-4 h-4" /> : <Zap className="w-4 h-4 opacity-50" />}
                <span className="text-[8px] font-bold ml-1 uppercase">{pushNotificationsEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">Recent Alerts</h4>
                        <button onClick={() => setAlerts([])} className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700">Clear All</button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {alerts.length > 0 ? (
                          alerts.map((alert: { id: any; severity: string; message: any; }) => (
                            <div key={alert.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <div className="flex gap-3">
                                <div className={cn(
                                  "w-2 h-2 mt-1.5 rounded-full shrink-0",
                                  alert.severity === 'error' ? "bg-rose-500" : alert.severity === 'warning' ? "bg-amber-500" : "bg-cyan-500"
                                )} />
                                <p className="text-xs text-slate-600 leading-relaxed">{alert.message}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-xs text-slate-400">No new notifications</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4 ml-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 capitalize">{currentUser.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 rounded-full flex items-center justify-center transition-all group"
                title="Logout"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {userRole === 'doctor' ? (
              <motion.div
                key="doctor-portal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Doctor Dashboard</h2>
                    <p className="text-slate-500 dark:text-slate-400">Welcome back, {state.doctors.find((d: { id: any; }) => d.id === currentDoctorId)?.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase",
                      state.doctors.find((d: { id: any; }) => d.id === currentDoctorId)?.status === 'on-duty' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                    )}>
                      {state.doctors.find((d: { id: any; }) => d.id === currentDoctorId)?.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="My Patients"
                    value={state.patients.filter((p: { doctorId: any; }) => p.doctorId === currentDoctorId).length}
                    icon={Users}
                    color="bg-cyan-600"
                    onClick={() => setActiveTab('doctor-patients')}
                  />
                  <StatCard
                    title="New Requests"
                    value={state.appointments.filter((a: { doctorId: any; status: string; }) => a.doctorId === currentDoctorId && a.status === 'pending').length}
                    icon={Bell}
                    color="bg-rose-500"
                    onClick={() => setActiveTab('doctor-dashboard')}
                  />
                  <StatCard
                    title="Active Appointments"
                    value={state.appointments.filter((a: { doctorId: any; status: string; }) => a.doctorId === currentDoctorId && a.status === 'accepted').length}
                    icon={Clock}
                    color="bg-amber-600"
                    onClick={() => setActiveTab('doctor-dashboard')}
                  />
                  <StatCard
                    title="Current Duty"
                    value={state.doctors.find((d: { id: any; }) => d.id === currentDoctorId)?.status === 'on-duty' ? 'Active' : 'Standby'}
                    icon={Stethoscope}
                    color="bg-indigo-600"
                    onClick={() => setActiveTab('doctor-schedule')}
                  />
                </div>

                {/* Smart Diagnosis Assistant Section */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl shadow-lg shadow-indigo-200 text-white relative overflow-hidden mb-8">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Brain className="w-24 h-24" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-indigo-200" />
                      <h3 className="font-bold uppercase tracking-wider text-xs text-indigo-100">Smart Diagnosis Assistant</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 group hover:bg-white/20 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold">Inference: Recovery Path</p>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                            <span className="text-[10px] font-bold text-emerald-400">92% CONFIDENCE</span>
                          </div>
                        </div>
                        <p className="text-xs text-indigo-100 leading-relaxed mb-3">
                          Multimodal analysis predicts <strong>High Stability</strong> for Patient #104. Automated discharge readiness potential in 36h.
                        </p>
                        <div className="w-full h-1 bg-indigo-900/50 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                        </div>
                      </div>
                      <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 group hover:bg-white/20 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold">Cognitive Resource Alert</p>
                          <span className="px-2 py-0.5 bg-rose-500 text-[8px] font-bold rounded-lg uppercase shadow-lg shadow-rose-900/20">Critical</span>
                        </div>
                        <p className="text-xs text-indigo-100 leading-relaxed">
                          Pattern recognized: <strong>Influenza Cluster</strong> in Sector B. Recommending immediate pre-allocation of ventilators (Node 05-08).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "grid gap-8",
                  activeTab === 'doctor-dashboard' ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"
                )}>
                  {/* My Schedule */}
                  {(activeTab === 'doctor-dashboard' || activeTab === 'doctor-schedule') && (
                    <div ref={scheduleRef} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-600" /> My Schedule
                      </h3>
                      <form
                        key={currentDoctorId}
                        onSubmit={async (e: { preventDefault: () => void; currentTarget: HTMLFormElement; }) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const res = await fetch(`/api/doctors/${currentDoctorId}/schedule`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              shiftStart: formData.get('shiftStart'),
                              shiftEnd: formData.get('shiftEnd')
                            })
                          });
                          if (res.ok) {
                            alert('Schedule updated successfully!');
                          }
                        }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Shift Start</label>
                            <input
                              name="shiftStart"
                              type="time"
                              defaultValue={state.doctors.find((d: { id: any; }) => d.id === currentDoctorId)?.shiftStart}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Shift End</label>
                            <input
                              name="shiftEnd"
                              type="time"
                              defaultValue={state.doctors.find((d: { id: any; }) => d.id === currentDoctorId)?.shiftEnd}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                        >
                          Update Schedule
                        </button>
                      </form>
                      <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Current Shift</span>
                          <span className="text-slate-900 font-bold">
                            {state.doctors.find((d: { id: any; }) => d.id === currentDoctorId)?.shiftStart} - {state.doctors.find((d: { id: any; }) => d.id === currentDoctorId)?.shiftEnd}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Duty Status</span>
                          <span className="text-emerald-600 font-bold">Active</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* My Patients */}
                  {(activeTab === 'doctor-dashboard' || activeTab === 'doctor-patients') && (
                    <div ref={patientsRef} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-cyan-600" /> My Assigned Patients
                      </h3>
                      <div className="space-y-4">
                        {state.patients.filter((p: { doctorId: any; }) => p.doctorId === currentDoctorId).length > 0 ? (
                          state.patients.filter((p: { doctorId: any; }) => p.doctorId === currentDoctorId).map((patient: { id: any; name: string; condition: any; severity: string; }) => (
                            <div
                              key={patient.id}
                              onClick={() => setSelectedPatient(patient)}
                              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center font-bold">
                                  {patient.name.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">{patient.name}</p>
                                  <p className="text-xs text-slate-500">{patient.condition}</p>
                                </div>
                              </div>
                              <span className={cn(
                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                patient.severity === 'critical' && "bg-rose-100 text-rose-600",
                                patient.severity === 'high' && "bg-amber-100 text-amber-600",
                                patient.severity === 'medium' && "bg-sky-100 text-sky-600",
                                patient.severity === 'low' && "bg-emerald-100 text-emerald-600"
                              )}>
                                {patient.severity}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-center py-8 text-slate-400 text-sm italic">No patients currently assigned.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Appointments Management */}
                  {activeTab === 'doctor-dashboard' && (
                    <div ref={appointmentsRef} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-600" /> Appointments
                      </h3>
                      <div className="space-y-6">
                        {/* Pending */}
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Pending Requests</h4>
                          <div className="space-y-3">
                            {state.appointments.filter((a: { doctorId: any; status: string; }) => a.doctorId === currentDoctorId && a.status === 'pending').length > 0 ? (
                              state.appointments.filter((a: { doctorId: any; status: string; }) => a.doctorId === currentDoctorId && a.status === 'pending').map((appt: { id: any; patientName: any; condition: any; }) => (
                                <div key={appt.id} className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h4 className="font-bold text-slate-900 text-sm">{appt.patientName}</h4>
                                      <p className="text-[10px] text-slate-500">{appt.condition}</p>
                                    </div>
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-bold uppercase">Pending</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={async () => {
                                        await fetch(`/api/appointments/${appt.id}/accept`, { method: 'POST' });
                                      }}
                                      className="flex-1 py-1.5 bg-cyan-600 text-white rounded-lg text-[10px] font-bold hover:bg-cyan-700 transition-colors"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={async () => {
                                        await fetch(`/api/appointments/${appt.id}/decline`, { method: 'POST' });
                                      }}
                                      className="flex-1 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-300 transition-colors"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-4 text-slate-400 text-[10px] italic">No pending requests.</p>
                            )}
                          </div>
                        </div>

                        {/* Accepted/Active */}
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Accepted Appointments</h4>
                          <div className="space-y-3">
                            {state.appointments.filter((a: { doctorId: any; status: string; }) => a.doctorId === currentDoctorId && a.status === 'accepted').length > 0 ? (
                              state.appointments.filter((a: { doctorId: any; status: string; }) => a.doctorId === currentDoctorId && a.status === 'accepted').map((appt: { id: any; patientName: any; condition: any; }) => (
                                <div key={appt.id} className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h4 className="font-bold text-slate-900 text-sm">{appt.patientName}</h4>
                                      <p className="text-[10px] text-slate-500">{appt.condition}</p>
                                    </div>
                                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold uppercase">Accepted</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setSelectedPatient(state.patients.find((p: { name: any; }) => p.name === appt.patientName) || null)}
                                      className="flex-1 py-1.5 bg-white border border-emerald-200 text-emerald-600 rounded-lg text-[10px] font-bold hover:bg-emerald-50 transition-colors"
                                    >
                                      View Patient
                                    </button>
                                    <button
                                      onClick={async () => {
                                        await fetch(`/api/appointments/${appt.id}/complete`, { method: 'POST' });
                                      }}
                                      className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-colors"
                                    >
                                      Complete
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (confirm('Cancel this appointment?')) {
                                          await fetch(`/api/appointments/${appt.id}/cancel`, { method: 'POST' });
                                        }
                                      }}
                                      className="flex-1 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-4 text-slate-400 text-[10px] italic">No active appointments.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <StatCard
                        title="Bed Occupancy"
                        value={`${occupancyRate}%`}
                        icon={BedIcon}
                        trend={12}
                        color="bg-cyan-600"
                        onClick={() => setActiveTab('map')}
                      />
                      <StatCard
                        title="Active Doctors"
                        value={activeDoctors}
                        icon={Stethoscope}
                        trend={5}
                        color="bg-emerald-600"
                        onClick={() => setActiveTab('doctors')}
                      />
                      <StatCard
                        title="Total Patients"
                        value={state.patients.length}
                        icon={Users}
                        trend={-2}
                        color="bg-amber-600"
                        onClick={() => setActiveTab('patients')}
                      />
                      <StatCard
                        title="Critical Alerts"
                        value={criticalPatients}
                        icon={AlertTriangle}
                        trend={0}
                        color="bg-rose-600"
                        onClick={() => setAlerts((prev: any) => [...prev])}
                      />
                    </div>

                    {userRole === 'doctor' ? (
                      <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden mb-8">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Activity className="w-32 h-32 text-indigo-500" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                              <h3 className="text-xl font-bold">Hospital Control Center</h3>
                            </div>
                            <p className="text-slate-200 text-sm max-w-md">Real-time simulation and hospital management. Trigger events to test load balancing.</p>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={async () => {
                                const patient = {
                                  id: `p${Date.now()}`,
                                  name: 'Emergency Admission',
                                  age: Math.floor(Math.random() * 40) + 20,
                                  condition: 'Critical Trauma',
                                  severity: 'critical',
                                  admissionTime: new Date().toISOString()
                                };
                                await fetch('/api/simulate/admission', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ patient })
                                });
                              }}
                              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/40"
                            >
                              <Plus className="w-4 h-4" /> Admit Emergency
                            </button>
                            <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-all">
                              Facility Mode
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-cyan-600 to-cyan-500 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden mb-8">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Sparkles className="w-32 h-32 text-white" />
                        </div>
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold mb-2">Welcome to Your Care Portal</h3>
                          <p className="text-cyan-50 text-sm max-w-md">View your health metrics, find specialists, and manage your appointments with PulsePoint AI assistant.</p>
                          <div className="mt-6 flex gap-3">
                            <button 
                              onClick={() => setIsAIModalOpen(true)}
                              className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 hover:bg-black transition-all active:scale-95"
                            >
                              <Sparkles className="w-4 h-4 text-amber-400" /> Start AI Health Diagnosis
                            </button>
                            <button className="px-4 py-2 bg-cyan-700/30 text-white rounded-xl font-bold text-xs border border-white/20 hover:bg-cyan-700/50 transition-colors">Talk to Support</button>
                          </div>
                        </div>
                      </div>
                    )}


                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="font-bold text-slate-900 dark:text-white">Emergency Load Prediction</h3>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-cyan-500 rounded-full" /> Predicted</span>
                              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full" /> Actual</span>
                            </div>
                            <button className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                              <TrendingUp className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            </button>
                          </div>
                        </div>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#0891b2" stopOpacity={0.1} />
                                  <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: darkMode ? '#64748b' : '#94a3b8' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: darkMode ? '#64748b' : '#94a3b8' }} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                                  borderRadius: '12px',
                                  border: darkMode ? '1px solid #334155' : 'none',
                                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                  color: darkMode ? '#ffffff' : '#000000'
                                }}
                                itemStyle={{ color: darkMode ? '#ffffff' : '#000000' }}
                              />
                              <Area type="monotone" dataKey="load" stroke="#0891b2" strokeWidth={3} fillOpacity={1} fill="url(#colorLoad)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-6">Occupancy by Ward</h3>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {pieData.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-3 mt-4">
                          {pieData.map((item: { name: any; value: any; }, i: string | number) => (
                            <div
                              key={item.name}
                              onClick={() => setActiveTab('map')}
                              className="flex items-center justify-between text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 rounded-xl transition-all group"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                <span className="text-slate-600 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{item.name}</span>
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white uppercase text-[10px]">{item.value} Patients</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 dark:text-white">Recent Patient Flow</h3>
                        <button
                          onClick={() => setActiveTab('patients')}
                          className="text-cyan-600 text-sm font-medium flex items-center gap-1 hover:underline"
                        >
                          View All <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                              <th className="px-6 py-4">Patient</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Condition</th>
                              <th className="px-6 py-4">Admission</th>
                              <th className="px-6 py-4">Location</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {state.patients.slice(-5).reverse().map((patient: { id: any; name: string; severity: string; condition: any; admissionTime: string | number | Date; bedId: any; }) => (
                              <tr
                                key={patient.id}
                                onClick={() => setSelectedPatient(patient)}
                                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full flex items-center justify-center text-xs font-bold group-hover:scale-110 transition-transform">
                                      {patient.name.split(' ').map((n: string) => n[0]).join('')}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 transition-colors">{patient.name}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">ID: {patient.id}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={cn(
                                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                    patient.severity === 'critical' && "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
                                    patient.severity === 'high' && "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
                                    patient.severity === 'medium' && "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400",
                                    patient.severity === 'low' && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                  )}>
                                    {patient.severity}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{patient.condition}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(patient.admissionTime), 'HH:mm')}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{patient.bedId || 'Triage'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* AI Predictive Intelligence Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <Brain className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white line-height-1">AI Predictive Intelligence</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Real-time hospital optimization insights from Gemini AI</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <AIInsightCard
                          title="Occupancy Forecast"
                          description="ICU Ward B predicted to reach 98% capacity within 6 hours. Early discharge possible for 2 patients."
                          badge="Critical"
                          badgeColor="bg-rose-600"
                          icon={TrendingUp}
                          progress={94}
                        />
                        <AIInsightCard
                          title="Resource Optimization"
                          description="X-Ray Unit-04 showing abnormal power cycling. Predictive maintenance requested for tomorrow."
                          badge="Equipment"
                          badgeColor="bg-amber-600"
                          icon={Zap}
                          progress={78}
                        />
                        <AIInsightCard
                          title="Patient Risk Flow"
                          description="Detected 12% increase in respiratory-related admissions. Alerts sent to Triage teams."
                          badge="Automation"
                          badgeColor="bg-indigo-600"
                          icon={Activity}
                          progress={89}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'patients' && (
                  <motion.div
                    key="patients"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                          {userRole === 'doctor' ? 'Clinical Patient Records' : 'My Health Records'}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400">
                          {userRole === 'doctor' ? 'Monitor admissions, transfers, and discharge readiness' : 'Your medical history and current active treatments'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => alert('Generating system report...')}
                          className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                        >
                          Export Report
                        </button>
                        <button
                          onClick={async () => {
                            const name = prompt("Patient Name:");
                            if (!name) return;
                            const age = Number(prompt("Patient Age:"));
                            const condition = prompt("Condition:");
                            const severity = prompt("Severity (low/medium/high/critical):") || 'medium';
                            const doctorId = prompt("Doctor ID (e.g., d1, d2):") || 'd1';

                            const apptData = {
                              id: `a-${Date.now()}`,
                              patientName: name,
                              patientAge: age,
                              condition,
                              severity,
                              doctorId,
                              status: 'pending',
                              requestTime: new Date().toISOString()
                            };

                            await fetch('/api/appointments', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(apptData)
                            });
                          }}
                          className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 rounded-xl text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
                        >
                          Schedule Appointment
                        </button>
                        <button
                          onClick={() => setActiveTab('map')}
                          className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-bold hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-900/20"
                        >
                          New Admission
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {['critical', 'high', 'medium'].map((severity) => (
                        <div key={severity} className="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                severity === 'critical' ? "bg-rose-500" : severity === 'high' ? "bg-amber-500" : "bg-sky-500"
                              )} />
                              {severity} Priority
                            </h3>
                            <span className="text-xs font-bold text-slate-400">
                              {state.patients.filter((p: { severity: string; }) => p.severity === severity).length}
                            </span>
                          </div>
                          <div className="space-y-3">
                            {state.patients
                              .filter((p: { severity: string; }) => p.severity === severity)
                              .filter((p: { name: string; condition: string; }) =>
                                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                p.condition.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                              .map((patient: { id: any; name: any; bedId: any; condition: any; admissionTime: string | number | Date; }) => (
                                <motion.div
                                  key={patient.id}
                                  layoutId={patient.id}
                                  onClick={() => setSelectedPatient(patient)}
                                  whileHover={{ scale: 1.02 }}
                                  className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer group"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors uppercase text-[11px] tracking-tight">{patient.name}</h4>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{patient.bedId || 'Triage'}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">{patient.condition}</p>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                      <Clock className="w-3 h-3" />
                                      {format(new Date(patient.admissionTime), 'HH:mm')}
                                    </div>
                                    <div className="flex -space-x-2">
                                      {[1, 2].map(i => (
                                        <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                          <img src={`https://picsum.photos/seed/${patient.id}-${i}/20/20`} alt="Staff" referrerPolicy="no-referrer" />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'map' && (
                  <motion.div
                    key="map"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Hospital Digital Twin Map</h2>
                        <p className="text-slate-500 dark:text-slate-400">Real-time bed occupancy and ward status</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                          <div className="flex items-center gap-1.5 dark:text-slate-300"><div className="w-3 h-3 bg-emerald-500 rounded-sm" /> Available</div>
                          <div className="flex items-center gap-1.5 dark:text-slate-300"><div className="w-3 h-3 bg-rose-500 rounded-sm" /> Occupied</div>
                          <div className="flex items-center gap-1.5 dark:text-slate-300"><div className="w-3 h-3 bg-amber-500 rounded-sm" /> Cleaning</div>
                          <div className="flex items-center gap-1.5 dark:text-slate-300"><div className="w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-sm" /> Maintenance</div>
                        </div>
                      </div>
                    </div>

                    <WardMap
                      wards={state.wards}
                      beds={state.beds}
                      onBedClick={(bed) => setSelectedBed(bed)}
                      patients={state.patients}
                      equipment={state.equipment}
                    />
                  </motion.div>
                )}

                {activeTab === 'doctors' && (
                  <motion.div
                    key="doctors"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Medical Staff Directory</h2>
                        <p className="text-slate-500 dark:text-slate-400">Manage hospital personnel and shift schedules</p>
                      </div>
                      {userRole !== 'patient' && (
                        <button
                          onClick={() => {
                            setEditingDoctor(null);
                            setIsDoctorFormOpen(true);
                          }}
                          className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-bold hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-100 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Add Staff
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {state.doctors
                        .filter((d: { name: string; specialty: string; }) =>
                          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.specialty.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((doctor: Doctor) => (
                          <motion.div
                            key={doctor.id}
                            whileHover={{ scale: 1.02, translateY: -5 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group relative"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4" onClick={() => setSelectedDoctor(doctor)}>
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden group-hover:ring-2 group-hover:ring-cyan-500 transition-all">
                                  <img src={`https://picsum.photos/seed/${doctor.id}/100/100`} alt={doctor.name} referrerPolicy="no-referrer" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 transition-colors">{doctor.name}</h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{doctor.specialty}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className={cn(
                                  "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                                  doctor.status === 'on-duty' && "bg-emerald-100 text-emerald-600",
                                  doctor.status === 'in-surgery' && "bg-rose-100 text-rose-600",
                                  doctor.status === 'on-break' && "bg-amber-100 text-amber-600",
                                  doctor.status === 'off-duty' && "bg-slate-100 text-slate-400"
                                )}>
                                  {doctor.status}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-3" onClick={() => setSelectedDoctor(doctor)}>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 dark:text-slate-400">Current Shift</span>
                                <span className="text-slate-900 dark:text-white font-medium">08:00 - 16:00</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 dark:text-slate-400">Assigned Patients</span>
                                <span className="text-slate-900 dark:text-white font-medium">4</span>
                              </div>
                            </div>
                            {userRole !== 'patient' && (
                              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700 flex gap-2">
                                <button
                                  onClick={(e: { stopPropagation: () => void; }) => {
                                    e.stopPropagation();
                                    setUserRole('doctor');
                                    setCurrentDoctorId(doctor.id);
                                  }}
                                  className="flex-1 py-2 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-lg text-xs font-bold hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors"
                                >
                                  Schedule
                                </button>
                                <button
                                  onClick={(e: { stopPropagation: () => void; }) => {
                                    e.stopPropagation();
                                    setEditingDoctor(doctor);
                                    setIsDoctorFormOpen(true);
                                  }}
                                  className="flex-1 py-2 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={async (e: { stopPropagation: () => void; }) => {
                                    e.stopPropagation();
                                    if (confirm(`Are you sure you want to remove ${doctor.name}?`)) {
                                      await fetch(`/api/doctors/${doctor.id}`, { method: 'DELETE' });
                                    }
                                  }}
                                  className="flex-1 py-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                            {userRole === 'patient' && (
                              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700">
                                <button
                                  onClick={(e: { stopPropagation: () => void; }) => {
                                    e.stopPropagation();
                                    handleConnectDoctor(doctor);
                                  }}
                                  className="w-full py-2 bg-cyan-600 text-white rounded-lg text-xs font-bold hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-900/20 active:scale-95 flex items-center justify-center gap-2"
                                >
                                  <MessageSquare className="w-4 h-4" /> Connect Doctor
                                </button>
                              </div>
                            )}
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'messages' && (
                  <motion.div
                    key="messages"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-[calc(100vh-12rem)] flex gap-6"
                  >
                    {/* Conversations List */}
                    <div className="w-80 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-white">Active Chats</h3>
                        <p className="text-[10px] text-slate-500">Only accepted appointments have chat enabled</p>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {state.appointments
                          .filter((a: { status: string; }) => a.status === 'accepted')
                          .filter((a: { doctorId: any; patientName: any; }) => userRole === 'doctor' ? a.doctorId === currentDoctorId : a.patientName === currentUser?.name)
                          .map((appt: { id: any; patientName: any; doctorId: any; condition: any; }) => (
                            <button
                              key={appt.id}
                              onClick={() => setSelectedChatId(appt.id)}
                              className={cn(
                                "w-full p-3 rounded-2xl text-left border transition-all",
                                selectedChatId === appt.id
                                  ? "bg-cyan-50 border-cyan-100 dark:bg-cyan-900/20 dark:border-cyan-800"
                                  : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
                                  {(userRole === 'doctor' ? appt.patientName : (state.doctors.find((d: { id: any; }) => d.id === appt.doctorId)?.name || 'Dr')).split(' ').map((n: any[]) => n[0]).join('')}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {userRole === 'doctor' ? appt.patientName : state.doctors.find((d: { id: any; }) => d.id === appt.doctorId)?.name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 truncate">{appt.condition}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        {state.appointments.filter((a: { status: string; doctorId: any; patientName: any; }) => a.status === 'accepted' && (userRole === 'doctor' ? a.doctorId === currentDoctorId : a.patientName === currentUser?.name)).length === 0 && (
                          <div className="text-center py-8">
                            <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-xs text-slate-400">No active conversations found.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chat Window */}
                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
                      {selectedChatId ? (
                        <>
                          {/* Chat Header */}
                          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full flex items-center justify-center text-[10px] font-bold">
                                {state.appointments.find((a: { id: any; }) => a.id === selectedChatId)?.patientName.split(' ').map((n: any[]) => n[0]).join('')}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                  {userRole === 'doctor'
                                    ? state.appointments.find((a: { id: any; }) => a.id === selectedChatId)?.patientName
                                    : state.doctors.find((d: { id: any; }) => d.id === state.appointments.find((a: { id: any; }) => a.id === selectedChatId)?.doctorId)?.name
                                  }
                                </h4>
                                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online</p>
                              </div>
                            </div>
                          </div>

                          {/* Chat Messages */}
                          <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col-reverse">
                            <div className="space-y-4">
                              {(state.messages || [])
                                .filter((m: { appointmentId: any; }) => m.appointmentId === selectedChatId)
                                .sort((a: { timestamp: string | number | Date; }, b: { timestamp: string | number | Date; }) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                                .map((msg: { id: any; senderId: any; text: any; timestamp: string | number | Date; }, idx: any) => (
                                  <div
                                    key={msg.id}
                                    className={cn(
                                      "flex flex-col max-w-[80%]",
                                      msg.senderId === currentUser?.id ? "ml-auto items-end" : "items-start"
                                    )}
                                  >
                                    <div className={cn(
                                      "p-3 rounded-2xl text-sm shadow-sm",
                                      msg.senderId === currentUser?.id
                                        ? "bg-cyan-600 text-white rounded-tr-none"
                                        : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-tl-none"
                                    )}>
                                      {msg.text}
                                    </div>
                                    <span className="text-[9px] text-slate-400 mt-1 uppercase font-bold">
                                      {format(new Date(msg.timestamp), 'HH:mm')}
                                    </span>
                                  </div>
                                ))}
                              {(state.messages || []).filter((m: { appointmentId: any; }) => m.appointmentId === selectedChatId).length === 0 && (
                                <div className="text-center py-20">
                                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="w-8 h-8 text-cyan-500" />
                                  </div>
                                  <h3 className="font-bold text-slate-900 dark:text-white">Encrypted Consultation</h3>
                                  <p className="text-xs text-slate-500 max-w-[200px] mx-auto mt-2 italic">Messages are secure and available for medical review.</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Chat Input */}
                          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                            <form
                              onSubmit={async (e: { preventDefault: () => void; currentTarget: any; }) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                const text = new FormData(form).get('message') as string;
                                if (!text.trim()) return;

                                const msgData = {
                                  id: `m-${Date.now()}`,
                                  appointmentId: selectedChatId,
                                  senderRole: userRole,
                                  senderId: currentUser?.id,
                                  senderName: currentUser?.name,
                                  text,
                                  timestamp: new Date().toISOString()
                                };

                                try {
                                  await fetch('/api/messages', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(msgData)
                                  });
                                  form.reset();
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="relative flex items-center gap-2"
                            >
                              <input
                                name="message"
                                type="text"
                                placeholder="Type your clinical update..."
                                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all dark:text-white shadow-inner"
                              />
                              <button
                                type="submit"
                                className="h-11 w-11 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-cyan-900/20 active:scale-95 shrink-0"
                              >
                                <Plus className="w-5 h-5 rotate-45 -rotate-[135deg]" />
                              </button>
                            </form>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center p-8 text-center">
                          <div>
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                              <MessageSquare className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Secure Consultations</h3>
                            <p className="text-slate-500 max-w-[280px] mx-auto mt-2 text-sm">Select an active appointment from the list to start messaging your healthcare provider.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'ai-reports' && (
                  <motion.div
                    key="ai-reports"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-8"
                  >
                    {/* Cinematic Header */}
                    <div className="relative overflow-hidden p-10 bg-slate-900 dark:bg-black rounded-[3rem] text-white shadow-2xl border border-slate-800">
                       <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] -mr-32 -mt-32" />
                       <div className="absolute bottom-0 left-0 w-96 h-96 bg-hospital-green-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />
                       <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                          <div>
                             <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                               <Zap className="w-3 h-3" /> AI Engine v2.0 Active
                             </div>
                             <h2 className="text-5xl font-black tracking-tight mb-4 leading-tight">
                                Clinical AI <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-hospital-green-400">Insights Vault</span>
                             </h2>
                             <p className="text-slate-400 max-w-md text-sm leading-relaxed">
                               Experience high-precision diagnostics and personalized treatment protocols backed by PulsePoint's advanced generative intelligence.
                             </p>
                          </div>
                          <div className="flex gap-4">
                             <div className="px-8 py-6 bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl text-center">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Analysis</p>
                                <p className="text-3xl font-black text-white">{aiReports.length}</p>
                             </div>
                             <div className="px-8 py-6 bg-cyan-500/10 backdrop-blur-xl border border-cyan-500/20 rounded-3xl text-center">
                                <p className="text-[10px] font-bold text-cyan-500/70 uppercase tracking-widest mb-1">Health Score</p>
                                <p className="text-3xl font-black text-cyan-400">98%</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    {aiReports.length > 0 ? (
                      <div className="grid grid-cols-1 gap-8 pb-32">
                        {aiReports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((report) => (
                          <motion.div
                            key={report.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden"
                          >
                            {/* Card Glow Effect */}
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 via-hospital-green-500 to-indigo-500" />
                            
                            <div className="flex flex-col lg:flex-row">
                               {/* Left: Detailed Analysis */}
                               <div className="flex-1 p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-slate-50 dark:border-slate-800">
                                  <div className="flex items-center justify-between mb-8">
                                     <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-900 dark:bg-black rounded-2xl flex items-center justify-center text-cyan-400 shadow-xl">
                                           <Brain className="w-8 h-8" />
                                        </div>
                                        <div>
                                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">SECURE CASE REPORT</p>
                                           <h3 className="text-xl font-black text-slate-900 dark:text-white">Analysis #{report.id.slice(-6)}</h3>
                                        </div>
                                     </div>
                                     <div className="text-right">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">{format(new Date(report.timestamp), 'MMMM do, yyyy')}</p>
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{format(new Date(report.timestamp), 'HH:mm')}</p>
                                     </div>
                                  </div>

                                  <div className="space-y-8">
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                              <Activity className="w-3 h-3 text-hospital-green-500" />
                                              Patient Symptoms
                                           </h4>
                                           <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{report.symptoms}"</p>
                                        </div>
                                        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                              <Clock className="w-3 h-3 text-cyan-500" />
                                              Medical History
                                           </h4>
                                           <p className="text-sm text-slate-700 dark:text-slate-300">{report.history || "No previous records provided."}</p>
                                        </div>
                                     </div>

                                     <div className="p-8 bg-slate-900 dark:bg-black rounded-[2rem] text-slate-300 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                           <Sparkles className="w-20 h-20" />
                                        </div>
                                        <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                           <Zap className="w-4 h-4 text-amber-400" />
                                           Diagnostic Intelligence Output
                                        </h4>
                                        <div className="text-sm leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-800">
                                           {report.diagnosis}
                                        </div>
                                     </div>
                                  </div>
                               </div>

                               {/* Right: Product Showcase */}
                               <div className="w-full lg:w-[400px] p-8 lg:p-12 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-8">Personalized Protocols</h4>
                                  
                                  <div className="space-y-6">
                                     {/* Product 1 */}
                                     <motion.div whileHover={{ x: 5 }} className="group/item flex items-center gap-6 p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <div className="w-24 h-24 bg-slate-100 dark:bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center p-2">
                                           <img src="file:///C:/Users/PRENEEL/.gemini/antigravity/brain/14fccec1-ba1b-4c27-a3d6-feb148a1b67d/medical_skin_cream_1777617301129.png" alt="Medical Cream" className="w-full h-full object-contain" />
                                        </div>
                                        <div>
                                           <p className="text-[10px] font-black text-hospital-green-600 uppercase tracking-widest mb-1">Dermatology</p>
                                           <h5 className="font-bold text-slate-900 dark:text-white mb-1">Clinical Repair Cream</h5>
                                           <p className="text-[10px] text-slate-500 leading-tight">Advanced barrier restoration for treated areas.</p>
                                        </div>
                                     </motion.div>

                                     {/* Product 2 */}
                                     <motion.div whileHover={{ x: 5 }} className="group/item flex items-center gap-6 p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <div className="w-24 h-24 bg-slate-100 dark:bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center p-2">
                                           <img src="file:///C:/Users/PRENEEL/.gemini/antigravity/brain/14fccec1-ba1b-4c27-a3d6-feb148a1b67d/hydration_supplement_1777617315462.png" alt="Supplement" className="w-full h-full object-contain" />
                                        </div>
                                        <div>
                                           <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1">Hydration</p>
                                           <h5 className="font-bold text-slate-900 dark:text-white mb-1">Cellular Water Matrix</h5>
                                           <p className="text-[10px] text-slate-500 leading-tight">Optimized electrolyte blend for rapid recovery.</p>
                                        </div>
                                     </motion.div>

                                     <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                                        <button 
                                          onClick={() => alert('Detailed instructions: Apply cream twice daily. Mix supplement with 500ml water.')}
                                          className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl active:scale-95"
                                        >
                                          View Usage Instructions
                                        </button>
                                        <div className="mt-4 flex gap-2">
                                           <button className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors">Export PDF</button>
                                           <button onClick={() => setAiReports(prev => prev.filter(r => r.id !== report.id))} className="px-4 py-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors">
                                              <Plus className="w-5 h-5 rotate-45" />
                                           </button>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-[4rem] border-4 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-full shadow-2xl flex items-center justify-center mb-8 relative">
                           <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping" />
                           <Brain className="w-16 h-16 text-cyan-500 relative z-10" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Vault is Empty</h3>
                        <p className="text-slate-500 max-w-sm text-center mt-4 text-sm leading-relaxed italic">
                           "True diagnostic power lies in historical data. Generate your first report to begin building your clinical intelligence profile."
                        </p>
                        <button 
                          onClick={() => setIsAIModalOpen(true)}
                          className="mt-8 px-10 py-4 bg-cyan-600 text-white rounded-2xl font-bold hover:bg-cyan-700 transition-all shadow-xl shadow-cyan-900/20"
                        >
                          Initialize First Analysis
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Notifications Overlay */}
      <div className="fixed bottom-8 right-8 z-50 pointer-events-none">
        <div className="flex flex-col items-end pointer-events-auto">
          <AnimatePresence>
            {pushNotificationsEnabled && alerts.map((alert: { id: any; }) => (
              <AlertToast
                key={alert.id}
                alert={alert}
                onClose={() => setAlerts((prev: any[]) => prev.filter((a: { id: any; }) => a.id !== alert.id))}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Bed Detail Modal */}
      <AnimatePresence>
        {
          selectedBed && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedBed(null)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-xl",
                      selectedBed.status === 'occupied' ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                      <BedIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Bed {selectedBed.id}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{state.wards.find((w: { id: any; }) => w.id === selectedBed.wardId)?.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedBed(null)} className="p-2 hover:bg-slate-200 rounded-full">
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  {selectedBed.status === 'occupied' ? (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center text-xl font-bold text-cyan-600">
                          {state.patients.find((p: { id: any; }) => p.id === selectedBed.patientId)?.name.split(' ').map((n: any[]) => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-slate-900">
                            {state.patients.find((p: { id: any; }) => p.id === selectedBed.patientId)?.name}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {state.patients.find((p: { id: any; }) => p.id === selectedBed.patientId)?.condition}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Severity</p>
                          <p className="text-sm font-bold text-rose-600">
                            {state.patients.find((p: { id: any; }) => p.id === selectedBed.patientId)?.severity.toUpperCase()}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Admitted</p>
                          <p className="text-sm font-bold text-slate-900">
                            {format(new Date(state.patients.find((p: { id: any; }) => p.id === selectedBed.patientId)?.admissionTime || 0), 'MMM d, HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-100">
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/simulate/discharge', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ bedId: selectedBed.id })
                              });
                              if (res.ok) {
                                setSelectedBed(null);
                              }
                            } catch (err) {
                              console.error("Discharge failed", err);
                            }
                          }}
                          className="w-full py-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors"
                        >
                          Discharge Patient
                        </button>
                      </div>
                    </>
                  ) : selectedBed.status === 'available' ? (
                    <form
                      onSubmit={async (e: { preventDefault: () => void; currentTarget: HTMLFormElement; }) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const patientData = {
                          id: `p-${Date.now()}`,
                          name: formData.get('name'),
                          age: Number(formData.get('age')),
                          condition: formData.get('condition'),
                          severity: formData.get('severity'),
                          admissionTime: new Date().toISOString(),
                          bedId: selectedBed.id
                        };

                        try {
                          const res = await fetch('/api/simulate/admission', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ patient: patientData, bedId: selectedBed.id })
                          });
                          if (res.ok) {
                            setSelectedBed(null);
                          }
                        } catch (err) {
                          console.error("Booking failed", err);
                        }
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patient Name</label>
                        <input name="name" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Full Name" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Age</label>
                          <input name="age" type="number" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Years" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Severity</label>
                          <select name="severity" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Condition</label>
                        <input name="condition" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Diagnosis / Reason" />
                      </div>
                      <button type="submit" className="w-full py-3 bg-cyan-600 text-white rounded-xl font-bold text-sm hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-200">
                        Confirm Admission
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-500 mb-6">
                        This bed is currently <span className="font-bold text-slate-900 uppercase">{selectedBed.status}</span>.
                      </p>
                      {(selectedBed.status === 'cleaning' || selectedBed.status === 'maintenance') && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/simulate/complete-task', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ bedId: selectedBed.id })
                              });
                              if (res.ok) {
                                setSelectedBed(null);
                              }
                            } catch (err) {
                              console.error("Task completion failed", err);
                            }
                          }}
                          className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                        >
                          Mark as Available
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedBed(null)}
                        className="w-full mt-3 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 flex gap-3">
                    <button
                      onClick={() => alert(`Scheduling maintenance for Bed ${selectedBed.id}...`)}
                      className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                    >
                      Maintenance
                    </button>
                    <button
                      onClick={() => alert(`Fetching bed history for ${selectedBed.id}...`)}
                      className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                    >
                      History
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >

      {/* Doctor Detail Modal */}
      <AnimatePresence>
        {
          selectedDoctor && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedDoctor(null)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{selectedDoctor.name}</h3>
                      <p className="text-xs text-slate-500">{selectedDoctor.specialty}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedDoctor(null)} className="p-2 hover:bg-slate-200 rounded-full">
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden">
                      <img src={`https://picsum.photos/seed/${selectedDoctor.id}/200/200`} alt={selectedDoctor.name} referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Status</span>
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                          selectedDoctor.status === 'on-duty' && "bg-emerald-100 text-emerald-600",
                          selectedDoctor.status === 'in-surgery' && "bg-rose-100 text-rose-600",
                          selectedDoctor.status === 'on-break' && "bg-amber-100 text-amber-600",
                          selectedDoctor.status === 'off-duty' && "bg-slate-100 text-slate-400"
                        )}>
                          {selectedDoctor.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">Senior Consultant with over 12 years of experience in {selectedDoctor.specialty}.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Schedule</h5>
                    <div className="space-y-2">
                      {[
                        { time: '09:00', event: 'Patient Rounds - ICU' },
                        { time: '11:30', event: 'Surgery - Room 4' },
                        { time: '14:00', event: 'Consultations' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <span className="text-xs font-bold text-cyan-600">{item.time}</span>
                          <span className="text-sm text-slate-700">{item.event}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex gap-3">
                    <button
                      onClick={() => alert(`Contacting ${selectedDoctor.name}...\nOpening secure channel...`)}
                      className="flex-1 py-3 bg-cyan-600 text-white rounded-xl font-bold text-sm hover:bg-cyan-700 transition-colors"
                    >
                      Contact Doctor
                    </button>
                    <button
                      onClick={() => alert(`Viewing full career profile for ${selectedDoctor.name}...`)}
                      className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                    >
                      Full Profile
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >

      {/* Patient Detail Modal */}
      <AnimatePresence>
        {
          selectedPatient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPatient(null)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10"
              >
                <div className="p-6 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{selectedPatient.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Age: {selectedPatient.age} • Patient ID: {selectedPatient.id}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Condition</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedPatient.condition}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Severity</p>
                      <p className={cn(
                        "text-sm font-bold",
                        selectedPatient.severity === 'critical' && "text-rose-600",
                        selectedPatient.severity === 'high' && "text-amber-600",
                        selectedPatient.severity === 'medium' && "text-sky-600",
                        selectedPatient.severity === 'low' && "text-emerald-600"
                      )}>
                        {selectedPatient.severity.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Digital Twin Vitals Monitor</h5>
                    <PatientVitalsMonitor active={!!selectedPatient} />
                  </div>

                  <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl border border-cyan-100 dark:border-cyan-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-xs font-bold text-cyan-900 dark:text-cyan-100">Admission Details</span>
                    </div>
                    <p className="text-xs text-cyan-700 dark:text-cyan-300 leading-relaxed">
                      Admitted on {format(new Date(selectedPatient.admissionTime), 'MMMM do, yyyy')} at {format(new Date(selectedPatient.admissionTime), 'HH:mm')}.
                      Currently located in {selectedPatient.bedId || 'Triage'}.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                    <button
                      onClick={() => alert(`Loading electronic health records for ${selectedPatient.name}...`)}
                      className="flex-1 py-3 bg-cyan-600 text-white rounded-xl font-bold text-sm hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-900/20"
                    >
                      View Full Chart
                    </button>
                    <button
                      onClick={() => alert(`Initiating transfer protocol for ${selectedPatient.name}...`)}
                      className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Transfer
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >
      {/* Doctor Form Modal (Add/Edit) */}
      <AnimatePresence>
        {
          isDoctorFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDoctorFormOpen(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center">
                      <Plus className={cn("text-white w-6 h-6 transition-transform", editingDoctor && "rotate-45")} />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{editingDoctor ? 'Edit Staff Member' : 'Add New Staff'}</h3>
                  </div>
                  <button onClick={() => setIsDoctorFormOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400">
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>
                <form
                  onSubmit={async (e: { preventDefault: () => void; currentTarget: HTMLFormElement; }) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const doctorData = {
                      id: editingDoctor?.id || `d-${Date.now()}`,
                      name: formData.get('name'),
                      specialty: formData.get('specialty'),
                      status: formData.get('status')
                    };

                    const method = editingDoctor ? 'PUT' : 'POST';
                    const url = editingDoctor ? `/api/doctors/${editingDoctor.id}` : '/api/doctors';

                    try {
                      const res = await fetch(url, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(doctorData)
                      });
                      if (res.ok) {
                        setIsDoctorFormOpen(false);
                      }
                    } catch (err) {
                      console.error("Doctor save failed", err);
                    }
                  }}
                  className="p-6 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Full Name</label>
                    <input
                      name="name"
                      defaultValue={editingDoctor?.name}
                      required
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                      placeholder="e.g. Dr. Robert Fox"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Specialty</label>
                    <input
                      name="specialty"
                      defaultValue={editingDoctor?.specialty}
                      required
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                      placeholder="e.g. Cardiology"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Status</label>
                    <select
                      name="status"
                      defaultValue={editingDoctor?.status || 'on-duty'}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                    >
                      <option value="on-duty">On Duty</option>
                      <option value="in-surgery">In Surgery</option>
                      <option value="on-break">On Break</option>
                      <option value="off-duty">Off Duty</option>
                    </select>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsDoctorFormOpen(false)}
                      className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-cyan-600 text-white rounded-xl font-bold text-sm hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-900/20"
                    >
                      {editingDoctor ? 'Save Changes' : 'Add Member'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >

      {/* Settings Modal */}
      <AnimatePresence>
        {
          isSettingsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSettingsOpen(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                      <Settings className="text-white w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">System Settings</h3>
                  </div>
                  <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400">
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">General</h4>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="text-sm font-bold text-slate-900">Dark Mode</p>
                        <p className="text-[10px] text-slate-500">Enable dark theme for the interface</p>
                      </div>
                      <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-colors duration-300",
                          darkMode ? "bg-cyan-600" : "bg-slate-200"
                        )}
                      >
                        <motion.div
                          animate={{ x: darkMode ? 24 : 0 }}
                          className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="text-sm font-bold text-slate-900">Push Notifications</p>
                        <p className="text-[10px] text-slate-500">Receive alerts for critical events</p>
                      </div>
                      <button
                        onClick={() => setPushNotificationsEnabled(!pushNotificationsEnabled)}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-colors duration-300",
                          pushNotificationsEnabled ? "bg-cyan-600" : "bg-slate-200"
                        )}
                      >
                        <motion.div
                          animate={{ x: pushNotificationsEnabled ? 24 : 0 }}
                          className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">System</h4>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="text-sm font-bold text-slate-900">Language</p>
                        <p className="text-[10px] text-slate-500">English (United States)</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          )}
      </AnimatePresence>


        <AIDiagnosticSidebar 
          isOpen={isAIModalOpen} 
          onClose={() => setIsAIModalOpen(false)} 
          onDiagnosisGenerated={(report) => setAiReports(prev => [report, ...prev])}
        />
        <AnimatePresence>
            {alerts.map((alert: { id: any; }) => (
              <div key={alert.id} className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
                <AlertToast alert={alert} onClose={() => setAlerts((prev: any[]) => prev.filter((a: { id: any; }) => a.id !== alert.id))} />
              </div>
            ))}
        </AnimatePresence>
      </div>
    );
}