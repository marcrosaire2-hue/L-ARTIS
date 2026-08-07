import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertBox,
  Button,
  Field,
  TextField,
} from '../../src/components/ui';
import {
  useDeleteAccountMutation,
  useLogoutMutation,
} from '../../src/features/auth/auth.api';
import { selectUser, sessionEnded } from '../../src/features/auth/authSlice';
import { errorMessage, fullName, initials } from '../../src/lib/format';
import { readRefreshToken } from '../../src/lib/secureSession';
import { colors, radius, spacing, typography } from '../../src/lib/theme';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const [logout, { isLoading: loggingOut }] = useLogoutMutation();
  const [deleteAccount, { isLoading: deleting }] = useDeleteAccountMutation();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const onLogout = async () => {
    try {
      const token = await readRefreshToken();
      if (token) await logout(token).unwrap();
    } catch {
      /* le jeton local part déjà dans la mutation */
    } finally {
      dispatch(sessionEnded());
      router.replace('/connexion');
    }
  };

  const onDelete = async () => {
    setError(null);
    if (!password) return setError('Saisissez votre mot de passe pour confirmer.');
    try {
      await deleteAccount(password).unwrap();
      dispatch(sessionEnded());
      router.replace('/connexion');
    } catch (deleteError) {
      setError(errorMessage(deleteError, "La suppression n'a pas abouti."));
    }
  };

  if (!user) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top }]}>
        <Text style={typography.heading}>Mon compte</Text>
        <Text style={[typography.muted, { marginVertical: spacing.md, textAlign: 'center' }]}>
          Connectez-vous pour gérer votre profil.
        </Text>
        <Button label="Se connecter" onPress={() => router.push('/connexion')} />
      </View>
    );
  }

  if (!user.termsAcceptedAt) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top }]}>
        <Text style={typography.heading}>Règlement à valider</Text>
        <Text style={[typography.muted, { marginVertical: spacing.md, textAlign: 'center' }]}>
          Avant d’accéder à votre compte, lisez et validez le règlement{' '}
          {user.role === 'artisan' ? 'artisans' : 'clients'}.
        </Text>
        <Button
          label="Lire et valider"
          onPress={() =>
            router.replace({
              pathname: '/reglement',
              params: {
                audience: user.role === 'artisan' ? 'artisan' : 'client',
                accept: '1',
                email: user.email || '',
              },
            })
          }
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={typography.heading}>Mon compte</Text>

      <View style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{fullName(user)}</Text>
            <Text style={styles.role}>{user.role === 'artisan' ? 'Artisan' : 'Client'}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>E-mail</Text>
          <Text style={styles.rowValue}>{user.email || 'Non renseigné'}</Text>
          {user.email && !user.isEmailVerified ? (
            <Text style={styles.warn}>Non vérifiée</Text>
          ) : null}
        </View>
        {user.phone ? (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Téléphone</Text>
            <Text style={styles.rowValue}>{user.phone}</Text>
          </View>
        ) : null}

        {user.email && !user.isEmailVerified ? (
          <>
            <AlertBox tone="amber">
              Un code a été envoyé à votre e-mail. Saisissez-le pour vérifier votre adresse.
            </AlertBox>
            <Button
              label="Saisir le code"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/verification-email',
                  params: { email: user.email },
                })
              }
            />
          </>
        ) : null}
      </View>

      <View style={styles.menu}>
        <Pressable
          onPress={() => router.push('/notifications')}
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.92 }]}
        >
          <Text style={styles.linkTitle}>Notifications</Text>
          <Text style={styles.chevron}>→</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/devis')}
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.92 }]}
        >
          <Text style={styles.linkTitle}>{user.role === 'artisan' ? 'Devis reçus' : 'Mes devis'}</Text>
          <Text style={styles.chevron}>→</Text>
        </Pressable>
        {user.role === 'client' ? (
          <Pressable
            onPress={() => router.push('/favoris')}
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.92 }]}
          >
            <Text style={styles.linkTitle}>Mes favoris</Text>
            <Text style={styles.chevron}>→</Text>
          </Pressable>
        ) : null}
        {user.role === 'artisan' ? (
          <Pressable
            onPress={() => router.push('/espace-artisan')}
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.92 }]}
          >
            <Text style={styles.linkTitle}>Espace artisan</Text>
            <Text style={styles.chevron}>→</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => router.push('/mentions-legales')}
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.92 }]}
        >
          <Text style={styles.linkTitle}>Mentions légales</Text>
          <Text style={styles.chevron}>→</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/reglement',
              params: {
                audience: user.role === 'artisan' ? 'artisan' : 'client',
                force: '0',
              },
            })
          }
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.92 }]}
        >
          <Text style={styles.linkTitle}>
            Règlement {user.role === 'artisan' ? 'artisans' : 'clients'}
          </Text>
          <Text style={styles.chevron}>→</Text>
        </Pressable>
      </View>

      <Button
        label="Se déconnecter"
        variant="secondary"
        loading={loggingOut}
        onPress={() =>
          Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Déconnexion', style: 'destructive', onPress: onLogout },
          ])
        }
        style={{ marginTop: spacing.md }}
      />

      <View style={[styles.card, styles.dangerCard]}>
        <Text style={styles.dangerTitle}>Supprimer mon compte</Text>
        <Text style={typography.small}>
          {user.role === 'artisan'
            ? 'Votre fiche, prestations, photos et avis seront définitivement effacés.'
            : 'Votre compte, favoris et avis publiés seront définitivement effacés.'}
        </Text>
        <Text style={[typography.small, { marginTop: 6 }]}>
          Action irréversible. Votre numéro redeviendra disponible.
        </Text>

        {!deleteOpen ? (
          <Button
            label="Supprimer mon compte"
            variant="danger"
            onPress={() => setDeleteOpen(true)}
            style={{ marginTop: spacing.md }}
          />
        ) : (
          <View style={{ marginTop: spacing.md }}>
            <Field label="Confirmez avec votre mot de passe" error={error}>
              <TextField
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholder="Mot de passe"
              />
            </Field>
            <Button
              label="Supprimer définitivement"
              variant="danger"
              loading={deleting}
              onPress={onDelete}
            />
            <Button
              label="Annuler"
              variant="secondary"
              onPress={() => {
                setDeleteOpen(false);
                setPassword('');
                setError(null);
              }}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  centered: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  menu: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  chevron: { color: colors.brand, fontWeight: '700', fontSize: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: colors.brandDark },
  name: { ...typography.heading, fontSize: 18 },
  role: { ...typography.small, color: colors.brand, fontWeight: '700', marginTop: 2 },
  row: { gap: 2 },
  rowLabel: { ...typography.small, textTransform: 'uppercase', fontWeight: '700' },
  rowValue: { ...typography.body },
  warn: { ...typography.small, color: '#b45309', fontWeight: '600' },
  linkTitle: { ...typography.body, fontWeight: '700' },
  linkCta: { ...typography.small, color: colors.brand, fontWeight: '700', marginTop: 6 },
  dangerCard: { borderColor: 'rgba(232,93,59,0.35)', marginTop: spacing.lg },
  dangerTitle: { fontWeight: '700', color: colors.danger, fontSize: 16 },
});
