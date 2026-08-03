import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertBox,
  Badge,
  Button,
  Field,
  LoadingView,
  ScreenHeader,
  SelectField,
  TextField,
} from '../src/components/ui';
import {
  useAddGalleryMediaMutation,
  useCreateMyServiceMutation,
  useGetMyArtisanQuery,
  useListMyServicesQuery,
  useUpdateMyProfileMutation,
  useUploadMediaMutation,
} from '../src/features/artisans/artisans.api';
import { selectUser } from '../src/features/auth/authSlice';
import { PRICE_UNITS, errorMessage, formatPrice, mediaUrl } from '../src/lib/format';
import { colors, radius, spacing, typography } from '../src/lib/theme';

async function pickAndUpload(uploadMedia) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Autorisez l'accès aux photos pour ajouter une image.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? ['images'],
    quality: 0.85,
    allowsEditing: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const name = asset.fileName || `photo-${Date.now()}.jpg`;
  const type = asset.mimeType || 'image/jpeg';

  return uploadMedia({
    uri: asset.uri,
    name,
    type,
  }).unwrap();
}

function StatusBanner({ artisan, user }) {
  if (user?.email && !user.isEmailVerified) {
    return (
      <AlertBox tone="amber">
        Confirmez votre adresse e-mail pour pouvoir réinitialiser votre mot de passe en cas d'oubli.
      </AlertBox>
    );
  }
  if (artisan.status === 'rejected') {
    return (
      <AlertBox>
        Votre fiche a été refusée.
        {artisan.rejectionReason ? ` ${artisan.rejectionReason}` : ''} Corrigez les points
        signalés, elle sera réexaminée.
      </AlertBox>
    );
  }
  if (artisan.status === 'suspended') {
    return <AlertBox>Votre fiche est suspendue. Contactez le support pour en savoir plus.</AlertBox>;
  }
  if (artisan.status === 'pending') {
    return (
      <AlertBox tone="amber">
        Votre fiche est en attente de validation. Plus elle est complète, plus la validation est
        rapide.
      </AlertBox>
    );
  }
  return <AlertBox tone="green">Votre fiche est publiée et visible par les clients.</AlertBox>;
}

function ChecklistItem({ done, optional, title, description, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.checkHead}>
        <View style={[styles.checkDot, done && styles.checkDotOn]}>
          <Text style={styles.checkMark}>{done ? '✓' : ''}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{title}</Text>
            {optional ? <Badge label="Facultatif" tone="slate" /> : null}
          </View>
          {description ? <Text style={typography.small}>{description}</Text> : null}
        </View>
      </View>
      <View style={{ marginTop: spacing.md }}>{children}</View>
    </View>
  );
}

function ImageUploader({ label, currentUrl, onUploaded }) {
  const [uploadMedia, { isLoading }] = useUploadMediaMutation();
  const [error, setError] = useState(null);
  const preview = mediaUrl(currentUrl);

  const handle = async () => {
    setError(null);
    try {
      const media = await pickAndUpload(uploadMedia);
      if (media) await onUploaded(media.url, media);
    } catch (uploadError) {
      setError(errorMessage(uploadError, "L'envoi a échoué."));
    }
  };

  return (
    <View>
      <View style={styles.preview}>
        {preview ? (
          <Image source={{ uri: preview }} style={styles.previewImg} />
        ) : (
          <Text style={typography.small}>Aucune image</Text>
        )}
      </View>
      <Button
        label={preview ? 'Remplacer' : label}
        variant="secondary"
        loading={isLoading}
        onPress={handle}
        style={{ marginTop: spacing.sm }}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function PresentationForm({ artisan, onSave, saving }) {
  const [bio, setBio] = useState(artisan.bio ?? '');
  const [tagline, setTagline] = useState(artisan.tagline ?? '');
  const [years, setYears] = useState(String(artisan.yearsExperience ?? 0));
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    setSaved(false);
    await onSave({ bio, tagline, yearsExperience: Number(years) || 0 });
    setSaved(true);
  };

  return (
    <View>
      <Field label="Accroche" hint="Une phrase courte affichée sous votre nom.">
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
          maxLength={2000}
          multiline
          placeholder="Décrivez votre parcours, vos spécialités…"
        />
      </Field>
      <Field label="Années d'expérience">
        <TextField
          value={years}
          onChangeText={setYears}
          keyboardType="number-pad"
        />
      </Field>
      <Button label="Enregistrer" loading={saving} onPress={submit} />
      {saved ? <Text style={styles.saved}>Enregistré</Text> : null}
    </View>
  );
}

function FirstServiceForm() {
  const { data: services } = useListMyServicesQuery();
  const [createService, { isLoading }] = useCreateMyServiceMutation();
  const [form, setForm] = useState({ title: '', description: '', price: '', priceUnit: 'forfait' });
  const [error, setError] = useState(null);

  const list = services ?? [];

  const submit = async () => {
    setError(null);
    if (!form.title.trim() || form.title.trim().length < 3) {
      return setError('Intitulé trop court (3 caractères min.).');
    }
    try {
      await createService({
        title: form.title.trim(),
        description: form.description,
        price: Number(form.price),
        priceUnit: form.priceUnit,
      }).unwrap();
      setForm({ title: '', description: '', price: '', priceUnit: 'forfait' });
    } catch (createError) {
      setError(errorMessage(createError, "La prestation n'a pas pu être créée."));
    }
  };

  return (
    <View>
      {list.map((service) => (
        <View key={service._id} style={styles.serviceRow}>
          <Text style={styles.serviceTitle}>{service.title}</Text>
          <Text style={typography.small}>
            {formatPrice(service.price)} {PRICE_UNITS[service.priceUnit] ?? ''}
          </Text>
        </View>
      ))}

      {error ? <AlertBox>{error}</AlertBox> : null}

      <Field label="Intitulé">
        <TextField
          value={form.title}
          onChangeText={(title) => setForm({ ...form, title })}
          placeholder="Pose de carrelage"
          maxLength={100}
        />
      </Field>
      <Field label="Description">
        <TextField
          value={form.description}
          onChangeText={(description) => setForm({ ...form, description })}
          multiline
          maxLength={2000}
        />
      </Field>
      <Field label="Prix (FCFA)">
        <TextField
          value={form.price}
          onChangeText={(price) => setForm({ ...form, price })}
          keyboardType="number-pad"
        />
      </Field>
      <SelectField
        label="Unité"
        value={form.priceUnit}
        onChange={(priceUnit) => setForm({ ...form, priceUnit })}
        options={Object.entries(PRICE_UNITS).map(([value, label]) => ({ value, label }))}
      />
      <Button label="Ajouter cette prestation" variant="secondary" loading={isLoading} onPress={submit} />
    </View>
  );
}

export default function ArtisanSpaceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useSelector(selectUser);

  const { data, isLoading, isError, error } = useGetMyArtisanQuery(undefined, {
    skip: user?.role !== 'artisan',
  });
  const { data: services } = useListMyServicesQuery(undefined, {
    skip: user?.role !== 'artisan',
  });
  const [updateProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation();
  const [addGalleryMedia] = useAddGalleryMediaMutation();

  if (user?.role !== 'artisan') {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <ScreenHeader title="Espace artisan" onBack={() => router.back()} />
        <AlertBox tone="amber">Cet espace est réservé aux comptes artisans.</AlertBox>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <LoadingView label="Chargement de votre fiche…" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <ScreenHeader title="Espace artisan" onBack={() => router.back()} />
        <AlertBox>{errorMessage(error)}</AlertBox>
      </View>
    );
  }

  const artisan = data.artisan;
  const serviceCount = (services ?? []).length;
  const steps = [
    { key: 'photo', done: Boolean(artisan.profilePhoto) },
    { key: 'bio', done: Boolean(artisan.bio?.trim()) },
    { key: 'service', done: serviceCount > 0 },
  ];
  const completed = steps.filter((s) => s.done).length;
  const readyToSubmit = completed === steps.length;
  const isPublished = artisan.status === 'validated';
  const progress = (completed / steps.length) * 100;

  const saveProfile = (patch) => updateProfile(patch).unwrap().catch(() => {});

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        title={artisan.displayName}
        subtitle="Votre espace artisan"
        onBack={() => router.back()}
        right={
          isPublished ? (
            <Pressable onPress={() => router.push(`/artisans/${artisan.artisanId}`)}>
              <Text style={styles.publicLink}>Voir fiche</Text>
            </Pressable>
          ) : null
        }
      />

      <StatusBanner artisan={artisan} user={user} />

      {!isPublished ? (
        <View style={[styles.card, { marginTop: spacing.md }]}>
          <View style={styles.progressHead}>
            <Text style={styles.cardTitle}>Complétez votre fiche</Text>
            <Text style={typography.small}>
              {completed} / {steps.length}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={[typography.small, { marginTop: spacing.sm }]}>
            {readyToSubmit
              ? 'Tout est prêt. Notre équipe examinera votre fiche très prochainement.'
              : 'Une fiche complète est validée plus vite et inspire davantage confiance.'}
          </Text>
        </View>
      ) : null}

      <View style={{ gap: spacing.md, marginTop: spacing.md }}>
        <ChecklistItem
          done={Boolean(artisan.profilePhoto)}
          title="Photo de profil"
          description="Un visage ou votre logo : c'est le premier élément de confiance."
        >
          <ImageUploader
            label="Ajouter une photo"
            currentUrl={artisan.profilePhoto}
            onUploaded={(url) => saveProfile({ profilePhoto: url })}
          />
        </ChecklistItem>

        <ChecklistItem
          done={Boolean(artisan.bio?.trim())}
          title="Présentation"
          description="Expliquez qui vous êtes et ce que vous savez faire."
        >
          <PresentationForm artisan={artisan} onSave={saveProfile} saving={isSaving} />
        </ChecklistItem>

        <ChecklistItem
          done={serviceCount > 0}
          title="Vos prestations"
          description="Annoncez au moins un tarif : les clients filtrent beaucoup par prix."
        >
          <FirstServiceForm />
        </ChecklistItem>

        <ChecklistItem
          done={Boolean(artisan.coverPhoto)}
          optional
          title="Photo de couverture"
          description="Une image large en haut de votre fiche."
        >
          <ImageUploader
            label="Ajouter une couverture"
            currentUrl={artisan.coverPhoto}
            onUploaded={(url) => saveProfile({ coverPhoto: url })}
          />
        </ChecklistItem>

        <ChecklistItem
          done={false}
          optional
          title="Galerie de réalisations"
          description="Vos photos de chantiers convainquent mieux que n'importe quel texte."
        >
          <ImageUploader
            label="Ajouter une réalisation"
            onUploaded={(_url, media) =>
              addGalleryMedia({ mediaId: media?.id, url: media?.url }).unwrap().catch(() => {})
            }
          />
        </ChecklistItem>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  checkHead: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  checkDot: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkDotOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  checkMark: { color: '#fff', fontWeight: '700', fontSize: 12 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  cardTitle: { fontWeight: '700', fontSize: 16, color: colors.text },
  preview: {
    width: 112,
    height: 112,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImg: { width: '100%', height: '100%' },
  error: { ...typography.small, color: colors.danger, marginTop: 6 },
  saved: { ...typography.small, color: colors.brandDark, marginTop: 8, fontWeight: '600' },
  serviceRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  serviceTitle: { fontWeight: '600', color: colors.text },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.brand, borderRadius: radius.full },
  publicLink: { color: colors.brand, fontWeight: '700', fontSize: 13 },
});
