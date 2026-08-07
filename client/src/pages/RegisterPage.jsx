import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Hammer, User } from 'lucide-react';
import { useLoginMutation, useRegisterMutation } from '../features/auth/auth.api';
import {
  useListCategoriesQuery,
  useListDepartmentsQuery,
  useListDistrictsQuery,
  useListTradesQuery,
} from '../features/catalog/catalog.api';
import { credentialsReceived } from '../features/auth/authSlice';
import { Alert, Button, Card, Container, Field, Input, Select } from '../components/ui';
import { BENIN_PHONE_HINT, errorMessage, isBeninPhone } from '../lib/format';

/*
 * Inscription en une étape volontairement courte : identité, contact et,
 * pour un artisan, ce qui le rend trouvable (métier + commune).
 * Photos, présentation et services sont demandés APRÈS la création du compte,
 * dans le parcours de complétion — d'abord parce qu'un upload exige un token
 * (l'API refuse les envois anonymes), ensuite parce qu'un formulaire long
 * avant même l'existence du compte fait tout perdre au moindre échec.
 */

const passwordRule = z
  .string()
  .min(8, 'Au moins 8 caractères')
  .max(72, 'Maximum 72 caractères')
  .regex(/[a-z]/, 'Ajoutez une minuscule')
  .regex(/[A-Z]/, 'Ajoutez une majuscule')
  .regex(/\d/, 'Ajoutez un chiffre');

const baseSchema = {
  firstName: z.string().trim().min(2, 'Au moins 2 caractères').max(50),
  lastName: z.string().trim().min(2, 'Au moins 2 caractères').max(50),
  // Le téléphone est l'identifiant de connexion : c'est le seul contact
  // obligatoire. Le serveur le normalise en E.164.
  phone: z
    .string()
    .trim()
    .refine(isBeninPhone, BENIN_PHONE_HINT),
  email: z
    .string()
    .trim()
    .min(1, "L'adresse e-mail est obligatoire")
    .email('Adresse e-mail invalide'),
  password: passwordRule,
};

const clientSchema = z.object(baseSchema);

const artisanSchema = z.object({
  ...baseSchema,
  businessName: z.string().trim().min(2, 'Au moins 2 caractères').max(80),
  trades: z.array(z.string()).min(1, 'Choisissez au moins un métier'),
  department: z.string().min(1, 'Département requis'),
  commune: z.string().min(1, 'Commune requise'),
  // La ville/zone est facultative : on ne la rend pas obligatoire,
  // mais toutes les communes du Bénin référencent désormais leurs arrondissements.
  district: z.string(),
});

function RoleTabs({ role, onChange }) {
  const tabs = [
    { value: 'client', label: 'Je cherche un artisan', icon: User },
    { value: 'artisan', label: 'Je suis artisan', icon: Hammer },
  ];
  return (
    <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
      {tabs.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            role === value ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

function TradePicker({ value, onToggle, error }) {
  const [categoryId, setCategoryId] = useState('');
  const { data: categories } = useListCategoriesQuery();
  const { data: trades } = useListTradesQuery({ categoryId }, { skip: !categoryId });

  const hasCatalogue = (categories ?? []).length > 0;

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        Vos métiers<span className="ml-0.5 text-red-600">*</span>
      </span>

      {!hasCatalogue ? (
        <Alert tone="amber">
          Le catalogue des métiers n'est pas encore renseigné. L'inscription artisan sera
          possible dès que l'équipe l'aura publié.
        </Alert>
      ) : (
        <>
          <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">Choisissez une catégorie…</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.icon} {category.name}
              </option>
            ))}
          </Select>

          {categoryId && (
            <div className="mt-3 flex flex-wrap gap-2">
              {(trades?.items ?? []).map((trade) => {
                const active = value.includes(trade._id);
                return (
                  <button
                    key={trade._id}
                    type="button"
                    onClick={() => onToggle(trade._id)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors ${
                      active
                        ? 'bg-brand-600 text-white ring-brand-600'
                        : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {trade.name}
                  </button>
                );
              })}
            </div>
          )}

          <p className="mt-2 text-sm text-slate-500">
            {value.length > 0
              ? `${value.length} métier${value.length > 1 ? 's' : ''} sélectionné${value.length > 1 ? 's' : ''}`
              : 'Vous pouvez en choisir plusieurs, dans différentes catégories.'}
          </p>
        </>
      )}

      {error && <span className="mt-1.5 block text-sm text-red-600">{error}</span>}
    </div>
  );
}

function SuccessScreen({ email, role }) {
  return (
    <Card className="p-8 text-center">
      <CheckCircle2 className="mx-auto size-12 text-brand-600" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Compte créé</h1>
      <p className="mt-2 text-slate-600">
        Prochaine étape : lire et valider le règlement{' '}
        {role === 'artisan' ? 'artisans' : 'clients'}, obligatoire selon le Code du numérique
        au Bénin.
      </p>
      {role === 'artisan' && (
        <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
          Ensuite, vérifiez votre e-mail puis complétez votre fiche : elle sera publiée après
          validation par notre équipe.
        </p>
      )}
      <Link
        to={`/reglement/${role}?accept=1&email=${encodeURIComponent(email)}`}
        className="mt-6 inline-block"
      >
        <Button>Lire et valider le règlement</Button>
      </Link>
    </Card>
  );
}

export default function RegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const role = searchParams.get('role') === 'artisan' ? 'artisan' : 'client';
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [registerUser, { isLoading }] = useRegisterMutation();
  const [login] = useLoginMutation();
  const { data: departments } = useListDepartmentsQuery();
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(role === 'artisan' ? artisanSchema : clientSchema),
    defaultValues: { trades: [], department: '', commune: '', district: '' },
  });

  const selectedTrades = watch('trades') ?? [];

  /**
   * La sélection est relue via getValues au moment du clic, et non depuis la
   * valeur capturée au rendu : deux clics dans le même cycle React
   * partageraient sinon la même liste périmée, et le second effacerait le
   * premier.
   */
  const toggleTrade = (id) => {
    const current = getValues('trades') ?? [];
    const next = current.includes(id) ? current.filter((t) => t !== id) : [...current, id];
    setValue('trades', next, { shouldValidate: true });
  };
  const selectedDepartment = watch('department');
  const selectedCommune = watch('commune');
  const communes =
    (departments ?? []).find((d) => d.department === selectedDepartment)?.communes ?? [];
  const { data: districts } = useListDistrictsQuery(selectedCommune, {
    skip: !selectedCommune,
  });

  const switchRole = (next) => {
    setFormError(null);
    setSearchParams(next === 'artisan' ? { role: 'artisan' } : {}, { replace: true });
  };

  const onSubmit = async (values) => {
    setFormError(null);
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      password: values.password,
      role,
      email: values.email.trim().toLowerCase(),
      ...(role === 'artisan' && {
        artisanData: {
          businessName: values.businessName,
          trades: values.trades,
          department: values.department,
          commune: values.commune,
          district: values.district,
        },
      }),
    };

    try {
      await registerUser(payload).unwrap();
      const email = values.email.trim().toLowerCase();

      // Connexion immédiate, puis lecture / validation du règlement.
      try {
        const session = await login({ identifier: values.phone, password: values.password }).unwrap();
        dispatch(credentialsReceived(session));
        navigate(`/reglement/${role}?accept=1&email=${encodeURIComponent(email)}`, { replace: true });
        return;
      } catch {
        setSuccess({ email });
      }
    } catch (error) {
      setFormError(errorMessage(error, "L'inscription a échoué."));
    }
  };

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-xl">
        {success ? (
          <SuccessScreen {...success} role={role} />
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Créer un compte</h1>
              <p className="mt-1 text-slate-600">Gratuit, en moins d'une minute.</p>
            </div>

            <RoleTabs role={role} onChange={switchRole} />

            <Card className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
                {formError && <Alert>{formError}</Alert>}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Prénom" required error={errors.firstName?.message}>
                    <Input autoComplete="given-name" {...register('firstName')} />
                  </Field>
                  <Field label="Nom" required error={errors.lastName?.message}>
                    <Input autoComplete="family-name" {...register('lastName')} />
                  </Field>
                </div>

                <Field
                  label="Numéro de téléphone"
                  required
                  error={errors.phone?.message}
                  hint="C'est votre identifiant de connexion, et le numéro que verront vos clients. 10 chiffres commençant par 01."
                >
                  <Input
                    type="tel"
                    autoComplete="tel"
                    placeholder="01 47 88 01 43"
                    {...register('phone')}
                  />
                </Field>

                <Field
                  label="Adresse e-mail"
                  required
                  error={errors.email?.message}
                  hint="Obligatoire pour vérifier votre compte et récupérer votre mot de passe."
                >
                  <Input type="email" autoComplete="email" {...register('email')} />
                </Field>

                <Field
                  label="Mot de passe"
                  required
                  error={errors.password?.message}
                  hint="8 caractères minimum, avec une majuscule, une minuscule et un chiffre."
                >
                  <Input type="password" autoComplete="new-password" {...register('password')} />
                </Field>

                {role === 'artisan' && (
                  <>
                    <hr className="border-slate-200" />

                    <Field
                      label="Nom commercial"
                      required
                      error={errors.businessName?.message}
                      hint="Le nom sous lequel vos clients vous connaissent. Votre propre nom convient très bien."
                    >
                      <Input placeholder="Atelier Kofi, Menuiserie du Littoral…" {...register('businessName')} />
                    </Field>

                    <TradePicker
                      value={selectedTrades}
                      onToggle={toggleTrade}
                      error={errors.trades?.message}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Département" required error={errors.department?.message}>
                        <Select
                          {...register('department')}
                          onChange={(event) => {
                            setValue('department', event.target.value, { shouldValidate: true });
                            setValue('commune', '');
                            setValue('district', '');
                          }}
                        >
                          <option value="">Choisir…</option>
                          {(departments ?? []).map((entry) => (
                            <option key={entry.department} value={entry.department}>
                              {entry.department}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Commune" required error={errors.commune?.message}>
                        <Select
                          {...register('commune')}
                          disabled={!selectedDepartment}
                          onChange={(event) => {
                            setValue('commune', event.target.value, { shouldValidate: true });
                            setValue('district', '');
                          }}
                        >
                          <option value="">
                            {selectedDepartment ? 'Choisir…' : "Choisissez d'abord un département"}
                          </option>
                          {communes.map((commune) => (
                            <option key={commune} value={commune}>
                              {commune}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>

                    <Field
                      label="Ville / Quartier"
                      hint="Facultatif — précisez votre ville, zone ou quartier pour que vos clients vous trouvent (ex. Godomey à Abomey-Calavi, Cadjehoun à Cotonou)."
                      error={errors.district?.message}
                    >
                      <Select {...register('district')} disabled={!selectedCommune}>
                        <option value="">
                          {selectedCommune ? 'Choisir…' : "Choisissez d'abord une commune"}
                        </option>
                        {(districts ?? []).map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </>
                )}

                <Button type="submit" size="lg" loading={isLoading} className="mt-2">
                  Créer mon compte
                </Button>

                <p className="text-center text-xs leading-relaxed text-slate-500">
                  En créant un compte, vous pourrez lire et devoir accepter le{' '}
                  <Link
                    to={`/reglement/${role}`}
                    className="font-medium text-brand-700 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    règlement {role === 'artisan' ? 'artisans' : 'clients'}
                  </Link>{' '}
                  ainsi que les{' '}
                  <Link
                    to="/mentions-legales"
                    className="font-medium text-brand-700 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    mentions légales
                  </Link>
                  , conformément au Code du numérique au Bénin.
                </p>

                <p className="text-center text-sm text-slate-600">
                  Déjà inscrit ?{' '}
                  <Link to="/connexion" className="font-medium text-brand-700 hover:underline">
                    Se connecter
                  </Link>
                </p>
              </form>
            </Card>
          </>
        )}
      </div>
    </Container>
  );
}
