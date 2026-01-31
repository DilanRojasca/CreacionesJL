import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useChangePassword } from '../../hooks/useChangePassword';
import { useNotifications } from '../../hooks/useNotifications';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import Button from '../Button/Button';
import './ChangePasswordForm.css';

// 1. Schema de validación con Zod
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

const ChangePasswordForm: React.FC = () => {
  const { changePassword, loading } = useChangePassword();
  const notifications = useNotifications();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 2. Integración React Hook Form
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting } 
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onBlur'
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    const result = await changePassword(data.currentPassword, data.newPassword);

    if (result.success) {
      notifications.success(result.message || 'Contraseña actualizada correctamente');
      reset();
    } else {
      notifications.error(result.error || 'Error al cambiar la contraseña');
    }
  };

  return (
    <div className="change-password-container">
      <form onSubmit={handleSubmit(onSubmit)} className="password-form">
        
        {/* Current Password - Full Width */}
        <div className="form-group">
          <label htmlFor="currentPassword" className="form-label">
            Contraseña actual
          </label>
          <div className="input-wrapper">
            <input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              className={`password-input ${errors.currentPassword ? 'error' : ''}`}
              placeholder="Ingresa tu contraseña actual"
              disabled={loading || isSubmitting}
              {...register('currentPassword')}
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              title={showCurrentPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.currentPassword && (
            <span className="error-message">{errors.currentPassword.message}</span>
          )}
        </div>

        <div className="form-row">
          {/* New Password */}
          <div className="form-group">
            <label htmlFor="newPassword" className="form-label">
              Nueva contraseña
            </label>
            <div className="input-wrapper">
            <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                className={`password-input ${errors.newPassword ? 'error' : ''}`}
                placeholder="Mínimo 6 caracteres"
                disabled={loading || isSubmitting}
                {...register('newPassword')}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
                title={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.newPassword && (
              <span className="error-message">{errors.newPassword.message}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirmar contraseña
            </label>
            <div className="input-wrapper">
            <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`password-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Repite contraseña"
                disabled={loading || isSubmitting}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword.message}</span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <Button 
            type="submit" 
            variant="primary"
            disabled={loading || isSubmitting}
          >
            {(loading || isSubmitting) ? 'Actualizando...' : 'Actualizar contraseña'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordForm;
