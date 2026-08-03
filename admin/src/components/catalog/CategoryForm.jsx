import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';
import { useCreateCategoryMutation, useUpdateCategoryMutation } from '../../features/catalog/catalog.api';
import { Button, Field, Input, Modal, Textarea } from '../ui';
import { errorMessage } from '../../lib/format';
import ImageUploadField from './ImageUploadField';

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Au moins 2 caractères').max(60, 'Maximum 60 caractères'),
  description: z.string().trim().max(300, 'Maximum 300 caractères').optional().or(z.literal('')),
  icon: z.string().trim().max(20).optional().or(z.literal('')),
  image: z.string().trim().url('Image invalide').optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().min(0, 'Doit être positif').optional(),
});

export default function CategoryForm({ category, onClose }) {
  const isEdit = Boolean(category);
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
      icon: category?.icon ?? '',
      image: category?.image ?? '',
      sortOrder: category?.sortOrder ?? 0,
    },
  });

  const image = watch('image');

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      // L'API rejette une chaîne vide pour `image` : on envoie `undefined` si absente
      const payload = { ...values, image: values.image || undefined };
      if (isEdit) await updateCategory({ id: category._id, ...payload }).unwrap();
      else await createCategory(payload).unwrap();
      onClose();
    } catch (error) {
      setFormError(errorMessage(error, "L'enregistrement a échoué."));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
      description={isEdit ? category.name : 'Niveau 1 de la hiérarchie du catalogue.'}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Field label="Nom" error={errors.name?.message}>
          <Input placeholder="Maçonnerie" {...register('name')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Icône"
            hint="Une clé d'icône, ex. : hammer, wrench, paintbrush"
            error={errors.icon?.message}
          >
            <Input placeholder="hammer" {...register('icon')} />
          </Field>
          <Field label="Ordre d'affichage" error={errors.sortOrder?.message}>
            <Input type="number" min="0" {...register('sortOrder')} />
          </Field>
        </div>
        <Field label="Description" error={errors.description?.message}>
          <Textarea rows={3} placeholder="Construction et rénovation…" {...register('description')} />
        </Field>

        <ImageUploadField
          label="Image de la catégorie"
          hint="JPG, PNG, WebP ou GIF — laissée vide, l'icône s'affiche"
          value={image}
          onChange={(url) => setValue('image', url, { shouldValidate: true })}
          error={errors.image?.message}
        />

        {formError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {formError}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={isCreating || isUpdating}>
            {isEdit ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
