
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './RegisterForm.css';
import Button from '../Button/Button';
import Dropdown from '../Dropdown/Dropdown';
import { TIPOS_VIA, LETRAS, CARDINALES, TIPO_INMUEBLE, construirDireccionLegible, type AddressState } from '../../utils/addressUtils';
import { fetchColombiaData, type ColombiaDepartment } from '../../utils/colombiaData';

const RegisterForm: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  // Refs para hacer scroll a los campos con error
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [Country, setCountry] = useState('Colombia');
  const [Department, setDepartment] = useState('');
  const [City, setCity] = useState('');
  const [departments, setDepartments] = useState<ColombiaDepartment[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchColombiaData();
      setDepartments(data);
    };
    loadData();
  }, []);
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

  const scrollToError = (newErrors: { email: string; password: string; confirmPassword: string }) => {
    // Hacer scroll al primer campo con error
    if (newErrors.email && emailRef.current) {
      emailRef.current.scrollIntoView({ block: 'center' });
      emailRef.current.focus();
    } else if (newErrors.password && passwordRef.current) {
      passwordRef.current.scrollIntoView({ block: 'center' });
      passwordRef.current.focus();
    } else if (newErrors.confirmPassword && confirmPasswordRef.current) {
      confirmPasswordRef.current.scrollIntoView({ block: 'center' });
      confirmPasswordRef.current.focus();
    }
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

    if (!isValid) {
      scrollToError(newErrors);
      return;
    }

    if (isValid) {
      setIsSubmitting(true);
      setErrors({ ...newErrors, general: '' });

      try {
        // Construir la dirección legible antes de enviar
        const formattedAddress = construirDireccionLegible(direccion);
        // Registrar usuario usando el contexto de autenticación
        const { error } = await register(email, password, firstName, lastName, phone, Country, Department, City, formattedAddress, addressdetails, direccion);

        if (error) {
          // Manejar errores específicos de Supabase
          if (error.message.includes('already registered') || error.message.includes('Este correo electrónico ya está registrado')) {
            const errorState = {
              ...newErrors,
              email: 'Este correo electrónico ya está registrado.',
              general: '',
            };
            setErrors(errorState);
            scrollToError(errorState);
          } else if (error.message.includes('Password')) {
            const errorState = {
              ...newErrors,
              password: 'La contraseña debe tener al menos 6 caracteres.',
              general: '',
            };
            setErrors(errorState);
            scrollToError(errorState);
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
          setCountry('');
          setDepartment('');
          setCity('');
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
            ref={emailRef}
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
            ref={passwordRef}
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
            ref={confirmPasswordRef}
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
            onKeyPress={(e) => { if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', '+', '(', ')', '-', ' '].includes(e.key)) e.preventDefault(); }}
            required
          />
        </div>
        <div className="form-group full-width">
          <label htmlFor="country">País:</label>
          <Dropdown
            options={[{ value: 'Colombia', label: 'Colombia' }]}
            value={Country}
            onChange={setCountry}
            placeholder="Seleccione un país"
            id="country"
          />
        </div>
        <div className="form-group full-width">
          <label htmlFor="department">Departamento:</label>
          <Dropdown
            options={departments.map(dept => ({ value: dept.departamento, label: dept.departamento }))}
            value={Department}
            onChange={(deptName) => {
              setDepartment(deptName);
              setCity(''); // Reset city when department changes
              const selectedDept = departments.find(d => d.departamento === deptName);
              if (selectedDept) {
                setAvailableCities(selectedDept.ciudades);
              } else {
                setAvailableCities([]);
              }
            }}
            placeholder="Seleccione un departamento"
            id = "department"
          />
        </div>
        <div className="form-group full-width">
          <label htmlFor="city">Ciudad:</label>
          <Dropdown
            options={availableCities.map(city => ({ value: city, label: city }))}
            value={City}
            onChange={setCity}
            placeholder="Seleccione una ciudad"
            disabled={!Department}
            id="city"
          />
        </div>
        <div className="form-group full-width address-section">
          <label>Dirección:</label>

          {/* BLOQUE 1: Vía Principal */}
          <div className="address-row">
            <Dropdown
              options={TIPOS_VIA.map(t => ({ value: t, label: t }))}
              value={direccion.via_tipo}
              onChange={(value) => setDireccion({ ...direccion, via_tipo: value })}
              className="address-select"
            />
            <input
              type="number"
              placeholder="Num"
              min="0"
              value={direccion.via_numero}
              onChange={(e) => setDireccion({ ...direccion, via_numero: e.target.value })}
              onKeyPress={(e) => { if ((!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) || e.key === '-') e.preventDefault(); }}
              className="address-input-sm"
            />
            <Dropdown
              options={[{ value: '', label: 'Letra' }].concat(LETRAS.filter(l => l).map(l => ({ value: l, label: l })))}
              value={direccion.via_letra}
              onChange={(value) => setDireccion({ ...direccion, via_letra: value })}
              className="address-select-sm"
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={direccion.via_bis}
                onChange={(e) => setDireccion({ ...direccion, via_bis: e.target.checked })}
              /> Bis
            </label>
            <Dropdown
              options={[{ value: '', label: 'Card' }].concat(CARDINALES.filter(c => c).map(c => ({ value: c, label: c })))}
              value={direccion.via_cardinal}
              onChange={(value) => setDireccion({ ...direccion, via_cardinal: value })}
              className="address-select-sm"
            />
          </div>

          <div className="address-separator">#</div>

          {/* BLOQUE 2: Cruce */}
          <div className="address-row">
            <input
              type="number"
              placeholder="Num"
              min="0"
              value={direccion.cruce_numero}
              onChange={(e) => setDireccion({ ...direccion, cruce_numero: e.target.value })}
              onKeyPress={(e) => { if ((!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) || e.key === '-') e.preventDefault(); }}
              className="address-input-sm"
            />
            <Dropdown
              options={[{ value: '', label: 'Letra' }].concat(LETRAS.filter(l => l).map(l => ({ value: l, label: l })))}
              value={direccion.cruce_letra}
              onChange={(value) => setDireccion({ ...direccion, cruce_letra: value })}
              className="address-select-sm"
            />
            <Dropdown
              options={[{ value: '', label: 'Card' }].concat(CARDINALES.filter(c => c).map(c => ({ value: c, label: c })))}
              value={direccion.cruce_cardinal}
              onChange={(value) => setDireccion({ ...direccion, cruce_cardinal: value })}
              className="address-select-sm"
            />
            <div className="address-separator">-</div>
            <input
              type="number"
              placeholder="Placa"
              min="0"
              value={direccion.placa_numero}
              onChange={(e) => setDireccion({ ...direccion, placa_numero: e.target.value })}
              onKeyPress={(e) => { if ((!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) || e.key === '-') e.preventDefault(); }}
              className="address-input-sm"
            />
          </div>

          {/* BLOQUE 3: Complemento */}
          <div className="address-row full-row">
            <h4>Complemento (Opcional):</h4>
            <Dropdown
              options={[{ value: '', label: '(Apto, casa, etc.)' }].concat(TIPO_INMUEBLE.filter(t => t).map(t => ({ value: t, label: t })))}
              value={direccion.complemento_tipo}
              onChange={(value) => setDireccion({ ...direccion, complemento_tipo: value })}
              className="address-select"
            />
            <input
              type="number"
              placeholder="Detalle (Ej: 501)"
              min="0"
              value={direccion.complemento_dato}
              onChange={(e) => setDireccion({ ...direccion, complemento_dato: e.target.value })}
              onKeyPress={(e) => { if ((!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) || e.key === '-') e.preventDefault(); }}
              className="address-input-md"
            />
          </div>

          <div className="address-preview">
            <small>Resultado: {construirDireccionLegible(direccion) || "..."}</small>
          </div>
        </div>

        <div className="form-group full-width">
          <label htmlFor="addressdetails">Detalles de la dirección (Opcional):</label>
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
