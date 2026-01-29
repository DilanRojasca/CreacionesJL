import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../database/supabase';
import { FaUser, FaPhone, FaLocationDot, FaHouse, FaArrowLeft, FaPen, FaTriangleExclamation } from 'react-icons/fa6';
import { useNotifications } from '../../hooks/useNotifications';
import './ProfileView.css';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  country: string;
  department: string;
  city: string;
  address_text: string;
  address_details: string;
  email: string;
  created_at?: string;
}

const ProfileView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setFetchError(null);
        
        // Consultar la tabla public.users usando 'user_id' como identificador
        // Especificamos el esquema 'public' explícitamente como se solicitó
        const { data, error } = await supabase
          .rpc('get_user_profile', { p_user_id: user.id });
        
        // data es un array, tomamos el primer elemento
        const profileData = data && data.length > 0 ? data[0] : null;

        if (error) {
          console.error('Error al consultar perfil:', error.message);
          
          // Fallback a metadata si hay error (los datos podrían estar incompletos por la limpieza de cookies)
          if (user.user_metadata) {
            setProfile({
              id: user.id,
              first_name: user.user_metadata.first_name || '',
              last_name: user.user_metadata.last_name || '',
              full_name: user.user_metadata.full_name || '',
              phone: user.user_metadata.phone || '',
              country: user.user_metadata.country || '',
              department: user.user_metadata.department || '',
              city: user.user_metadata.city || '',
              address_text: user.user_metadata.address_text || '',
              address_details: user.user_metadata.address_details || '',
              email: user.email || ''
            });
          }
        } else if (profileData) {
          setProfile(profileData);
        } else if (user.user_metadata) {
          // Si no hay datos en la tabla pero sí en la sesión
          setProfile({
            id: user.id,
            first_name: user.user_metadata.first_name || '',
            last_name: user.user_metadata.last_name || '',
            full_name: user.user_metadata.full_name || '',
            phone: user.user_metadata.phone || '',
            country: user.user_metadata.country || '',
            department: user.user_metadata.department || '',
            city: user.user_metadata.city || '',
            address_text: user.user_metadata.address_text || '',
            address_details: user.user_metadata.address_details || '',
            email: user.email || ''
          });
        }
      } catch (err) {
        console.error('Error inesperado:', err);
        setFetchError('Error al conectar con la base de datos.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="profile-view-container">
        <div className="profile-card">
          <header className="profile-header">
            <h1>Sin sesión activa</h1>
            <p>Por favor inicia sesión para ver tu perfil.</p>
          </header>
          <div className="profile-footer">
            <Link to="/login" className="btn-edit-profile">Ir al Login</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-view-container">
        <div className="profile-card">
          <div className="loading-container" style={{ textAlign: 'center', padding: '60px' }}>
            <div className="spinner" style={{ border: '4px solid var(--color-beige-pink)', borderTop: '4px solid var(--color-gold-strong)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <p style={{ color: 'var(--text-tertiary)' }}>Cargando tu información...</p>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError && !profile) {
    return (
      <div className="profile-view-container">
        <div className="profile-card">
          <header className="profile-header">
            <h1 style={{ color: 'var(--color-gold-strong)' }}>Error al cargar datos</h1>
            <p>{fetchError}</p>
          </header>
          <div className="profile-footer">
            <button className="btn-edit-profile" onClick={() => window.location.reload()}>Reintentar</button>
            <Link to="/" className="btn-back-home">Volver al Inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm("¿Estás 100% seguro? Esta acción BORRARÁ tu perfil de forma permanente y no se podrá recuperar.")) {
      return;
    }

    if (!window.confirm("Última advertencia: ¿Confirmas la eliminación irreversible?")) {
      return;
    }

    try {
      setIsDeleting(true);
      
      const { error } = await supabase.rpc('delete_profile');

      if (error) {
        console.error('Error al eliminar perfil:', error.message);
        notifications.error('Hubo un error al eliminar tu perfil: ' + error.message);
        setIsDeleting(false);
        return;
      }

      notifications.success('Tu perfil ha sido eliminado permanentemente.');

      // Cerrar sesión inmediatamente
      await supabase.auth.signOut();

      // Redirigir al login
      navigate('/login');
    } catch (err: any) {
      console.error('Error inesperado:', err.message || err);
      notifications.error('Ocurrió un error inesperado al eliminar tu cuenta.');
      setIsDeleting(false);
    }
  };

  const initials = (profile?.first_name?.[0] || profile?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase();
  const displayName = profile?.full_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Usuario';

  return (
    <div className="profile-view-container">
      <div className="profile-card">
        <header className="profile-header">
          <div className="profile-avatar-large">
            {initials}
          </div>
          <h1>{displayName.toUpperCase()}</h1>
          <p>{user.email}</p>
        </header>

        <section className="profile-section">
          <h2 className="profile-section-title">
            <FaUser /> Datos Personales
          </h2>
          <div className="info-grid">
            <div className="info-group">
              <span className="info-label">Nombre completo</span>
              <span className="info-value">{displayName}</span>
            </div>
            {profile?.phone && (
              <div className="info-group">
                <span className="info-label">Teléfono</span>
                <span className="info-value">
                  <FaPhone style={{ fontSize: '0.8rem', marginRight: '4px' }} />
                  {profile.phone}
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="profile-section">
          <h2 className="profile-section-title">
            <FaLocationDot /> Dirección de Envío
          </h2>
          <div className="info-grid">
            {(profile?.country || profile?.department) && (
              <div className="info-group">
                <span className="info-label">País / Departamento</span>
                <span className="info-value">
                  {profile?.country} {profile?.department ? `- ${profile.department}` : ''}
                </span>
              </div>
            )}
            {profile?.city && (
              <div className="info-group">
                <span className="info-label">Ciudad</span>
                <span className="info-value">{profile.city}</span>
              </div>
            )}
            {profile?.address_text && (
              <div className="info-group" style={{ gridColumn: '1 / -1' }}>
                <span className="info-label">Dirección</span>
                <span className="info-value">
                  <FaHouse style={{ fontSize: '0.8rem', marginRight: '4px' }} />
                  {profile.address_text}
                  {profile.address_details && ` (${profile.address_details})`}
                </span>
              </div>
            )}
            {!profile?.country && !profile?.city && !profile?.address_text && (
              <p className="no-info" style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                No hay información de envío registrada.
              </p>
            )}
          </div>
        </section>

        <section className="danger-zone">
          <h2 className="danger-zone-title">
            <FaTriangleExclamation /> Zona de Peligro
          </h2>
          <p className="danger-zone-description">
            Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate de que realmente quieres hacer esto.
          </p>
          <button 
            className="btn-delete-account" 
            onClick={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'ELIMINAR CUENTA PERMANENTEMENTE'}
          </button>
        </section>

        <div className="profile-footer">
          <button className="btn-edit-profile" onClick={() => navigate('/update-profile')}>
            <FaPen style={{ marginRight: '8px' }} /> EDITAR PERFIL
          </button>
          <Link to="/" className="btn-back-home">
            <FaArrowLeft /> Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
