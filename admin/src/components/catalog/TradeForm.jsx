import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';
import { useCreateTradeMutation, useUpdateTradeMutation } from '../../features/catalog/catalog.api';
import { Button, Field, Input, Modal, Textarea } from '../ui';
import { errorMessage } from '../../lib/format';
import ImageUploadField from './ImageUploadField';

const tradeSchema = z.object({
  name: z.string().trim().min(2, 'Au moins 2 caractères').max(60, 'Maximum 60 caractères'),
  description: z.string().trim().max(300, 'Maximum 300 caractères').optional().or(z.literal('')),
  icon: z.string().trim().max(20).optional().or(z.literal('')),
  image: z.string().trim().url('Image invalide').optional().or(z.literal('')),
});

export default function TradeForm({ trade, category, onClose }) {
  const isEdit = Boolean(trade);
  const [createTrade, { isLoading: isCreating }] = useCreateTradeMutation();
  const [updateTrade, { isLoading: isUpdating }] = useUpdateTradeMutation();
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      name: trade?.name ?? '',
      description: trade?.description ?? '',
      icon: trade?.icon ?? '',
      image: trade?.image ?? '',
    },
  });

  const image = watch('image');

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      // L'API rejette une chaîne vide pour `image` : on envoie `undefined` si absente
      const payload = { ...values, image: values.image || undefined };
      if (isEdit) await updateTrade({ id: trade._id, ...payload }).unwrap();
      else await createTrade({ ...payload, categoryId: category._id }).unwrap();
      onClose();
    } catch (error) {
      setFormError(errorMessage(error, "L'enregistrement a échoué."));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Modifier le métier' : 'Nouveau métier'}
      description={`Catégorie : ${category.name}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Field label="Nom" error={errors.name?.message}>
          <Input placeholder="Carreleur" {...register('name')} />
        </Field>
        <Field label="Icône" hint="Facultatif — une clé d'icône, ex. : hammer, drill" error={errors.icon?.message}>
          <Input placeholder="wrench" {...register('icon')} />
        </Field>
        <Field label="Description" error={errors.description?.message}>
          <Textarea rows={3} {...register('description')} />
        </Field>

        <ImageUploadField
          label="Image du métier"
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
