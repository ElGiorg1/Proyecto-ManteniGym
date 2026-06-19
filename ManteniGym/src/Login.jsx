import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Login({ setSession }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else setSession(data.session);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-black mb-6 text-center">Acceso Staff</h2>
        <input className="w-full p-3 mb-4 border rounded-xl" type="email" placeholder="Correo" onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full p-3 mb-6 border rounded-xl" type="password" placeholder="Contraseña" onChange={(e) => setPassword(e.target.value)} />
        <button disabled={loading} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl">
          {loading ? 'Entrando...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
}