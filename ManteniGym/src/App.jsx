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

export default function Main() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  if (!session) return <Login setSession={setSession} />;
  return <GymApp session={session} />;
}

export function GymApp() {
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
  }, []);

  async function fetchMachines() {
    setLoading(true);
    const { data, error } = await supabase.from('maquinas').select('*');
    if (error) console.error('Error cargando:', error);
    else setMachines(data);
    setLoading(false);
  }

  const handleAddMachine = async (e) => {
    e.preventDefault();
    if (!newMachineName || !newMachineAssignedTo) return;

    // Intentamos insertar la máquina
    const { error } = await supabase.from('maquinas').insert([
      { 
        nombre: newMachineName, 
        estado: 'al_dia', 
        x: 360, y: 280, 
        encargado: parseInt(newMachineAssignedTo) 
      }
    ]);

    // LÓGICA DE MANEJO DE ERRORES RESTAURADA
    if (error) {
      // Si falla, te mostrará una alerta con el motivo exacto
      alert("Error al guardar en la base de datos: " + error.message);
      console.error("Detalle del error:", error);
    } else {
      // Si tiene éxito, cierra la ventana y limpia el formulario
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

  // --- NUEVA LÓGICA DE ARRASTRE CON CUADRÍCULA ---
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

    // 1. Calcular nueva posición centrada en el cursor
    let rawX = cursorPt.x - (MACHINE_W / 2);
    let rawY = cursorPt.y - (MACHINE_H / 2);

    // 2. EFECTO IMÁN: Redondear al múltiplo más cercano de la cuadrícula (20px)
    let snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
    let snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

    // 3. LÍMITES: Evitar que se salgan del mapa
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

    const { error } = await supabase
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

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-xl">Cargando...</div>;

  return (
    <div className="relative min-h-screen bg-gray-100 p-4 md:p-10 font-sans text-gray-900">
      
      {/* MODAL PARA AGREGAR MÁQUINA */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Nueva Máquina</h2>
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

      {/* 1. Hicimos el contenedor principal mucho más ancho (max-w-[95%]) */}
      <div className="max-w-[95%] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* 2. El mapa ahora ocupa 3 de las 4 columnas para ser más protagonista */}
        <div className="lg:col-span-3 bg-white rounded-3xl shadow-xl p-6 border border-gray-200">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Mapa de Control</h1>
              <p className="text-gray-500 text-sm">
                {isEditMode ? "Modo de edición activado. Arrastra las máquinas." : "Toca una máquina para reportar."}
              </p>
            </div>
            
            {currentUserRole === 'admin' && (
              <div className="flex gap-2">
                <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold text-sm">
                  + Nueva
                </button>
                <button onClick={() => setIsEditMode(!isEditMode)} className={`px-4 py-2 rounded-xl font-bold text-sm ${isEditMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {isEditMode ? '💾 Guardar' : '✏️ Editar Mapa'}
                </button>
              </div>
            )}
          </div>

          {/* 3. Aumentamos la altura de la caja a '70vh' (70% de la pantalla) */}
          <div className={`relative bg-white rounded-xl border-2 h-[70vh] min-h-[600px] overflow-hidden ${isEditMode ? 'border-blue-400 border-dashed' : 'border-gray-300 border-solid'}`}>
            <svg ref={svgRef} className="w-full h-full cursor-crosshair" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} preserveAspectRatio="xMidYMid meet" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              
              <defs>
                <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                  <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* MÁQUINAS */}
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
                  <text x={m.x + (MACHINE_W/2)} y={m.y + 35} textAnchor="middle" className="text-[10px] font-bold fill-gray-800 pointer-events-none">
                    {m.nombre}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* LADO DERECHO: PANEL DE ACCIÓN */}
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