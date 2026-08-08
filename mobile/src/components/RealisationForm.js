import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AlertBox, Button, Field, SelectField, TextField } from './ui';
import { useUploadMediaMutation } from '../features/artisans/artisans.api';
import { PRICE_UNITS, errorMessage, mediaUrl } from '../lib/format';
import { colors, radius, spacing, typography } from '../lib/theme';

const MAX_PHOTOS = 10;

/**
 * Sélection d'une photo depuis l'appareil, puis envoi.
 * L'appareil photo passe avant la galerie : l'artisan photographie ce qu'il
 * vient de terminer, il ne va pas chercher un fichier.
 */
export async function pickAndUpload(uploadMedia, { fromCamera = false } = {}) {
  const permission = fromCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error(
      fromCamera
        ? "Autorisez l'appareil photo pour prendre une photo."
        : "Autorisez l'accès aux photos pour en choisir une."
    );
  }

  const options = {
    // SDK 57 : MediaTypeOptions est déprécié, le tableau de chaînes le remplace.
    mediaTypes: ['images'],
    // Les forfaits data sont chers ici : on compresse avant d'envoyer.
    quality: 0.7,
    allowsEditing: true,
  };
  const result = fromCamera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return uploadMedia({
    uri: asset.uri,
    name: asset.fileName || `photo-${Date.now()}.jpg`,
    type: asset.mimeType || 'image/jpeg',
  }).unwrap();
}

/**
 * Formulaire d'une réalisation — le même pour tous les métiers.
 * Une coiffure, une robe, une table ou un shooting se décrivent pareil :
 * une photo, un nom, ce que c'est, combien ça coûte, combien de temps.
 */
export function RealisationForm({ onSubmit, submitting, submitLabel = 'Publier', onSkip }) {
  const [uploadMedia, { isLoading: uploading }] = useUploadMediaMutation();

  const [photos, setPhotos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('forfait');
  const [duration, setDuration] = useState('');
  const [error, setError] = useState(null);

  const addPhoto = async (fromCamera) => {
    setError(null);
    if (photos.length >= MAX_PHOTOS) {
      return setError(`${MAX_PHOTOS} photos au maximum.`);
    }
    try {
      const media = await pickAndUpload(uploadMedia, { fromCamera });
      if (media) setPhotos((current) => [...current, { id: media.id, url: media.url }]);
    } catch (uploadError) {
      setError(errorMessage(uploadError, "L'envoi de la photo a échoué."));
    }
  };

  const submit = async () => {
    setError(null);
    if (title.trim().length < 3) {
      return setError('Donnez un nom à votre réalisation (3 caractères minimum).');
    }
    if (photos.length === 0) {
      return setError('Ajoutez au moins une photo : c’est ce que le client regarde en premier.');
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        // Prix laissé vide = « sur devis ». On n'envoie pas 0, qui voudrait
        // dire gratuit.
        ...(price.trim() ? { price: Number(price.replace(/\s/g, '')) } : {}),
        priceUnit,
        ...(duration.trim() ? { durationMin: Number(duration) } : {}),
        media: photos.map((photo) => photo.id),
      });
      setPhotos([]);
      setTitle('');
      setDescription('');
      setPrice('');
      setDuration('');
    } catch (submitError) {
      setError(errorMessage(submitError, "La réalisation n'a pas pu être publiée."));
    }
  };

  return (
    <View>
      {error ? <AlertBox>{error}</AlertBox> : null}

      <View style={styles.photos}>
        {photos.map((photo) => (
          <View key={photo.id} style={styles.thumbWrap}>
            <Image source={{ uri: mediaUrl(photo.url) }} style={styles.thumb} />
            <Pressable
              onPress={() => setPhotos((current) => current.filter((p) => p.id !== photo.id))}
              style={styles.thumbRemove}
              accessibilityLabel="Retirer cette photo"
            >
              <Text style={styles.thumbRemoveText}>✕</Text>
            </Pressable>
          </View>
        ))}
        {photos.length < MAX_PHOTOS ? (
          <Pressable
            onPress={() => addPhoto(true)}
            style={styles.addTile}
            accessibilityLabel="Prendre une photo"
          >
            <Text style={styles.addTileIcon}>{uploading ? '…' : '📷'}</Text>
            <Text style={styles.addTileText}>Photo</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable onPress={() => addPhoto(false)} style={styles.libraryLink}>
        <Text style={styles.link}>Choisir dans mes images</Text>
      </Pressable>

      <Field label="Nom de la réalisation">
        <TextField
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          placeholder="Braids Butterfly, Table en bois massif…"
        />
      </Field>

      <Field label="Description" hint="Matériaux, finitions, ce qui est compris.">
        <TextField
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={2000}
        />
      </Field>

      <Field label="Prix (FCFA)" hint="Facultatif — laissez vide pour « sur devis ».">
        <TextField value={price} onChangeText={setPrice} keyboardType="number-pad" />
      </Field>

      <SelectField
        label="Unité"
        value={priceUnit}
        onChange={setPriceUnit}
        options={Object.entries(PRICE_UNITS).map(([value, label]) => ({ value, label }))}
      />

      <Field label="Durée de réalisation (minutes)" hint="Facultatif.">
        <TextField value={duration} onChangeText={setDuration} keyboardType="number-pad" />
      </Field>

      <Button label={submitLabel} loading={submitting || uploading} onPress={submit} />

      {onSkip ? (
        <Pressable onPress={onSkip} style={styles.skip}>
          <Text style={styles.skipText}>Plus tard</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const TILE = 88;

const styles = StyleSheet.create({
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  thumbWrap: { width: TILE, height: TILE },
  thumb: { width: TILE, height: TILE, borderRadius: radius.md, backgroundColor: colors.surface },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemoveText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  addTile: {
    width: TILE,
    height: TILE,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  addTileIcon: { fontSize: 22 },
  addTileText: { ...typography.small, fontWeight: '600' },
  libraryLink: { alignSelf: 'flex-start', paddingVertical: spacing.xs, marginBottom: spacing.sm },
  link: { color: colors.brand, fontWeight: '700' },
  skip: { alignSelf: 'center', paddingVertical: spacing.md },
  skipText: { color: colors.textMuted, fontWeight: '600' },
});
