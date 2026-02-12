
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import Button from '../../components/Button/Button';
import './LoginForm.css';

const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const { loginSuccess, authError, warning } = useNotifications();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!email || !password) {
      warning('Por favor, completa todos los campos.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: loginError } = await login(email, password);

      if (loginError) {
        // Manejar errores específicos de Supabase
        if (loginError.message.includes('Invalid login credentials')) {
          authError('Correo electrónico o contraseña incorrectos.');
        } else if (loginError.message.includes('Email not confirmed')) {
          authError('Por favor, verifica tu correo electrónico antes de iniciar sesión.');
        } else {
          authError(loginError.message || 'Error al iniciar sesión. Por favor, intenta de nuevo.');
        }
      } else {
        // Login exitoso
        loginSuccess();
        navigate('/');
      }
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      authError('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <form className="login-form" onSubmit={handleLogin}>
          <h2>Iniciar Sesión</h2>
          <div className="form-group">
              <label htmlFor="email">Correo Electrónico:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email || ''}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
          </div>
          <div className="form-group">
              <label htmlFor="password">Contraseña:</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password || ''}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
          </div>
          <Button type="submit" variant="secondary" disabled={isSubmitting}>
            {isSubmitting ? 'Iniciando sesión...' : 'Entrar'}
          </Button>
      </form>
      <div className="login-form-footer">
              <p>¿Olvidaste tu contraseña? <Link to="/forgot-password">Recuperar contraseña</Link></p>
              <p>¿No tienes una cuenta? <Link to="/register">Regístrate</Link></p>
              <p><Link to="/" className="back-link">← Regresar al inicio</Link></p>
          </div>
    </div>
  );
};

export default LoginForm;

