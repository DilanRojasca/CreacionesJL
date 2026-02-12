import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import Button from '../../components/Button/Button';
import './ForgotPassword.css';

const ForgotPassword: React.FC = () => {
    const { resetPassword } = useAuth();
    const { success, error: showError, warning } = useNotifications();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEmailSent, setIsEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            warning('Por favor, ingresa tu correo electrónico.');
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await resetPassword(email);

            if (error) {
                if (error.message.includes('rate limit') || error.status === 429) {
                    showError('Demasiados intentos. Por favor espera unos minutos.');
                } else {
                    showError('No se pudo enviar el correo. Verifica que la dirección sea correcta.');
                }
                console.error('Error sending reset password email:', error);
            } else {
                success('Se ha enviado un enlace de recuperación a tu correo.');
                setIsEmailSent(true);
                setEmail('');
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            showError('Ocurrió un error inesperado. Intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <h2>Recuperar Contraseña</h2>
                
                {!isEmailSent ? (
                    <>
                        <p>
                            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                        </p>
                        <form className="forgot-password-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="email">Correo Electrónico</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email || ''}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ejemplo@correo.com"
                                    required
                                    autoFocus
                                />
                            </div>
                            
                            <Button 
                                type="submit" 
                                variant="primary" 
                                disabled={isSubmitting}
                                fullWidth
                            >
                                {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="success-message">
                        <p>
                            Si existe una cuenta asociada a ese correo, recibirás las instrucciones en breve.
                            <br /><br />
                            Revisa tu bandeja de entrada y la carpeta de spam.
                        </p>
                        <Button 
                            variant="secondary" 
                            onClick={() => setIsEmailSent(false)}
                        >
                            Intentar con otro correo
                        </Button>
                    </div>
                )}

                <div className="back-to-login">
                    <Link to="/login" className="back-link">
                        ← Regresar al inicio de sesión
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
