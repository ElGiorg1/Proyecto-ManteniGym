import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Login({ setSession }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // Estados para controlar el "fade-in" visual y suave
  const [showRegisterFields, setShowRegisterFields] = useState(false);

  // Sincronizar el modo de registro con la animación suave
  useEffect(() => {
    if (isRegisterMode) {
      // Un micro-retraso para que el navegador procese el render antes de animar
      const timer = setTimeout(() => setShowRegisterFields(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowRegisterFields(false);
    }
  }, [isRegisterMode]);

  // --- VALIDACIONES DE SEGURIDAD ---
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const isLengthValid = password.length >= 6;

  const strengthPoints = [hasUppercase, hasNumber, hasSymbol, isLengthValid].filter(Boolean).length;
  
  const getStrengthColor = () => {
    if (strengthPoints <= 1) return 'bg-red-500 w-1/4';
    if (strengthPoints <= 3) return 'bg-amber-500 w-3/4';
    return 'bg-emerald-500 w-full';
  };

  const getStrengthText = () => {
    if (password.length === 0) return '';
    if (strengthPoints <= 1) return 'Contraseña débil ❌';
    if (strengthPoints <= 3) return 'Contraseña aceptable ⚠️';
    return 'Contraseña segura ¡Perfecto! ✨';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRegisterMode) {
      if (strengthPoints < 4) return alert("La contraseña no cumple con los requisitos.");
      if (password !== confirmPassword) return alert("Las contraseñas no coinciden.");
      
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) alert("Error: " + error.message);
      else if (data.session) setSession(data.session);
    } else {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Error: " + error.message);
      else setSession(data.session);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans text-slate-100 selection:bg-blue-500/30">
      
      {/* Contenedor con transición de altura fluida (duration-500) */}
      <form 
        onSubmit={handleSubmit} 
        className="bg-slate-900/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-800/80 transition-all duration-500 ease-in-out transform hover:scale-[1.005]"
      >
        
        {/* Título animado con desvanecimiento controlado */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight transition-all duration-300">
            {isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>
          <p className="text-slate-400 text-xs mt-1 transition-all duration-300">
            {isRegisterMode ? 'Registra tu correo para administrar tu gimnasio' : 'Ingresa tus credenciales para continuar'}
          </p>
        </div>

        {/* Campos del Formulario */}
        {/* Campos del Formulario */}
        <div className="mb-2">
          {/* Input Email */}
          <input 
            className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl outline-none text-slate-100 text-sm placeholder-slate-600 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" 
            type="email" 
            placeholder="Correo electrónico" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
          />
          
          {/* Input Password (Le ponemos un mt-4 para separarlo del email) */}
          <input 
            className="w-full p-3 mt-4 bg-slate-950/80 border border-slate-800 rounded-xl outline-none text-slate-100 text-sm placeholder-slate-600 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" 
            type="password" 
            placeholder="Contraseña" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
          />

          {/* INDICADORES DE FUERZA (Maneja sus márgenes dinámicamente) */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isRegisterMode && password.length > 0 
              ? 'max-h-40 opacity-100 mt-3 mb-1' 
              : 'max-h-0 opacity-0 pointer-events-none'
          }`}>
            <div className="space-y-2 px-1">
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ease-out ${getStrengthColor()}`}></div>
              </div>
              <p className="text-[11px] font-bold text-slate-400">{getStrengthText()}</p>
              
              <ul className="text-[11px] grid grid-cols-2 gap-1 text-slate-500">
                <li className={`transition-colors duration-300 ${hasUppercase ? "text-emerald-400 font-bold" : ""}`}>{hasUppercase ? '✓' : '•'} 1 Mayúscula</li>
                <li className={`transition-colors duration-300 ${hasNumber ? "text-emerald-400 font-bold" : ""}`}>{hasNumber ? '✓' : '•'} 1 Número</li>
                <li className={`transition-colors duration-300 ${hasSymbol ? "text-emerald-400 font-bold" : ""}`}>{hasSymbol ? '✓' : '•'} 1 Símbolo</li>
                <li className={`transition-colors duration-300 ${isLengthValid ? "text-emerald-400 font-bold" : ""}`}>{isLengthValid ? '✓' : '•'} Mín. 6 letras</li>
              </ul>
            </div>
          </div>

          {/* RECUADRO DE CONFIRMACIÓN (Le añadimos mt-4 dinámico solo cuando abre) */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isRegisterMode 
              ? 'max-h-14 opacity-100 mt-4' 
              : 'max-h-0 opacity-0 pointer-events-none'
          }`}>
            <input 
              className={`w-full p-3 bg-slate-950/80 border rounded-xl outline-none text-slate-100 text-sm placeholder-slate-600 transition-all duration-300 focus:ring-4 ${
                confirmPassword.length > 0 && password !== confirmPassword 
                  ? 'border-red-500/80 focus:ring-red-500/10 bg-red-950/10' 
                  : 'border-slate-800 focus:border-blue-500 focus:ring-blue-500/10'
              }`} 
              type="password" 
              placeholder="Confirmar contraseña" 
              required={isRegisterMode}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} 
            />
          </div>
        </div>

        {/* Botón interactivo */}
        <button 
          disabled={loading || (isRegisterMode && (strengthPoints < 4 || password !== confirmPassword))} 
          type="submit"
          className="w-full py-3 mt-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-all duration-300 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-30 disabled:hover:bg-blue-600 disabled:active:scale-100"
        >
          {loading ? 'Procesando...' : (isRegisterMode ? 'Registrarme y Entrar' : 'Iniciar Sesión')}
        </button>

        {/* Enlace para alternar modos */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200"
          >
            {isRegisterMode 
              ? '¿Ya tienes una cuenta? Inicia Sesión' 
              : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>

      </form>
    </div>
  );
}