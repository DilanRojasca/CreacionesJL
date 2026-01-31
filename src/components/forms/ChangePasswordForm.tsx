import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useChangePassword } from '../../hooks/useChangePassword';
import { useNotifications } from '../../hooks/useNotifications';
import Button from '../Button/Button';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa6';

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

  // Componente Input reutilizable local (estilo shadcn-like)
  const InputField = ({ 
    id, 
    label, 
    type, 
    showPassword, 
    togglePassword, 
    registerProps, 
    error 
  }: any) => (
    <div className="form-group mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
          <FaLock size={14} />
        </div>
        <input
          id={id}
          type={showPassword ? 'text' : type}
          className={`
            w-full pl-9 pr-10 py-2 bg-white dark:bg-zinc-900 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors
            ${error 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
              : 'border-gray-300 dark:border-zinc-700 focus:border-amber-500 focus:ring-amber-200'}
            disabled:opacity-50 disabled:cursor-not-allowed
            text-gray-900 dark:text-gray-100 placeholder-gray-400
          `}
          disabled={loading || isSubmitting}
          {...registerProps}
        />
        <button
          type="button"
          onClick={togglePassword}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer focus:outline-none"
          tabIndex={-1}
        >
          {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 animate-in slide-in-from-top-1 fade-in">
          {error.message}
        </p>
      )}
    </div>
  );

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <InputField
          id="currentPassword"
          label="Contraseña actual"
          type="password"
          showPassword={showCurrentPassword}
          togglePassword={() => setShowCurrentPassword(!showCurrentPassword)}
          registerProps={register('currentPassword')}
          error={errors.currentPassword}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            id="newPassword"
            label="Nueva contraseña"
            type="password"
            showPassword={showNewPassword}
            togglePassword={() => setShowNewPassword(!showNewPassword)}
            registerProps={register('newPassword')}
            error={errors.newPassword}
          />

          <InputField
            id="confirmPassword"
            label="Confirmar nueva contraseña"
            type="password"
            showPassword={showConfirmPassword}
            togglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
            registerProps={register('confirmPassword')}
            error={errors.confirmPassword}
          />
        </div>

        <div className="pt-2 flex justify-end">
          <Button 
            type="submit" 
            variant="secondary" 
            disabled={loading || isSubmitting}
            className="w-full sm:w-auto"
          >
            {(loading || isSubmitting) ? 'Guardando...' : 'Actualizar contraseña'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordForm;
