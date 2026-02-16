import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../database/supabase';
import { 
  FaUser, 
  FaAddressCard, 
  FaLock, 
  FaTrashCan, 
  FaArrowLeft, 
  FaPen, 
  FaHouse,
  FaPhone
} from 'react-icons/fa6';
import { useNotifications } from '../../hooks/useNotifications';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import ChangePasswordForm from '../../components/forms/ChangePasswordForm';
import Button from '../../components/Button/Button';
import type { User } from '@supabase/supabase-js';
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

type ActiveSection = 'profile' | 'security' | 'danger';

const ProfileView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State for active section (default: profile)
  const [activeTab, setActiveTab] = useState<ActiveSection>('profile');

  // Deletion states
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFirstConfirmation, setShowFirstConfirmation] = useState(false);
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .rpc('get_user_profile', { p_user_id: user.id });
        
        const profileData = data && data.length > 0 ? data[0] : null;

        if (error) {
          console.error('Error al consultar perfil:', error.message);
          if (user.user_metadata) {
            setProfile(mapMetadataToProfile(user));
          }
        } else if (profileData) {
          setProfile(profileData);
        } else if (user.user_metadata) {
          setProfile(mapMetadataToProfile(user));
        }
      } catch (err) {
        console.error('Error inesperado:', err);
        // Silent fail or just log, retry button isn't implemented in this design
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Helper to map Supabase metadata to profile structure
  const mapMetadataToProfile = (user: User): UserProfile => ({
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

  const handleDeleteAccount = async () => {
    setShowFirstConfirmation(true);
  };

  const handleFirstConfirmation = () => {
    setShowFirstConfirmation(false);
    setShowFinalConfirmation(true);
  };

  const handleFinalConfirmation = async () => {
    setShowFinalConfirmation(false);
    try {
      setIsDeleting(true);
      const { error } = await supabase.rpc('delete_own_account');

      if (error) {
        console.error('Error al eliminar perfil:', error.message);
        notifications.error('Hubo un error al eliminar tu perfil: ' + error.message);
        setIsDeleting(false);
        return;
      }

      notifications.success('Tu perfil ha sido eliminado permanentemente.');
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error inesperado:', errorMessage);
      notifications.error('Ocurrió un error inesperado al eliminar tu cuenta.');
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-view-container">
        <div className="profile-content text-center">
          <h1>Sin sesión activa</h1>
          <p>Por favor inicia sesión para ver tu perfil.</p>
          <div style={{ marginTop: '20px' }}>
             <Button onClick={() => navigate('/login')}>Ir al Login</Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
     return (
       <div className="profile-view-container">
         <div className="loading-container">
             <div className="spinner"></div>
             <p>Cargando información...</p>
         </div>
       </div>
     );
  }

  const initials = (profile?.first_name?.[0] || profile?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase();
  const displayName = profile?.full_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Usuario';

  // --- Render Sections ---

  const renderProfileSection = () => (
    <div className="animate-fade-in">
      <div className="section-header">
        <h1><FaAddressCard /> Información de Cuenta</h1>
        <Button variant="secondary" size="small" onClick={() => navigate('/update-profile')}>
          <FaPen style={{ marginRight: '6px' }} /> Editar
        </Button>
      </div>
      
      <div className="info-display-grid">
        {/* Personal Info */}
        <div className="info-card">
          <h3><FaUser style={{ marginRight: '6px' }} /> Datos Personales</h3>
          <div className="info-item">
            <span className="label">Nombre completo</span>
            <span className="value">{displayName}</span>
          </div>
          <div className="info-item">
            <span className="label">Email</span>
            <span className="value">{user.email}</span>
          </div>
          <div className="info-item">
            <span className="label">Teléfono</span>
            <span className="value">
              {profile?.phone ? (
                <>
                  <FaPhone style={{ fontSize: '0.8rem', marginRight: '4px', color: 'var(--text-tertiary)' }} />
                  {profile.phone}
                </>
              ) : <span className="text-gray-400 italic">No registrado</span>}
            </span>
          </div>
        </div>

        {/* Address Info */}
        <div className="info-card">
          <h3><FaHouse style={{ marginRight: '6px' }} /> Dirección de Envío</h3>
          
          {(!profile?.country && !profile?.city && !profile?.address_text) ? (
            <p className="no-info">No hay información de envío registrada.</p>
          ) : (
            <>
              <div className="info-item">
                <span className="label">País / Departamento</span>
                <span className="value">
                  {profile?.country || '-'} {profile?.department ? `/ ${profile.department}` : ''}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Ciudad</span>
                <span className="value">{profile?.city || '-'}</span>
              </div>
              <div className="info-item">
                <span className="label">Dirección</span>
                <span className="value">{profile?.address_text || '-'}</span>
                {profile?.address_details && (
                  <span className="label" style={{ marginTop: '2px' }}>({profile.address_details})</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="animate-fade-in">
      <div className="section-header">
        <h1><FaLock /> Seguridad</h1>
      </div>
      <p className="section-description">
        Actualiza tu contraseña para mantener tu cuenta protegida.
      </p>
      
      <div style={{ maxWidth: '400px' }}>
        <ChangePasswordForm />
      </div>
    </div>
  );

  const renderDangerSection = () => (
    <div className="animate-fade-in">
      <div className="section-header">
        <h1 style={{ color: '#dc3545' }}><FaTrashCan /> Eliminar Cuenta</h1>
      </div>
      
      <div className="danger-content">
        <div className="danger-icon">
          <FaTrashCan />
        </div>
        <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>¿Estás seguro?</h2>
        <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          Al eliminar tu cuenta, perderás todo el historial de pedidos y direcciones guardadas. 
          Esta acción es <strong>irreversible</strong> y no podremos recuperar tu información.
        </p>
        
        <button 
          className="btn-delete-account" /* Reusing style or can use global Button variant="tertiary" but red */
          style={{ 
            backgroundColor: '#dc3545', 
            color: 'white', 
            padding: '12px 24px', 
            borderRadius: 'var(--border-radius-md)',
            border: 'none',
            fontWeight: 'bold',
            cursor: isDeleting ? 'not-allowed' : 'pointer'
          }}
          onClick={handleDeleteAccount}
          disabled={isDeleting}
        >
          {isDeleting ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="profile-view-container">
      <div className="profile-layout">
        
        {/* SIDEBAR */}
        <aside className="profile-sidebar">
          {/* Header (Avatar) */}
          <div className="profile-mini-header">
            <div className="profile-avatar-small">
              {initials}
            </div>
            <h2>{profile?.first_name || 'Mi Perfil'}</h2>
            <p className="truncate-email">{user.email}</p>
          </div>

          {/* Navigation */}
          <nav className="profile-nav">
            <button 
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <FaUser /> <span>Mi Información</span>
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <FaLock /> <span>Contraseña</span>
            </button>
            
            <button 
              className={`nav-item danger-link ${activeTab === 'danger' ? 'active' : ''}`}
              onClick={() => setActiveTab('danger')}
            >
              <FaTrashCan /> <span>Eliminar Cuenta</span>
            </button>
          </nav>

          {/* Back link - Desktop only */}
          <div className="back-link-wrapper hidden-mobile">
            <Link to="/" className="btn-back-home" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: '0.9rem' }}>
              <FaArrowLeft /> Volver al Inicio
            </Link>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="profile-content">
          {activeTab === 'profile' && renderProfileSection()}
          {activeTab === 'security' && renderSecuritySection()}
          {activeTab === 'danger' && renderDangerSection()}

          {/* Mobile Back Button visible only on mobile/bottom */}
          <div className="mobile-footer" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--color-beige-pink)' }}>
             <style>{`@media(min-width: 768px) { .mobile-footer { display: none !important; } }`}</style>
             <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-tertiary)' }}>
                <FaArrowLeft /> Volver al Inicio
             </Link>
          </div>
        </main>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showFirstConfirmation}
        title="¿Estás 100% seguro?"
        message="Esta acción BORRARÁ tu perfil de forma permanente."
        confirmText="Sí, continuar"
        cancelText="Cancelar"
        onConfirm={handleFirstConfirmation}
        onCancel={() => setShowFirstConfirmation(false)}
        isDangerous={true}
      />

      <ConfirmationModal
        isOpen={showFinalConfirmation}
        title="Última advertencia"
        message="¿Confirmas la eliminación irreversible de tu cuenta?"
        confirmText="Eliminar permanentemente"
        cancelText="Cancelar"
        onConfirm={handleFinalConfirmation}
        onCancel={() => setShowFinalConfirmation(false)}
        isDangerous={true}
      />
    </div>
  );
};

export default ProfileView;
