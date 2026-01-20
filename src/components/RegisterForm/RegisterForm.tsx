
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './RegisterForm.css';
import Button from '../Button/Button';
import { TIPOS_VIA, LETRAS, CARDINALES, TIPO_INMUEBLE, construirDireccionLegible, type AddressState } from '../../utils/addressUtils';

const RegisterForm: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [direccion, setDireccion] = useState<AddressState>({
    via_tipo: TIPOS_VIA[0],
    via_numero: '',
    via_letra: '',
    via_bis: false,
    via_cardinal: '',
    cruce_numero: '',
    cruce_letra: '',
    cruce_cardinal: '',
    placa_numero: '',
    complemento_tipo: '',
    complemento_dato: ''
  });
  const [addressdetails, setAddressdetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    general: '',
  });

  const validateEmail = (email: string) => {
    // Expresión regular para validar el formato de email
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let newErrors = {
      email: '',
      password: '',
      confirmPassword: '',
    };
    let isValid = true;

    // Validación de campos vacíos
    if (!email) {
      newErrors.email = 'El correo electrónico es obligatorio.';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria.';
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Repetir contraseña es obligatorio.';
      isValid = false;
    }

    // Validación de formato de email solo si no está vacío
    if (email && !validateEmail(email)) {
      newErrors.email = 'El formato del correo electrónico no es válido.';
      isValid = false;
    }

    // Validación de coincidencia de contraseñas solo si ambas no están vacías
    if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
      isValid = false;
    }

    setErrors({ ...newErrors, general: '' });

    if (isValid) {
      setIsSubmitting(true);
      setErrors({ ...newErrors, general: '' });

      try {
        // Construir la dirección legible antes de enviar
        const formattedAddress = construirDireccionLegible(direccion);
        // Registrar usuario usando el contexto de autenticación
        const { error } = await register(email, password, firstName, lastName, phone, formattedAddress, addressdetails, direccion);

        if (error) {
          // Manejar errores específicos de Supabase
          if (error.message.includes('already registered')) {
            setErrors({
              ...newErrors,
              email: 'Este correo electrónico ya está registrado.',
              general: '',
            });
          } else if (error.message.includes('Password')) {
            setErrors({
              ...newErrors,
              password: 'La contraseña debe tener al menos 6 caracteres.',
              general: '',
            });
          } else {
            setErrors({
              ...newErrors,
              general: error.message || 'Error al registrar. Por favor, intenta de nuevo.',
            });
          }
        } else {
          // Registro exitoso - limpiar formulario y redirigir
          setFirstName('');
          setLastName('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setPhone('');
          setDireccion({
            via_tipo: TIPOS_VIA[0],
            via_numero: '',
            via_letra: '',
            via_bis: false,
            via_cardinal: '',
            cruce_numero: '',
            cruce_letra: '',
            cruce_cardinal: '',
            placa_numero: '',
            complemento_tipo: '',
            complemento_dato: ''
          });
          setAddressdetails('');
          navigate('/login');
        }
      } catch (error: any) {
        console.error('Error al registrar:', error);
        setErrors({
          ...newErrors,
          general: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="register-wrapper">
      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <h2>Registrarse</h2>
        <div className="form-group">
          <label htmlFor="firstName">Nombre:</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastName">Apellido:</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="form-group full-width">
          <label htmlFor="email">Correo Electrónico:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {errors.email && <p className="error-message">{errors.email}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setIsPasswordFocused(true)}
            onBlur={() => setIsPasswordFocused(false)}
            required
          />
          {errors.password && <p className="error-message">{errors.password}</p>}
          {isPasswordFocused && <p className="help-message">Mínimo 6 caracteres</p>}
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Repetir Contraseña:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
        </div>
        <div className="form-group full-width">
          <label htmlFor="phone">Teléfono:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div className="form-group full-width address-section">
          <label>Dirección:</label>

          {/* BLOQUE 1: Vía Principal */}
          <div className="address-row">
            <select
              name="via_tipo"
              value={direccion.via_tipo}
              onChange={(e) => setDireccion({ ...direccion, via_tipo: e.target.value })}
              className="address-select"
            >
              {TIPOS_VIA.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              type="text"
              placeholder="Num"
              value={direccion.via_numero}
              onChange={(e) => setDireccion({ ...direccion, via_numero: e.target.value })}
              className="address-input-sm"
            />
            <select
              name="via_letra"
              value={direccion.via_letra}
              onChange={(e) => setDireccion({ ...direccion, via_letra: e.target.value })}
              className="address-select-sm"
            >
              <option value="">Letter</option>
              {LETRAS.map(l => l && <option key={l} value={l}>{l}</option>)}
            </select>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={direccion.via_bis}
                onChange={(e) => setDireccion({ ...direccion, via_bis: e.target.checked })}
              /> Bis
            </label>
            <select
              name="via_cardinal"
              value={direccion.via_cardinal}
              onChange={(e) => setDireccion({ ...direccion, via_cardinal: e.target.value })}
              className="address-select-sm"
            >
              <option value="">Card</option>
              {CARDINALES.map(c => c && <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="address-separator">#</div>

          {/* BLOQUE 2: Cruce */}
          <div className="address-row">
            <input
              type="text"
              placeholder="Num Generadora"
              value={direccion.cruce_numero}
              onChange={(e) => setDireccion({ ...direccion, cruce_numero: e.target.value })}
              className="address-input-sm"
            />
            <select
              name="cruce_letra"
              value={direccion.cruce_letra}
              onChange={(e) => setDireccion({ ...direccion, cruce_letra: e.target.value })}
              className="address-select-sm"
            >
              <option value="">Letra</option>
              {LETRAS.map(l => l && <option key={l} value={l}>{l}</option>)}
            </select>
            <select
              name="cruce_cardinal"
              value={direccion.cruce_cardinal}
              onChange={(e) => setDireccion({ ...direccion, cruce_cardinal: e.target.value })}
              className="address-select-sm"
            >
              <option value="">Card</option>
              {CARDINALES.map(c => c && <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="address-separator">-</div>

          {/* BLOQUE 3: Placa */}
          <div className="address-row">
            <input
              type="text"
              placeholder="Placa"
              value={direccion.placa_numero}
              onChange={(e) => setDireccion({ ...direccion, placa_numero: e.target.value })}
              className="address-input-md"
            />
          </div>

          {/* BLOQUE 4: Complemento */}
          <div className="address-row full-row">
            <select
              name="complemento_tipo"
              value={direccion.complemento_tipo}
              onChange={(e) => setDireccion({ ...direccion, complemento_tipo: e.target.value })}
              className="address-select"
            >
              <option value="">Complemento (Apto, etc)</option>
              {TIPO_INMUEBLE.map(t => t && <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              type="text"
              placeholder="Detalle (Ej: 501)"
              value={direccion.complemento_dato}
              onChange={(e) => setDireccion({ ...direccion, complemento_dato: e.target.value })}
              className="address-input-md"
            />
          </div>

          <div className="address-preview">
            <small>Resultado: {construirDireccionLegible(direccion) || "..."}</small>
          </div>
        </div>

        <div className="form-group full-width">
          <label htmlFor="addressdetails">Detalles de la dirección:</label>
          <input
            type="text"
            id="addressdetails"
            name="addressdetails"
            value={addressdetails}
            onChange={(e) => setAddressdetails(e.target.value)}
            required
          />
        </div>
        {errors.general && <p className="error-message full-width">{errors.general}</p>}
        <div className="full-width">
          <Button type="submit" variant="tertiary" disabled={isSubmitting} fullWidth>
            {isSubmitting ? 'Registrando...' : 'Registrarse'}
          </Button>
        </div>
      </form>
      <div className="register-form-footer">
        <p><Link to="/login">Ya tienes cuenta? Inicia sesión</Link></p>
        <p><Link to="/" className="back-link">← Regresar al inicio</Link></p>
      </div>
    </div>
  );
};

export default RegisterForm;
