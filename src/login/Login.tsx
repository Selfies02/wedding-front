import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '../components/Toast/Toast'; // Importa la función toast
import './Login.css';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(username, password);
  
    if (result === true) {
      toast.success('Inicio de sesión exitoso'); // Muestra mensaje de éxito
      navigate('/'); // Redirige a la página principal
    } else if (typeof result === 'string') {
      toast.error(result); // Solo muestra el error si es un string
    }
  };  

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="login-title">Iniciar Sesión</h2>

        <div className="input-group">
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="input-group">
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="login-button" type="submit">
          Iniciar Sesión
        </button>
      </form>
    </div>
  );
};

export default Login;
