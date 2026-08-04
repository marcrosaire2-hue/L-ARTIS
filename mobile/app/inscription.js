import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { AuthShell } from '../src/components/AuthShell';
import { CatalogVisual } from '../src/components/CatalogVisual';
import { Button } from '../src/components/ui';
import { useLoginMutation, useRegisterMutation } from '../src/features/auth/auth.api';
import {
  useListCategoriesQuery,
  useListDepartmentsQuery,
  useListDistrictsQuery,
  useListTradesQuery,
} from '../src/features/catalog/catalog.api';
import { credentialsReceived } from '../src/features/auth/authSlice';
import { BENIN_PHONE_HINT, errorMessage, isBeninPhone } from '../src/lib/format';
import { colors, radius, spacing, TOUCH_TARGET, typography } from '../src/lib/theme';

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Inscription — même procédure que le site + coquille visuelle Monpermis.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useLocalSearchParams();
  const initialRole = params.role === 'artisan' ? 'artisan' : 'client';

  const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const { data: departments } = useListDepartmentsQuery();
  const { data: categories } = useListCategoriesQuery();

  const [role, setRole] = useState(initialRole);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [trades, setTrades] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [department, setDepartment] = useState('');
  const [commune, setCommune] = useState('');
  const [district, setDistrict] = useState('');
  const [error, setError] = useState(null);
  const [fieldError, setFieldError] = useState({});

  const { data: tradesPage } = useListTradesQuery({ categoryId }, { skip: !categoryId });
  const { data: districts } = useListDistrictsQuery(commune, { skip: !commune });
  const communes = useMemo(
    () => (departments ?? []).find((entry) => entry.department === department)?.communes ?? [],
    [departments, department]
  );

  const isLoading = isRegistering || isLoggingIn;
  const tradeItems = tradesPage?.items ?? [];
  const hasCatalogue = (categories ?? []).length > 0;

  const toggleTrade = (id) => {
    setTrades((current) =>
      current.includes(id) ? current.filter((tradeId) => tradeId !== id) : [...current, id]
    );
  };

  const validate = () => {
    const next = {};
    if (firstName.trim().length < 2) next.firstName = 'Au moins 2 caractères';
    if (lastName.trim().length < 2) next.lastName = 'Au moins 2 caractères';
    if (!isBeninPhone(phone)) next.phone = BENIN_PHONE_HINT;
    if (!email.trim()) next.email = "L'adresse e-mail est obligatoire";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Adresse e-mail invalide';
    }
    if (!PASSWORD_RULE.test(password)) {
      next.password = '8 caractères min., une majuscule, une minuscule et un chiffre';
    }
    if (role === 'artisan') {
      if (businessName.trim().length < 2) next.businessName = 'Au moins 2 caractères';
      if (trades.length < 1) next.trades = 'Choisissez au moins un métier';
      if (!department) next.department = 'Département requis';
      if (!commune) next.commune = 'Commune requise';
    }
    setFieldError(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    setError(null);
    if (!validate()) return;

    const body = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      ...(role === 'artisan' && {
        artisanData: {
          businessName: businessName.trim(),
          trades,
          department,
          commune,
          district,
        },
      }),
    };

    try {
      await registerUser(body).unwrap();
      try {
        const session = await login({ identifier: phone.trim(), password }).unwrap();
        dispatch(credentialsReceived(session));
      } catch {
        /* on continue vers la saisie du code même sans session */
      }
      router.replace({
        pathname: '/verification-email',
        params: { email: email.trim().toLowerCase() },
      });
    } catch (registerError) {
      setError(errorMessage(registerError, "L'inscription a échoué."));
    }
  };

  return (
    <AuthShell
      heroSource={role === 'artisan' ? require('../assets/artisan.jpg') : require('../assets/client.jpg')}
      kicker="Inscription"
      title="Créer un compte"
      subtitle="Gratuit, en moins d'une minute."
    >
      <View style={styles.roleRow}>
        <RoleChip
          label="Je cherche un artisan"
          active={role === 'client'}
          onPress={() => {
            setRole('client');
            setError(null);
            setFieldError({});
          }}
        />
        <RoleChip
          label="Je suis artisan"
          active={role === 'artisan'}
          onPress={() => {
            setRole('artisan');
            setError(null);
            setFieldError({});
          }}
        />
      </View>

      {error ? (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Field label="Prénom" required error={fieldError.firstName}>
        <TextInput value={firstName} onChangeText={setFirstName} style={styles.input} />
      </Field>
      <Field label="Nom" required error={fieldError.lastName}>
        <TextInput value={lastName} onChangeText={setLastName} style={styles.input} />
      </Field>
      <Field
        label="Numéro de téléphone"
        required
        error={fieldError.phone}
        hint="Identifiant de connexion — 10 chiffres commençant par 01."
      >
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="01 47 88 01 43"
          placeholderTextColor={colors.textLight}
          keyboardType="phone-pad"
          style={styles.input}
        />
      </Field>
      <Field
        label="Adresse e-mail"
        required
        error={fieldError.email}
        hint="Obligatoire pour vérifier votre compte et récupérer votre mot de passe."
      >
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={styles.input}
        />
      </Field>
      <Field
        label="Mot de passe"
        required
        error={fieldError.password}
        hint="8 caractères, majuscule, minuscule et chiffre."
      >
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!visible}
            autoCapitalize="none"
            style={[styles.input, styles.passwordInput]}
          />
          <Pressable onPress={() => setVisible((v) => !v)} style={styles.reveal}>
            <Text style={styles.link}>{visible ? 'Masquer' : 'Afficher'}</Text>
          </Pressable>
        </View>
      </Field>

      {role === 'artisan' ? (
        <>
          <View style={styles.separator} />
          <Field label="Nom commercial" required error={fieldError.businessName}>
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Atelier Kofi…"
              placeholderTextColor={colors.textLight}
              style={styles.input}
            />
          </Field>

          <View style={styles.field}>
            <Text style={styles.label}>
              Vos métiers <Text style={styles.required}>*</Text>
            </Text>
            {!hasCatalogue ? (
              <Text style={styles.warning}>
                Le catalogue des métiers n'est pas encore publié.
              </Text>
            ) : (
              <>
                <OptionSelect
                  placeholder="Choisissez une catégorie…"
                  value={categoryId}
                  options={(categories ?? []).map((category) => ({
                    value: category._id,
                    label: category.name,
                  }))}
                  onChange={setCategoryId}
                />
                {categoryId ? (
                  <View style={styles.chips}>
                    {tradeItems.map((trade) => {
                      const active = trades.includes(trade._id);
                      return (
                        <Pressable
                          key={trade._id}
                          onPress={() => toggleTrade(trade._id)}
                          style={[styles.tradeChip, active && styles.tradeChipActive]}
                        >
                          <CatalogVisual image={trade.image} icon={trade.icon} size={28} />
                          <Text
                            style={[styles.tradeChipText, active && styles.tradeChipTextActive]}
                          >
                            {trade.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </>
            )}
            {fieldError.trades ? <Text style={styles.fieldError}>{fieldError.trades}</Text> : null}
          </View>

          <Field label="Département" required error={fieldError.department}>
            <OptionSelect
              placeholder="Choisir…"
              value={department}
              options={(departments ?? []).map((entry) => ({
                value: entry.department,
                label: entry.department,
              }))}
              onChange={(value) => {
                setDepartment(value);
                setCommune('');
                setDistrict('');
              }}
            />
          </Field>
          <Field label="Commune" required error={fieldError.commune}>
            <OptionSelect
              placeholder={department ? 'Choisir…' : "Choisissez d'abord un département"}
              value={commune}
              disabled={!department}
              options={communes.map((name) => ({ value: name, label: name }))}
              onChange={(value) => {
                setCommune(value);
                setDistrict('');
              }}
            />
          </Field>
          <Field label="Ville / Quartier" hint="Facultatif">
            <OptionSelect
              placeholder={commune ? 'Choisir…' : "Choisissez d'abord une commune"}
              value={district}
              disabled={!commune}
              options={(districts ?? []).map((name) => ({ value: name, label: name }))}
              onChange={setDistrict}
            />
          </Field>
        </>
      ) : null}

      <Button label="Créer mon compte" onPress={submit} loading={isLoading} style={styles.action} />

      <Text style={styles.footer}>
        Déjà inscrit ?{' '}
        <Text style={styles.link} onPress={() => router.replace('/connexion')}>
          Se connecter
        </Text>
      </Text>
    </AuthShell>
  );
}

function RoleChip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, required, hint, error, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function OptionSelect({ placeholder, value, options, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <View>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen((current) => !current)}
        style={[styles.select, disabled && styles.selectDisabled, open && styles.selectOpen]}
      >
        <Text style={[styles.selectText, !selected && styles.selectPlaceholder]}>
          {selected?.label || placeholder}
        </Text>
        <Text style={styles.selectCaret}>{open ? '▴' : '▾'}</Text>
      </Pressable>
      {open && !disabled ? (
        <View style={styles.options}>
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              style={[styles.option, option.value === value && styles.optionActive]}
            >
              <Text style={[styles.optionText, option.value === value && styles.optionTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    flex: 1,
    minHeight: TOUCH_TARGET,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
  },
  chipActive: { borderColor: colors.brand, backgroundColor: colors.brandSurface },
  chipText: { ...typography.small, fontWeight: '700', color: colors.textMuted, textAlign: 'center' },
  chipTextActive: { color: colors.brandDark },
  field: { marginBottom: spacing.md },
  label: { ...typography.muted, fontWeight: '600', marginBottom: spacing.xs },
  required: { color: colors.danger },
  hint: { ...typography.small, marginTop: spacing.xs },
  fieldError: { ...typography.small, color: colors.danger, marginTop: spacing.xs },
  input: {
    minHeight: TOUCH_TARGET,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  passwordRow: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 90 },
  reveal: { position: 'absolute', right: spacing.md, paddingVertical: spacing.xs },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  select: {
    minHeight: TOUCH_TARGET,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
  },
  selectOpen: { borderColor: colors.brand },
  selectDisabled: { opacity: 0.5 },
  selectText: { ...typography.body, flex: 1 },
  selectPlaceholder: { color: colors.textLight },
  selectCaret: { color: colors.textMuted, marginLeft: spacing.sm },
  options: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  option: {
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionActive: { backgroundColor: colors.brandSurface },
  optionText: { ...typography.body },
  optionTextActive: { color: colors.brandDark, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  tradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  tradeChipActive: { backgroundColor: colors.brandSurface, borderColor: colors.brand },
  tradeChipText: { ...typography.small, fontWeight: '700', color: colors.text },
  tradeChipTextActive: { color: colors.brandDark },
  warning: { ...typography.muted, color: '#92400e', backgroundColor: '#fffbeb', padding: spacing.md, borderRadius: radius.md },
  action: { marginTop: spacing.sm },
  link: { color: colors.brand, fontWeight: '700' },
  footer: { ...typography.muted, textAlign: 'center', marginTop: spacing.lg },
  errorBox: {
    backgroundColor: colors.dangerSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.muted, color: colors.danger },
  artisanNote: {
    ...typography.muted,
    backgroundColor: colors.brandSurface,
    color: colors.brandDark,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
});
