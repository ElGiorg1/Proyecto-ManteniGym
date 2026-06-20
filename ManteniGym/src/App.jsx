import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';
import Login from './Login';

const currentUserRole = 'admin'; 
const currentUserId = 1;

// --- CONFIGURACIÓN DE LA CUADRÍCULA ---
const GRID_SIZE = 20;
const MAP_WIDTH = 1500;
const MAP_HEIGHT = 800;
const MACHINE_W = 120;
const MACHINE_H = 80;

// ==========================================
// 1. EL COMPONENTE PRINCIPAL (EL DIRECTOR)
// ==========================================
export default function App() {
  const [session, setSession] = useState(null);
  const [gym, setGym] = useState(null);
  const [loadingGym, setLoadingGym] = useState(true);

  // Estados para el Formulario de Configuración Inicial Dinámico
  const [step, setStep] = useState(1); // 1 = Login/Verificación, 2 = Configuración inicial del Gym
  const [gymName, setGymName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [workersCount, setWorkersCount] = useState('');
  const [loadingSetup, setLoadingSetup] = useState(false);

  // --- NUEVO: Estado local para forzar las animaciones de Tailwind nativas ---
  const [animateCard, setAnimateCard] = useState(false);

  useEffect(() => {
    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkGymOwnership(session.user.id);
      else setLoadingGym(false);
    });

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkGymOwnership(session.user.id);
      } else {
        setGym(null);
        setStep(1); // Resetear al paso 1 si sale
        setLoadingGym(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Controlar el disparo de la animación nativa cada vez que cambia el paso (step)
  useEffect(() => {
    setAnimateCard(false);
    const timer = setTimeout(() => setAnimateCard(true), 50);
    return () => clearTimeout(timer);
  }, [step]);

  async function checkGymOwnership(userId) {
    try {
      const { data, error } = await supabase
        .from('gimnasios')
        .select('*')
        .eq('admin_id', userId);
      
      if (error) {
        console.error("Error de Supabase:", error);
        setGym(null);
        setStep(1);
      } else if (data && data.length > 0) {
        setGym(data[0]); 
      } else {
        setGym(null);
        // Si tiene sesión iniciada pero no tiene Gym, pasamos suavemente al paso 2
        setStep(2);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGym(false);
    }
  }

  const handleCreateGym = async (e) => {
    e.preventDefault();
    if (!gymName || !adminName || !workersCount || !session) return;

    setLoadingSetup(true);
    
    const { data, error } = await supabase
      .from('gimnasios')
      .insert([
        { 
          nombre: gymName, 
          admin_id: session.user.id,
          nombre_admin: adminName, 
          cantidad_trabajadores: parseInt(workersCount) 
        }
      ])
      .select()
      .single();

    setLoadingSetup(false);

    if (error) {
      alert("Error al registrar: " + error.message);
    } else {
      alert("¡Establecimiento registrado con éxito! Generando tu mapa...");
      setGym(data); 
    }
  };

  // 1. Estado de carga inicial general del sistema
  if (loadingGym) return <div className="flex h-screen items-center justify-center bg-slate-950 font-bold text-xl text-slate-100">Cargando sistema...</div>;
  
  // 2. Si ya pasó la configuración y tenemos un Gym cargado, mostramos el mapa real
  if (session && gym) return <GymMapActual gym={gym} />;

  // 3. FLUJO INTERACTIVO ADAPTABLE CON ANIMACIONES NATIVAS
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans text-slate-100 overflow-hidden relative">
      
      {/* PANTALLA 1: LOGIN (Animada nativamente con opacidad y escala transicional) */}
      {step === 1 && (
        <div 
          className={`w-full max-w-sm bg-slate-900/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-slate-800/80 transition-all duration-500 ease-out transform ${
            animateCard 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 translate-y-4'
          }`}
        >
          <Login setSession={setSession} />
        </div>
      )}

      {/* PANTALLA 2: CONFIGURACIÓN INICIAL (Animada nativamente) */}
      {step === 2 && (
        <div 
          className={`w-full max-w-md bg-slate-900/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-slate-800/80 transition-all duration-500 ease-out transform ${
            animateCard 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 translate-y-4'
          }`}
        >
          <form onSubmit={handleCreateGym}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 border border-blue-500/20">
                🏢
              </div>
              <h1 className="text-xl font-black text-slate-100 uppercase tracking-tight">
                Configuración Inicial
              </h1>
              <p className="text-slate-400 text-[11px] mt-1">
                Completa los datos de tu establecimiento para activar tu panel de control
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">
                  Nombre del Establecimiento
                </label>
                <input 
                  className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl outline-none text-slate-100 text-sm placeholder-slate-600 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" 
                  type="text" 
                  placeholder="Ej. Muscle Factory Gym" 
                  required={step === 2}
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">
                  Nombre del Administrador / Dueño
                </label>
                <input 
                  className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl outline-none text-slate-100 text-sm placeholder-slate-600 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" 
                  type="text" 
                  placeholder="Ej. Carlos Mendoza" 
                  required={step === 2}
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">
                  Cantidad de Trabajadores (Staff)
                </label>
                <input 
                  className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl outline-none text-slate-100 text-sm placeholder-slate-600 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" 
                  type="number" 
                  min="0"
                  placeholder="Ej. 5" 
                  required={step === 2}
                  value={workersCount}
                  onChange={(e) => setWorkersCount(e.target.value)} 
                />
              </div>
            </div>

            <button 
              disabled={loadingSetup}
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all duration-300 active:scale-[0.98] disabled:opacity-40 text-sm"
            >
              {loadingSetup ? 'Guardando datos...' : '🚀 Inicializar mi Gimnasio'}
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={async () => {
                  setLoadingGym(true);
                  const { error } = await supabase.auth.signOut();
                  if (error) {
                    alert(error.message);
                    setLoadingGym(false);
                  }
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-400 hover:underline transition-colors duration-200"
              >
                🚪 Cancelar y Cerrar Sesión
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

// ==========================================
// 3. EL MAPA INTERACTIVO REAL
// ==========================================
function GymMapActual({ gym }) {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedMachineId, setDraggedMachineId] = useState(null);
  const svgRef = useRef(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newMachineName, setNewMachineName] = useState("");
  const [newMachineAssignedTo, setNewMachineAssignedTo] = useState("");

  useEffect(() => {
    fetchMachines();
  }, [gym]);

  async function fetchMachines() {
    if (!gym || !gym.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('maquinas')
      .select('*')
      .eq('gym_id', gym.id); 
      
    if (error) console.error('Error cargando:', error);
    else setMachines(data);
    setLoading(false);
  }

  const handleAddMachine = async (e) => {
    e.preventDefault();
    if (!newMachineName || !newMachineAssignedTo) return;

    const { error } = await supabase.from('maquinas').insert([
      { 
        nombre: newMachineName, 
        estado: 'al_dia', 
        x: 360, y: 280, 
        assigned_to: parseInt(newMachineAssignedTo),
        gym_id: gym.id 
      }
    ]);

    if (error) {
      alert("Error al guardar en la base de datos: " + error.message);
    } else {
      setShowAddModal(false);
      setNewMachineName("");
      setNewMachineAssignedTo("");
      fetchMachines();
      alert("¡Máquina agregada con éxito!");
    }
  };

  const handleMaintenance = async (type) => {
    if (!selectedMachine) return;
    const { error: histError } = await supabase.from('mantenimientos').insert([
      { maquina_id: selectedMachine.id, tipo: type, usuario_id: currentUserId, notas: note }
    ]);

    if (!histError) {
      await supabase.from('maquinas').update({ estado: 'al_dia' }).eq('id', selectedMachine.id);
      fetchMachines();
      setNote("");
      setSelectedMachine(null);
      alert(`¡${type} registrado!`);
    }
  };

  const handleMouseDown = (e, id) => {
    if (!isEditMode) return;
    setDraggedMachineId(id);
  };

  const handleMouseMove = (e) => {
    if (!isEditMode || !draggedMachineId || !svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorPt = pt.matrixTransform(svg.getScreenCTM().inverse());

    let rawX = cursorPt.x - (MACHINE_W / 2);
    let rawY = cursorPt.y - (MACHINE_H / 2);

    let snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
    let snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

    snappedX = Math.max(0, Math.min(snappedX, MAP_WIDTH - MACHINE_W));
    snappedY = Math.max(0, Math.min(snappedY, MAP_HEIGHT - MACHINE_H));

    setMachines(prev => prev.map(m => 
      m.id === draggedMachineId ? { ...m, x: snappedX, y: snappedY } : m
    ));
  };

  const handleMouseUp = async () => {
    if (!isEditMode || !draggedMachineId) return;
    const movedMachine = machines.find(m => m.id === draggedMachineId);
    setDraggedMachineId(null); 

    await supabase
      .from('maquinas')
      .update({ x: movedMachine.x, y: movedMachine.y })
      .eq('id', movedMachine.id);
  };

  const getStatusColor = (m) => {
    if (isEditMode) return 'fill-blue-100 stroke-blue-500 border-dashed';
    if (m.assigned_to !== currentUserId && currentUserRole !== 'admin') return 'fill-gray-200 stroke-gray-400';
    if (m.estado === 'atrasado') return 'fill-red-400 stroke-red-600 animate-pulse';
    if (m.estado === 'proximo') return 'fill-yellow-400 stroke-yellow-600';
    return 'fill-green-400 stroke-green-600';
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-xl bg-slate-950 text-slate-100">Cargando mapa...</div>;

  return (
    <div className="relative min-h-screen bg-gray-100 p-4 md:p-10 font-sans text-gray-900">
      
      {/* MODAL PARA AGREGAR MÁQUINA */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Nueva Máquina ({gym.nombre})</h2>
            <form onSubmit={handleAddMachine} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del aparato:</label>
                <input type="text" required className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={newMachineName} onChange={(e) => setNewMachineName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ID del Encargado (Staff):</label>
                <input type="number" required className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={newMachineAssignedTo} onChange={(e) => setNewMachineAssignedTo(e.target.value)} />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-gray-200 font-bold rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-[95%] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* MAPA */}
        <div className="lg:col-span-3 bg-white rounded-3xl shadow-xl p-6 border border-gray-200">
          <div className="mb-6 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Mapa de {gym.nombre}</h1>
                <button 
                  onClick={async () => {
                    await supabase.auth.signOut();
                  }}
                  className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition"
                >
                  🚪 Salir
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                {isEditMode ? "Modo de edición activado. Arrastra las máquinas." : "Toca una máquina para reportar."}
              </p>
            </div>
            
            {currentUserRole === 'admin' && (
              <div className="flex gap-2 self-end md:self-auto">
                <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold text-sm shadow-md hover:bg-green-600">
                  + Nueva
                </button>
                <button onClick={() => setIsEditMode(!isEditMode)} className={`px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-all ${isEditMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {isEditMode ? '💾 Guardar' : '✏️ Editar Mapa'}
                </button>
              </div>
            )}
          </div>

          <div className={`relative bg-white rounded-xl border-2 h-[70vh] min-h-[600px] overflow-hidden ${isEditMode ? 'border-blue-400 border-dashed' : 'border-gray-300 border-solid'}`}>
            <svg ref={svgRef} className="w-full h-full cursor-crosshair" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} preserveAspectRatio="xMidYMid meet" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              <defs>
                <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                  <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {machines.map((m) => (
                <g 
                  key={m.id} 
                  onMouseDown={(e) => handleMouseDown(e, m.id)}
                  onClick={() => {
                    if (isEditMode) return; 
                    if (m.assigned_to === currentUserId || currentUserRole === 'admin') setSelectedMachine(m);
                    else alert("Máquina asignada a otro compañero.");
                  }}
                  className={`transition-all duration-100 ${isEditMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer hover:opacity-80'}`}
                >
                  <rect x={m.x} y={m.y} width={MACHINE_W} height={MACHINE_H} rx="8" className={`${getStatusColor(m)} stroke-2 shadow-sm`} />
                  <text x={m.x + (MACHINE_W/2)} y={m.y + 45} textAnchor="middle" className="text-xs font-bold fill-gray-800 pointer-events-none">
                    {m.nombre}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* PANEL DE ACCIÓN */}
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-200 flex flex-col justify-between">
          {selectedMachine && !isEditMode ? (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">{selectedMachine.nombre}</h2>
                <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full uppercase">Acción Requerida</span>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Observaciones:</label>
                <textarea className="w-full p-3 border rounded-xl text-sm outline-none bg-gray-50" rows="3" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {['Limpieza Profunda', 'Engrasado', 'Cambio de Cable'].map(action => (
                  <button key={action} onClick={() => handleMaintenance(action)} className="py-3 px-4 bg-slate-800 text-white text-sm font-bold rounded-xl shadow-md">
                    {action}
                  </button>
                ))}
              </div>
              <button onClick={() => setSelectedMachine(null)} className="w-full text-gray-400 text-sm hover:text-gray-600">Cancelar</button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-3xl">
                {isEditMode ? '📐' : '🛠️'}
              </div>
              <p className="text-gray-500 font-medium italic">
                {isEditMode ? "El mapa está bloqueado en una cuadrícula. Arrastra con confianza." : "Haz clic en una máquina para registrar actividad."}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}