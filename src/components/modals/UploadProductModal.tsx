import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Product } from '../../types/product';
import './UploadProductModal.css';
import { useUploadProduct } from '../../hooks/useUploadProduct.ts';
import { useEditProduct } from '../../hooks/useEditProduct';
import { useNotifications } from '../../hooks/useNotifications';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

const uploadProductSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  price: z.number().or(z.undefined()).refine((val) => val !== undefined && val > 0, {
    message: 'El precio debe ser mayor a 0',
  }),
  existingImages: z.array(z.string()).optional(),
  images: z.array(z.instanceof(File)),
  tags: z.array(z.string()).min(1, 'Debes agregar al menos una etiqueta'),
  sizes: z.array(z.string()).min(1, 'Debes agregar al menos una talla'),
}).refine((data) => data.price !== undefined, {
  message: 'El precio es requerido',
  path: ['price'],
}).refine((data) => (data.existingImages?.length || 0) + data.images.length >= 1, {
  message: 'Debes tener al menos una imagen',
  path: ['images'],
}).refine((data) => (data.existingImages?.length || 0) + data.images.length <= 5, {
  message: 'Máximo 5 imágenes en total',
  path: ['images'],
});

type UploadProductFormData = z.infer<typeof uploadProductSchema>;

interface UploadProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  productToEdit?: Product;
}

export const UploadProductModal: React.FC<UploadProductModalProps> = ({ 
  isOpen, 
  onClose,
  onSuccess,
  productToEdit
}) => {
  const isEditMode = !!productToEdit;
  const [allImagePreviews, setAllImagePreviews] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const previousImagesRef = useRef<{ existing: string[], new: File[] }>({ existing: [], new: [] });
  
  const { 
    uploadProduct, 
    loading: uploadLoading, 
    error: uploadError, 
    existingTags,
    loadExistingTags 
  } = useUploadProduct();

  const { 
    editProduct, 
    loading: editLoading 
  } = useEditProduct();

  const notifications = useNotifications();
  const loading = isEditMode ? editLoading : uploadLoading;
  const error = uploadError;

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
      name: productToEdit?.name || '',
      description: productToEdit?.description || '',
      price: productToEdit?.price || undefined,
      existingImages: productToEdit?.image_urls || [],
      images: [],
      tags: productToEdit?.tags || [],
      sizes: productToEdit?.sizes || [],
    },
  });

  const watchedImages = useWatch({ control, name: 'images' });
  const watchedExistingImages = useWatch({ control, name: 'existingImages' });
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
      // Limpiar previsualizaciones de nuevas imágenes
      allImagePreviews.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      setAllImagePreviews([]);
      setImagesToDelete([]);
      reset({
        name: productToEdit?.name || '',
        description: productToEdit?.description || '',
        price: productToEdit?.price || undefined,
        existingImages: productToEdit?.image_urls || [],
        images: [],
        tags: productToEdit?.tags || [],
        sizes: productToEdit?.sizes || [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Generar previsualizaciones combinando imágenes existentes y nuevas
  useEffect(() => {
    const currentExisting = watchedExistingImages || [];
    const currentNew = watchedImages || [];
    
    const hasChanged = 
      currentExisting.length !== previousImagesRef.current.existing.length ||
      currentNew.length !== previousImagesRef.current.new.length ||
      currentExisting.some((img, index) => img !== previousImagesRef.current.existing[index]) ||
      currentNew.some((file, index) => file !== previousImagesRef.current.new[index]);
    
    if (!hasChanged) return;
    
    previousImagesRef.current = { existing: currentExisting, new: currentNew };
    
    // Combinar URLs existentes con previsualizaciones de nuevas imágenes
    const existingUrls = currentExisting;
    const newUrls = currentNew.map(file => URL.createObjectURL(file));
    
    setAllImagePreviews([...existingUrls, ...newUrls]);
  }, [watchedExistingImages, watchedImages]);

  // Forzar carga inicial de imágenes cuando se abre el modal con producto a editar
  useEffect(() => {
    if (isOpen && isEditMode && productToEdit && productToEdit.image_urls.length > 0) {
      // Inicializar previsualizaciones con las imágenes existentes
      setAllImagePreviews([...productToEdit.image_urls]);
      previousImagesRef.current = { 
        existing: [...productToEdit.image_urls], 
        new: [] 
      };
    }
  }, [isOpen, isEditMode, productToEdit]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    const currentTotal = (watchedExistingImages?.length || 0) + (watchedImages?.length || 0);

    Array.from(files).forEach(file => {
      if (currentTotal + validFiles.length >= 5) {
        errors.push('Máximo 5 imágenes en total');
        return;
      }
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
      if (notifications) {
        notifications.error(errors.join('\n'));
      } else {
        alert('Errores en las imágenes:\n' + errors.join('\n'));
      }
    }

    const currentImages = watchedImages || [];
    const newImages = [...currentImages, ...validFiles];
    setValue('images', newImages);
  };

  const removeImage = (index: number) => {
    const existingCount = watchedExistingImages?.length || 0;
    
    if (index < existingCount) {
      // Es una imagen existente (solo en modo edición)
      const currentExisting = watchedExistingImages || [];
      const imageToDelete = currentExisting[index];
      setValue('existingImages', currentExisting.filter((_, i) => i !== index));
      setImagesToDelete(prev => [...prev, imageToDelete]);
    } else {
      // Es una imagen nueva
      const newIndex = index - existingCount;
      const currentImages = watchedImages || [];
      setValue('images', currentImages.filter((_, i) => i !== newIndex));
    }
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
      if (isEditMode && productToEdit) {
        // Modo edición
        const result = await editProduct(productToEdit.product_id, {
          name: data.name,
          description: data.description,
          price: data.price!,
          tags: data.tags,
          sizes: data.sizes,
          imagesToDelete,
          existingImages: data.existingImages || [],
          newImages: data.images,
        });

        if (result.success) {
          notifications.success('Producto actualizado correctamente');
          onSuccess?.();
          onClose();
        } else {
          notifications.error(result.error || 'Error al actualizar producto');
        }
      } else {
        // Modo crear
        await uploadProduct({
          name: data.name,
          description: data.description,
          price: data.price!,
          images: data.images,
          tags: data.tags,
          sizes: data.sizes,
        });
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error('Error uploading/editing product:', err);
      if (notifications) {
        notifications.error('Error inesperado al guardar producto');
      }
    }
  };

  if (!isOpen) return null;

  const totalImages = (watchedExistingImages?.length || 0) + (watchedImages?.length || 0);

  return (
    <div className="upload-modal-overlay" onMouseDown={handleOverlayClick}>
      <div className="upload-modal" onMouseDown={handleModalMouseDown}>
        <div className="upload-modal__header">
          <h2 className="upload-modal__title">
            {isEditMode ? 'Editar Producto' : 'Subir Nuevo Producto'}
          </h2>
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
              disabled={totalImages >= 5}
            />
            {errors.images && (
              <span className="upload-modal__error">{errors.images.message}</span>
            )}
            {errors.existingImages && (
              <span className="upload-modal__error">{errors.existingImages.message}</span>
            )}
            
            {allImagePreviews.length > 0 && (
              <div className="upload-modal__image-previews">
                {allImagePreviews.map((preview, index) => (
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
            <div className={`upload-modal__tag-input-wrapper ${showTagSuggestions && filteredTagSuggestions.length > 0 ? 'is-open' : ''}`}>
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
              {loading 
                ? (isEditMode ? 'Guardando...' : 'Subiendo...') 
                : (isEditMode ? 'Guardar Cambios' : 'Subir Producto')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
