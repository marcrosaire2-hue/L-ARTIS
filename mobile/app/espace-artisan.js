import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  TextField,
} from '../src/components/ui';
import { RealisationForm, pickAndUpload } from '../src/components/RealisationForm';
import {
  useCreateMyServiceMutation,
  useDeleteMyServiceMutation,
  useGetMyArtisanQuery,
  useGetMyStatsQuery,
  useListMyServicesQuery,
  useUpdateMyProfileMutation,
  useUploadMediaMutation,
} from '../src/features/artisans/artisans.api';
import { selectUser } from '../src/features/auth/authSlice';
import { PRICE_UNITS, errorMessage, formatPrice, mediaUrl } from '../src/lib/format';
import { colors, radius, spacing, typography } from '../src/lib/theme';

function StatusBanner({ artisan }) {
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

function ImageUploader({ label, currentUrl, onUploaded, ratio = 1 }) {
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
      <View style={[styles.preview, { width: 112 * ratio }]}>
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

function LegalForm({ artisan, onSave, saving }) {
  const [rccm, setRccm] = useState(artisan.legal?.rccm ?? '');
  const [ifu, setIfu] = useState(artisan.legal?.ifu ?? '');
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    setSaved(false);
    await onSave({ legal: { rccm: rccm.trim(), ifu: ifu.trim() } });
    setSaved(true);
  };

  return (
    <View>
      <Field label="RCCM" hint="Registre du Commerce et du Crédit Mobilier — facultatif mais recommandé.">
        <TextField value={rccm} onChangeText={setRccm} maxLength={60} placeholder="RB/COT/…" />
      </Field>
      <Field label="IFU" hint="Identifiant Fiscal Unique — facultatif.">
        <TextField value={ifu} onChangeText={setIfu} maxLength={40} placeholder="IFU…" />
      </Field>
      <Button label="Enregistrer" loading={saving} onPress={submit} />
      {saved ? <Text style={styles.saved}>Enregistré</Text> : null}
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
        <TextField value={years} onChangeText={setYears} keyboardType="number-pad" />
      </Field>
      <Button label="Enregistrer" loading={saving} onPress={submit} />
      {saved ? <Text style={styles.saved}>Enregistré</Text> : null}
    </View>
  );
}

/** Liste des réalisations + formulaire d'ajout. */
function Realisations({ items, showForm = true }) {
  const [createService, { isLoading }] = useCreateMyServiceMutation();
  const [deleteService] = useDeleteMyServiceMutation();
  const [confirmId, setConfirmId] = useState(null);

  return (
    <View>
      {items.map((service) => {
        const cover = service.media?.[0]?.url;
        return (
          <View key={service._id} style={styles.realisation}>
            {cover ? (
              <Image source={{ uri: mediaUrl(cover) }} style={styles.realisationImg} />
            ) : (
              <View style={[styles.realisationImg, styles.realisationImgEmpty]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.realisationTitle}>{service.title}</Text>
              <Text style={typography.small}>
                {service.price != null
                  ? `${formatPrice(service.price)} ${PRICE_UNITS[service.priceUnit] ?? ''}`
                  : 'Sur devis'}
                {service.media?.length > 1 ? ` · ${service.media.length} photos` : ''}
              </Text>
              {confirmId === service._id ? (
                <View style={styles.confirmRow}>
                  <Pressable
                    onPress={() => deleteService(service._id).unwrap().catch(() => {})}
                    style={styles.confirmDelete}
                  >
                    <Text style={styles.confirmDeleteText}>Supprimer</Text>
                  </Pressable>
                  <Pressable onPress={() => setConfirmId(null)} style={styles.confirmCancel}>
                    <Text style={styles.confirmCancelText}>Annuler</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => setConfirmId(service._id)}>
                  <Text style={styles.removeLink}>Retirer</Text>
                </Pressable>
              )}
            </View>
          </View>
        );
      })}

      {showForm ? (
        <View style={items.length ? styles.formSpacing : null}>
          <RealisationForm
            submitting={isLoading}
            submitLabel={items.length ? 'Ajouter cette réalisation' : 'Publier ma première réalisation'}
            onSubmit={(body) => createService(body).unwrap()}
          />
        </View>
      ) : null}
    </View>
  );
}

function StatTile({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/**
 * Tableau de bord — affiché seulement quand il y a une activité réelle.
 * Une colonne de zéros le premier jour donne l'impression d'un service mort ;
 * tant que rien ne s'est passé, l'artisan voit sa liste de choses à faire.
 */
function Dashboard({ artisan, stats, services, router, onSave, saving }) {
  return (
    <View>
      <View style={styles.statRow}>
        <StatTile label="Vues du profil" value={stats.views ?? 0} />
        <StatTile label="Réalisations" value={services.length} />
        <StatTile label="Demandes" value={stats.quotes?.total ?? 0} />
        <StatTile label="Avis" value={stats.reviewsCount ?? 0} />
        <StatTile label="Favoris" value={stats.favorites ?? 0} />
        <StatTile
          label="Note"
          value={stats.rating?.count ? `${stats.rating.average}/5` : '—'}
        />
      </View>

      {stats.quotes?.pending > 0 ? (
        <Pressable onPress={() => router.push('/devis')} style={styles.callout}>
          <Text style={styles.calloutTitle}>
            {stats.quotes.pending} demande{stats.quotes.pending > 1 ? 's' : ''} en attente
          </Text>
          <Text style={typography.small}>
            Répondez vite : c'est le premier critère de choix d'un client.
          </Text>
        </Pressable>
      ) : null}

      <View style={[styles.card, { marginTop: spacing.md }]}>
        <Text style={styles.cardTitle}>Mes réalisations</Text>
        <Text style={[typography.small, { marginBottom: spacing.md }]}>
          Chaque nouvelle réalisation vous rend visible sur de nouvelles recherches.
        </Text>
        <Realisations items={services} />
      </View>

      <View style={[styles.card, { marginTop: spacing.md }]}>
        <Text style={styles.cardTitle}>Mon profil</Text>
        <View style={{ marginTop: spacing.md }}>
          <Text style={styles.subLabel}>Photo de profil</Text>
          <ImageUploader
            label="Ajouter une photo"
            currentUrl={artisan.profilePhoto}
            onUploaded={(url) => onSave({ profilePhoto: url })}
          />
        </View>
        <View style={{ marginTop: spacing.lg }}>
          <PresentationForm artisan={artisan} onSave={onSave} saving={saving} />
        </View>
      </View>
    </View>
  );
}

export default function ArtisanSpaceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useSelector(selectUser);
  const isArtisan = user?.role === 'artisan';

  // Filet de sécurité : un artisan arrivé ici sans avoir validé le règlement
  // repart le lire, l'acceptation conditionnant la publication de sa fiche.
  useEffect(() => {
    if (isArtisan && !user.termsAcceptedAt) {
      router.replace({
        pathname: '/reglement',
        params: { accept: '1', audience: 'artisan' },
      });
    }
  }, [isArtisan, user, router]);

  const { data, isLoading, isError, error } = useGetMyArtisanQuery(undefined, { skip: !isArtisan });
  const { data: services } = useListMyServicesQuery(undefined, { skip: !isArtisan });
  const { data: stats } = useGetMyStatsQuery(undefined, { skip: !isArtisan });
  const [updateProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation();

  if (!isArtisan) {
    return (
      <View style={[styles.screen, styles.padded, { paddingTop: insets.top + spacing.md }]}>
        <ScreenHeader title="Espace artisan" onBack={() => router.back()} />
        <AlertBox tone="amber">Cet espace est réservé aux comptes artisans.</AlertBox>
      </View>
    );
  }

  if (!user.termsAcceptedAt) {
    return (
      <View style={[styles.screen, styles.padded, { paddingTop: insets.top + spacing.md }]}>
        <ScreenHeader title="Espace artisan" onBack={() => router.back()} />
        <AlertBox tone="amber">
          Validez d’abord le règlement artisans pour accéder à votre espace.
        </AlertBox>
        <Button
          label="Lire et valider le règlement"
          onPress={() =>
            router.replace({
              pathname: '/reglement',
              params: { audience: 'artisan', accept: '1', email: user.email || '' },
            })
          }
          style={{ marginTop: spacing.md }}
        />
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
      <View style={[styles.screen, styles.padded, { paddingTop: insets.top + spacing.md }]}>
        <ScreenHeader title="Espace artisan" onBack={() => router.back()} />
        <AlertBox>{errorMessage(error)}</AlertBox>
      </View>
    );
  }

  const artisan = data.artisan;
  const list = services ?? [];
  const saveProfile = (patch) => updateProfile(patch).unwrap().catch(() => {});

  const steps = [
    { key: 'photo', done: Boolean(artisan.profilePhoto) },
    { key: 'bio', done: Boolean(artisan.bio?.trim()) },
    { key: 'realisation', done: list.length > 0 },
  ];
  const completed = steps.filter((step) => step.done).length;
  const progress = (completed / steps.length) * 100;
  const isPublished = artisan.status === 'validated';
  const showDashboard = Boolean(stats?.hasActivity);

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
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            {isPublished ? (
              <Pressable onPress={() => router.push(`/artisans/${artisan.artisanId}`)}>
                <Text style={styles.publicLink}>Voir fiche</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => router.push('/abonnement')}>
              <Text style={styles.publicLink}>Abonnement</Text>
            </Pressable>
          </View>
        }
      />

      <StatusBanner artisan={artisan} />

      {showDashboard ? (
        <Dashboard
          artisan={artisan}
          stats={stats}
          services={list}
          router={router}
          onSave={saveProfile}
          saving={isSaving}
        />
      ) : (
        <>
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
              {completed === steps.length
                ? 'Tout est prêt. Notre équipe examinera votre fiche très prochainement.'
                : 'Une fiche complète est validée plus vite et inspire davantage confiance.'}
            </Text>
          </View>

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
              done={list.length > 0}
              title="Vos réalisations"
              description="Une photo, un nom, un prix : c'est ce qui décide le client."
            >
              <Realisations items={list} />
            </ChecklistItem>

            <ChecklistItem
              done={Boolean(artisan.legal?.rccm?.trim() || artisan.legal?.ifu?.trim())}
              optional
              title="Identifiants légaux"
              description="RCCM et IFU renforcent la confiance des clients."
            >
              <LegalForm artisan={artisan} onSave={saveProfile} saving={isSaving} />
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
                ratio={1.6}
                onUploaded={(url) => saveProfile({ coverPhoto: url })}
              />
            </ChecklistItem>
          </View>
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  padded: { paddingHorizontal: spacing.lg },
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
  subLabel: { ...typography.muted, fontWeight: '600', marginBottom: spacing.xs },
  preview: {
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
  realisation: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  realisationImg: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.border },
  realisationImgEmpty: { opacity: 0.5 },
  realisationTitle: { fontWeight: '700', color: colors.text },
  removeLink: { ...typography.small, color: colors.danger, fontWeight: '600', marginTop: 4 },
  confirmRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 6 },
  confirmDelete: {
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  confirmDeleteText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  confirmCancel: { paddingHorizontal: spacing.sm, paddingVertical: 6 },
  confirmCancelText: { ...typography.small, fontWeight: '600' },
  formSpacing: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  stat: {
    flexGrow: 1,
    flexBasis: '30%',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.navy },
  statLabel: { ...typography.small, marginTop: 2 },
  callout: {
    marginTop: spacing.md,
    backgroundColor: colors.brandSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  calloutTitle: { fontWeight: '700', color: colors.brandDark, marginBottom: 2 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
