import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertBox, Button, Field, TextField } from '../src/components/ui';
import { pickAndUpload } from '../src/components/RealisationForm';
import {
  useGetMyArtisanQuery,
  useUpdateMyProfileMutation,
  useUploadMediaMutation,
} from '../src/features/artisans/artisans.api';
import { selectUser } from '../src/features/auth/authSlice';
import { errorMessage, mediaUrl } from '../src/lib/format';
import { colors, radius, spacing, typography } from '../src/lib/theme';

/**
 * Étape 1 de la configuration guidée, juste après l'inscription.
 *
 * Rien n'est bloquant : l'artisan peut passer et revenir. Mais on lui demande
 * ici, tant qu'il est disponible, ce qui rend sa fiche présentable — une fiche
 * vide ne convainc personne et ne sera pas validée.
 */
export default function WelcomeArtisanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useSelector(selectUser);

  const { data } = useGetMyArtisanQuery(undefined, { skip: user?.role !== 'artisan' });
  const [updateProfile, { isLoading: saving }] = useUpdateMyProfileMutation();
  const [uploadMedia, { isLoading: uploading }] = useUploadMediaMutation();

  const [profilePhoto, setProfilePhoto] = useState('');
  const [coverPhoto, setCoverPhoto] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState(null);

  const artisan = data?.artisan;
  const photo = profilePhoto || artisan?.profilePhoto;
  const cover = coverPhoto || artisan?.coverPhoto;

  const addPhoto = async (setter) => {
    setError(null);
    try {
      const media = await pickAndUpload(uploadMedia);
      if (media) setter(media.url);
    } catch (uploadError) {
      setError(errorMessage(uploadError, "L'envoi de la photo a échoué."));
    }
  };

  const goNext = () => router.replace('/premiere-realisation');

  const submit = async () => {
    setError(null);
    const patch = {};
    if (profilePhoto) patch.profilePhoto = profilePhoto;
    if (coverPhoto) patch.coverPhoto = coverPhoto;
    if (tagline.trim()) patch.tagline = tagline.trim();
    if (bio.trim()) patch.bio = bio.trim();

    // Rien à envoyer : inutile d'appeler l'API pour passer à la suite.
    if (Object.keys(patch).length === 0) return goNext();

    try {
      await updateProfile(patch).unwrap();
      goNext();
    } catch (saveError) {
      setError(errorMessage(saveError, "L'enregistrement a échoué."));
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.step}>ÉTAPE 1 SUR 2</Text>
      <Text style={typography.heading}>Votre profil professionnel</Text>
      <Text style={[typography.muted, { marginTop: spacing.xs }]}>
        C'est ce que le client voit avant de vous contacter. Deux minutes suffisent.
      </Text>

      {error ? <AlertBox>{error}</AlertBox> : null}

      <View style={styles.card}>
        <Text style={styles.label}>Photo de profil</Text>
        <Text style={typography.small}>Votre visage ou votre logo.</Text>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            {photo ? (
              <Image source={{ uri: mediaUrl(photo) }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarPlaceholder}>👤</Text>
            )}
          </View>
          <Button
            label={photo ? 'Remplacer' : 'Ajouter'}
            variant="secondary"
            loading={uploading}
            onPress={() => addPhoto(setProfilePhoto)}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Photo de couverture</Text>
        <Text style={typography.small}>L'image large en haut de votre fiche.</Text>
        <View style={styles.cover}>
          {cover ? (
            <Image source={{ uri: mediaUrl(cover) }} style={styles.coverImg} />
          ) : (
            <Text style={typography.small}>Aucune image</Text>
          )}
        </View>
        <Button
          label={cover ? 'Remplacer' : 'Ajouter'}
          variant="secondary"
          loading={uploading}
          onPress={() => addPhoto(setCoverPhoto)}
          style={{ marginTop: spacing.sm }}
        />
      </View>

      <View style={styles.card}>
        <Field label="Accroche" hint="Une phrase, celle qui donne envie de vous appeler.">
          <TextField
            value={tagline}
            onChangeText={setTagline}
            maxLength={120}
            placeholder="Menuisier ébéniste depuis 12 ans à Cotonou"
          />
        </Field>
        <Field label="Présentation" hint={`${bio.length}/2000 caractères`}>
          <TextField
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={2000}
            placeholder="Votre parcours, vos spécialités, votre façon de travailler…"
          />
        </Field>
      </View>

      <Button label="Continuer" loading={saving} onPress={submit} />

      <Pressable onPress={goNext} style={styles.skip}>
        <Text style={styles.skipText}>Passer cette étape</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  step: { ...typography.small, fontWeight: '800', color: colors.brand, letterSpacing: 1 },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  label: { ...typography.body, fontWeight: '700' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { fontSize: 30 },
  cover: {
    height: 110,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  coverImg: { width: '100%', height: '100%' },
  skip: { alignSelf: 'center', paddingVertical: spacing.md },
  skipText: { color: colors.textMuted, fontWeight: '600' },
});
