import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Login({ setSession }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [suggestRegister, setSuggestRegister] = useState(false);

  // Limpiar sugerencias si cambias de modo o modificas el email
  useEffect(() => {
    setSuggestRegister(false);
  }, [isRegisterMode, email]);

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
    setSuggestRegister(false);
    
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
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          const { error: signUpCheck } = await supabase.auth.signUp({ email, password: 'TemporaryCheck123!' });
          if (signUpCheck && signUpCheck.message.includes("User already registered")) {
            alert("Contraseña incorrecta. Inténtalo de nuevo.");
          } else {
            setSuggestRegister(true);
          }
        } else {
          alert("Error al entrar: " + error.message);
        }
      } else {
        setSession(data.session);
      }
    }
    setLoading(false);
  };

  return (
    <div className="w-full flex justify-center items-start">
      <form onSubmit={handleSubmit} className="w-full max-w-xs mx-auto">
        
        {/* Encabezado */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">
            {isRegisterMode ? 'Crear Cuenta' : 'Acceso Staff'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {isRegisterMode ? 'Registra tu correo para administrar tu gimnasio' : 'Ingresa tus credenciales para continuar'}
          </p>
        </div>

        {/* ALERTA INTELIGENTE: SUGERENCIA DE REGISTRO */}
        {suggestRegister && (
          <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-center mb-4">
            <p className="text-[11px] text-blue-300 mb-2">Este correo no está registrado en el sistema.</p>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setSuggestRegister(false);
              }}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-3 rounded-lg transition"
            >
              ✨ Registrar este correo ahora
            </button>
          </div>
        )}

        {/* Campos del Formulario */}
        <div className="flex flex-col gap-4">
          {/* Input Email */}
          <input 
            className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl outline-none text-slate-100 text-sm placeholder-slate-600 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" 
            type="email" 
            placeholder="Correo electrónico" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
          />
          
          {/* Input Password */}
          <input 
            className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl outline-none text-slate-100 text-sm placeholder-slate-600 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" 
            type="password" 
            placeholder="Contraseña" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
          />

          {/* INDICADORES DE FUERZA (Solo existen en el código si es Modo Registro y hay letras) */}
          {isRegisterMode && password.length > 0 && (
            <div className="space-y-2 px-1 mt-1">
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
          )}

          {/* RECUADRO DE CONFIRMACIÓN (Solo existe en el código si es Modo Registro) */}
          {isRegisterMode && (
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
          )}
        </div>

        {/* Botón interactivo (Separado limpiamente por mt-5 fijo) */}
        <button 
          disabled={loading || (isRegisterMode && (strengthPoints < 4 || password !== confirmPassword))} 
          type="submit"
          className="w-full py-3 mt-5 bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-all duration-300 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-30 disabled:hover:bg-blue-600 disabled:active:scale-100 text-sm"
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