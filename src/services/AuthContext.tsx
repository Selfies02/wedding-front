// AuthContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextProps {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Inicializa el estado leyendo del sessionStorage
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    return storedAuth === 'true';
  });

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('http://3.128.170.227/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem('isAuthenticated', 'true');
        return true;
      } else {
        return data.message || 'Error en la autenticación'; // Retorna el mensaje del backend
      }
    } catch (error) {
      console.error('Error en el login:', error);
      return 'Error de conexión con el servidor';
    }
  };  

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('isAuthenticated');
    // Si en el futuro deseas limpiar otros datos, agrégalos aquí
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
