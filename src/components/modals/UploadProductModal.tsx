import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import './UploadProductModal.css';
import { useUploadProduct } from '../../hooks/useUploadProduct.ts';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

const uploadProductSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  price: z.number().or(z.undefined()).refine((val) => val !== undefined && val > 0, {
    message: 'El precio debe ser mayor a 0',
  }),
  images: z
    .array(z.instanceof(File))
    .min(1, 'Debes subir al menos una imagen')
    .max(5, 'Máximo 5 imágenes'),
  tags: z.array(z.string()).min(1, 'Debes agregar al menos una etiqueta'),
  sizes: z.array(z.string()).min(1, 'Debes agregar al menos una talla'),
}).refine((data) => data.price !== undefined, {
  message: 'El precio es requerido',
  path: ['price'],
});

type UploadProductFormData = z.infer<typeof uploadProductSchema>;

interface UploadProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UploadProductModal: React.FC<UploadProductModalProps> = ({ 
  isOpen, 
  onClose,
  onSuccess
}) => {
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const previousImagesRef = useRef<File[]>([]);
  
  const { 
    uploadProduct, 
    loading, 
    error, 
    existingTags,
    loadExistingTags 
  } = useUploadProduct();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<UploadProductFormData>({
    resolver: zodResolver(uploadProductSchema),
    defaultValues: {
      name: '',
      description: '',
      price: undefined,
      images: [],
      tags: [],
      sizes: [],
    },
  });

  const watchedImages = useWatch({ control, name: 'images' });
  const watchedTags = useWatch({ control, name: 'tags' });
  const watchedSizes = useWatch({ control, name: 'sizes' });

  useEffect(() => {
    if (isOpen) {
      loadExistingTags();
      // Bloquear scroll del body
      document.body.classList.add('modal-open');
    } else {
      // Restaurar scroll del body
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup al desmontar
    return () => {
      document.body.classList.remove('modal-open');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Limpiar previsualizaciones cuando el modal se cierra
  useEffect(() => {
    if (!isOpen) {
      setImagePreviews(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return [];
      });
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Generar previsualizaciones de imágenes solo cuando realmente cambian los archivos
  useEffect(() => {
    const currentImages = watchedImages || [];
    const previousImages = previousImagesRef.current;
    
    // Verificar si los archivos realmente cambiaron
    const hasChanged = 
      currentImages.length !== previousImages.length ||
      currentImages.some((file, index) => file !== previousImages[index]);
    
    if (!hasChanged) {
      return;
    }
    
    // Actualizar la referencia
    previousImagesRef.current = currentImages;
    
    if (currentImages.length > 0) {
      setImagePreviews(prev => {
        // Limpiar URLs anteriores
        prev.forEach(url => URL.revokeObjectURL(url));
        
        // Crear nuevas previews
        return currentImages.map(file => URL.createObjectURL(file));
      });
    } else {
      setImagePreviews(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return [];
      });
    }
  }, [watchedImages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Formato no válido`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Tamaño máximo 5MB`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert('Errores en las imágenes:\n' + errors.join('\n'));
    }

    const currentImages = watchedImages || [];
    const newImages = [...currentImages, ...validFiles].slice(0, 5);
    setValue('images', newImages);
  };

  const removeImage = (index: number) => {
    const currentImages = watchedImages || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    setValue('images', newImages);
    
    // Limpiar URL de previsualización
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;

    const currentTags = watchedTags || [];
    if (!currentTags.includes(trimmedTag)) {
      setValue('tags', [...currentTags, trimmedTag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = watchedTags || [];
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const handleAddSize = () => {
    const trimmedSize = sizeInput.trim().toUpperCase();
    if (!trimmedSize) return;

    const currentSizes = watchedSizes || [];
    if (!currentSizes.includes(trimmedSize)) {
      setValue('sizes', [...currentSizes, trimmedSize]);
    }
    setSizeInput('');
  };

  const handleSizeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSize();
    }
  };

  const removeSize = (sizeToRemove: string) => {
    const currentSizes = watchedSizes || [];
    setValue('sizes', currentSizes.filter(size => size !== sizeToRemove));
  };

  const filteredTagSuggestions = useMemo(() => {
    return existingTags.filter(
      (tag: string) => 
        tag.toLowerCase().includes(tagInput.toLowerCase()) &&
        !watchedTags?.includes(tag)
    );
  }, [existingTags, tagInput, watchedTags]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Solo cerrar si el click empezó y terminó en el overlay
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevenir propagación para que no se active el click del overlay
    e.stopPropagation();
  };

  const onSubmit = async (data: UploadProductFormData) => {
    try {
      await uploadProduct({
        ...data,
        price: data.price!
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error uploading product:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="upload-modal-overlay" onMouseDown={handleOverlayClick}>
      <div className="upload-modal" onMouseDown={handleModalMouseDown}>
        <div className="upload-modal__header">
          <h2 className="upload-modal__title">Subir Nuevo Producto</h2>
          <button 
            className="upload-modal__close"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <form className="upload-modal__form" onSubmit={handleSubmit(onSubmit)}>
          {/* Nombre del producto */}
          <div className="upload-modal__field">
            <label htmlFor="name" className="upload-modal__label">
              Nombre del Producto *
            </label>
            <input
              id="name"
              type="text"
              className="upload-modal__input"
              {...register('name')}
              placeholder="Ej: Camiseta básica blanca"
            />
            {errors.name && (
              <span className="upload-modal__error">{errors.name.message}</span>
            )}
          </div>

          {/* Descripción */}
          <div className="upload-modal__field">
            <label htmlFor="description" className="upload-modal__label">
              Descripción *
            </label>
            <textarea
              id="description"
              className="upload-modal__textarea"
              {...register('description')}
              placeholder="Describe el producto..."
              rows={4}
            />
            {errors.description && (
              <span className="upload-modal__error">{errors.description.message}</span>
            )}
          </div>

          {/* Precio */}
          <div className="upload-modal__field">
            <label htmlFor="price" className="upload-modal__label">
              Precio *
            </label>
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <input
                  id="price"
                  type="number"
                  step="1"
                  min="0"
                  className="upload-modal__input"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      field.onChange(undefined);
                    } else {
                      const numValue = Number(value);
                      field.onChange(isNaN(numValue) ? undefined : numValue);
                    }
                  }}
                  placeholder="0"
                />
              )}
            />
            {errors.price && (
              <span className="upload-modal__error">{errors.price.message}</span>
            )}
          </div>

          {/* Imágenes */}
          <div className="upload-modal__field">
            <label htmlFor="images" className="upload-modal__label">
              Imágenes * (Máximo 5, formato: JPG, PNG, WebP, GIF)
            </label>
            <input
              id="images"
              type="file"
              multiple
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              className="upload-modal__file-input"
              onChange={handleImageChange}
            />
            {errors.images && (
              <span className="upload-modal__error">{errors.images.message}</span>
            )}
            
            {imagePreviews.length > 0 && (
              <div className="upload-modal__image-previews">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="upload-modal__image-preview">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="upload-modal__image-remove"
                      onClick={() => removeImage(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="upload-modal__field">
            <label htmlFor="tags" className="upload-modal__label">
              Etiquetas/Categorías *
            </label>
            <div className="upload-modal__tag-input-wrapper">
              <input
                id="tags"
                type="text"
                className="upload-modal__input"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setShowTagSuggestions(true);
                }}
                onKeyDown={handleTagInputKeyDown}
                onFocus={() => setShowTagSuggestions(true)}
                placeholder="Escribe y presiona Enter..."
              />
              <button
                type="button"
                className="upload-modal__add-btn"
                onClick={() => handleAddTag(tagInput)}
              >
                Agregar
              </button>
              
              {/* Sugerencias de tags existentes */}
              {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                <div className="upload-modal__suggestions">
                  {filteredTagSuggestions.map((tag: string) => (
                    <button
                      key={tag}
                      type="button"
                      className="upload-modal__suggestion"
                      onClick={() => handleAddTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {errors.tags && (
              <span className="upload-modal__error">{errors.tags.message}</span>
            )}
            
            {watchedTags && watchedTags.length > 0 && (
              <div className="upload-modal__chips">
                {watchedTags.map((tag) => (
                  <span key={tag} className="upload-modal__chip">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="upload-modal__chip-remove"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Tallas */}
          <div className="upload-modal__field">
            <label htmlFor="sizes" className="upload-modal__label">
              Tallas Disponibles *
            </label>
            <div className="upload-modal__tag-input-wrapper">
              <input
                id="sizes"
                type="text"
                className="upload-modal__input"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={handleSizeInputKeyDown}
                placeholder="Ej: S, M, L, XL..."
              />
              <button
                type="button"
                className="upload-modal__add-btn"
                onClick={handleAddSize}
              >
                Agregar
              </button>
            </div>
            
            {errors.sizes && (
              <span className="upload-modal__error">{errors.sizes.message}</span>
            )}
            
            {watchedSizes && watchedSizes.length > 0 && (
              <div className="upload-modal__chips">
                {watchedSizes.map((size) => (
                  <span key={size} className="upload-modal__chip">
                    {size}
                    <button
                      type="button"
                      onClick={() => removeSize(size)}
                      className="upload-modal__chip-remove"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Error general */}
          {error && (
            <div className="upload-modal__error-box">
              {error}
            </div>
          )}

          {/* Botones de acción */}
          <div className="upload-modal__actions">
            <button
              type="button"
              className="upload-modal__btn upload-modal__btn--cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="upload-modal__btn upload-modal__btn--submit"
              disabled={loading}
            >
              {loading ? 'Subiendo...' : 'Subir Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
