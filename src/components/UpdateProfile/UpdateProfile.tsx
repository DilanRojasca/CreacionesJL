import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { supabase } from '../../database/supabase';
import { FaFloppyDisk, FaXmark } from 'react-icons/fa6';
import './UpdateProfile.css';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  phone: string;
  department: string;
  city: string;
  address_text: string;
  address_details: string;
}

const UpdateProfile: React.FC = () => {
  const { user } = useAuth();
  const { profileUpdated, error: showError, warning } = useNotifications();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    department: '',
    city: '',
    address_text: '',
    address_details: ''
  });

  // Cargar datos actuales del perfil
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setFormData({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            phone: data.phone || '',
            department: data.department || '',
            city: data.city || '',
            address_text: data.address_text || '',
            address_details: data.address_details || ''
          });
        }
      } catch (err: any) {
        console.error('Error al cargar perfil:', err.message);
        showError('No se pudieron cargar los datos del perfil.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validación básica
    if (!formData.first_name || !formData.last_name) {
      warning('Nombre y Apellido son obligatorios.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('update_profile', {
        p_first_name: formData.first_name,
        p_last_name: formData.last_name,
        p_phone: formData.phone,
        p_address_text: formData.address_text,
        p_address_details: formData.address_details,
        p_city: formData.city,
        p_department: formData.department
      });

      if (error) {
        console.error('Error RPC:', error.message);
        showError('Error al actualizar: ' + error.message);
      } else {
        console.log('Perfil actualizado con RPC:', data);
        profileUpdated();

        // Volvemos al perfil después de un breve momento
        setTimeout(() => {
          navigate('/profile');
        }, 1000);
      }
    } catch (err: any) {
      console.error('Error inesperado:', err.message);
      showError('Ocurrió un error inesperado al actualizar.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="update-profile-container">
        <div className="loading-spinner" style={{ color: 'var(--color-gold-strong)', fontSize: '1.2rem' }}>
          Cargando tus datos...
        </div>
      </div>
    );
  }

  return (
    <div className="update-profile-container">
      <div className="update-profile-card">
        <header className="update-profile-header">
          <h1>Editar mi Perfil</h1>
          <p>Mantén tu información de contacto actualizada</p>
        </header>


        <form className="update-profile-form" onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label htmlFor="first_name">Nombre</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Tu nombre"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Apellido</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Tu apellido"
              required
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="phone">Teléfono de Contacto</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Ej: 311 888 8888"
            />
          </div>

          <div className="form-group">
            <label htmlFor="department">Departamento</label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="Ej: Antioquia"
            />
          </div>

          <div className="form-group">
            <label htmlFor="city">Ciudad</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Ej: Medellín"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="address_text">Dirección Principal</label>
            <input
              type="text"
              id="address_text"
              name="address_text"
              value={formData.address_text}
              onChange={handleChange}
              placeholder="Calle, Carrera, Transversal..."
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="address_details">Detalles (Apto, Torre, Casa)</label>
            <input
              type="text"
              id="address_details"
              name="address_details"
              value={formData.address_details}
              onChange={handleChange}
              placeholder="Ej: Apto 502, Bloque 4"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-update-cancel" onClick={() => navigate('/profile')}>
              <FaXmark /> Cancelar
            </button>
            <button type="submit" className="btn-update-submit" disabled={loading}>
              <FaFloppyDisk /> {loading ? 'Actualizando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;