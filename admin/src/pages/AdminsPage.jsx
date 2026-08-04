import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  CalendarDays,
  Eye,
  EyeOff,
  Plus,
  Shield,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import {
  useCreateAdminMutation,
  useGetAdminMeQuery,
  useListAdminsQuery,
} from '../features/admins/admins.api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  ListCard,
  Modal,
  PageHeader,
  Select,
  Spinner,
  StatusBadge,
} from '../components/ui';
import { ACCOUNT_STATUS, errorMessage, formatDate, formatNumber, fullName } from '../lib/format';

const ADMIN_LEVELS = {
  super: {
    label: 'Super-administrateur',
    tone: 'purple',
    hint: 'Accès complet, y compris la création d’autres administrateurs.',
  },
  manager: {
    label: 'Manager',
    tone: 'blue',
    hint: 'Gestion des utilisateurs, artisans, catalogue et avis.',
  },
  moderator: {
    label: 'Modérateur',
    tone: 'amber',
    hint: 'Modération des avis et signalements uniquement.',
  },
};

const schema = z
  .object({
    firstName: z.string().trim().min(2, 'Au moins 2 caractères').max(50),
    lastName: z.string().trim().min(2, 'Au moins 2 caractères').max(50),
    email: z.string().trim().email('Adresse e-mail invalide'),
    roleAdmin: z.enum(['super', 'manager', 'moderator']),
    password: z
      .string()
      .min(8, 'Au moins 8 caractères')
      .regex(/[A-Z]/, 'Une majuscule est requise')
      .regex(/[a-z]/, 'Une minuscule est requise')
      .regex(/\d/, 'Un chiffre est requis'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

function AdminStatsCard({ total, loading }) {
  return (
    <Card className="flex w-full items-center gap-4 p-4 sm:min-w-64 sm:p-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-panel bg-gradient-to-br from-violet-100 to-violet-200/70 text-violet-700">
        <Shield className="size-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        {loading ? (
          <Spinner className="size-6" />
        ) : (
          <p className="text-3xl font-bold tracking-tight text-slate-900">
            {formatNumber(total)}
          </p>
        )}
        <p className="mt-1 text-sm text-slate-500">Administrateurs</p>
      </div>
    </Card>
  );
}

function CreateAdminForm({ open, onClose }) {
  const [createAdmin, { isLoading }] = useCreateAdminMutation();
  const [formError, setFormError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      roleAdmin: 'manager',
      password: '',
      confirmPassword: '',
    },
  });

  const roleAdmin = watch('roleAdmin');

  const close = () => {
    reset();
    setFormError(null);
    setShowPassword(false);
    onClose();
  };

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      await createAdmin({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        roleAdmin: values.roleAdmin,
      }).unwrap();
      close();
    } catch (error) {
      setFormError(errorMessage(error, "La création de l'administrateur a échoué."));
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Nouvel administrateur"
      description="Le compte pourra se connecter immédiatement avec l’e-mail indiqué."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" error={errors.firstName?.message}>
            <Input autoComplete="given-name" {...register('firstName')} />
          </Field>
          <Field label="Nom" error={errors.lastName?.message}>
            <Input autoComplete="family-name" {...register('lastName')} />
          </Field>
        </div>

        <Field label="E-mail (identifiant de connexion)" error={errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="admin@lartis.bj" {...register('email')} />
        </Field>

        <Field
          label="Niveau d’accès"
          error={errors.roleAdmin?.message}
          hint={ADMIN_LEVELS[roleAdmin]?.hint}
        >
          <Select {...register('roleAdmin')}>
            {Object.entries(ADMIN_LEVELS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Mot de passe temporaire" error={errors.password?.message}>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </Field>

        <Field label="Confirmer le mot de passe" error={errors.confirmPassword?.message}>
          <Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" {...register('confirmPassword')} />
        </Field>

        {formError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {formError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={close}>
            Annuler
          </Button>
          <Button type="submit" loading={isLoading}>
            <UserPlus className="size-4" aria-hidden="true" />
            Créer le compte
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AdminCard({ admin }) {
  const level = ADMIN_LEVELS[admin.roleAdmin] ?? ADMIN_LEVELS.moderator;
  const user = admin.user;

  return (
    <ListCard>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar user={user} tone="brand" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{fullName(user)}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
        <Badge tone={level.tone}>{level.label}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={user?.accountStatus} map={ACCOUNT_STATUS} />
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <CalendarDays className="size-3.5 text-slate-400" aria-hidden="true" />
          {formatDate(user?.createdAt || admin.createdAt)}
        </span>
      </div>
    </ListCard>
  );
}

function AdminTableRow({ admin }) {
  const level = ADMIN_LEVELS[admin.roleAdmin] ?? ADMIN_LEVELS.moderator;
  const user = admin.user;

  return (
    <tr className="transition-colors duration-base hover:bg-slate-50/80">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar user={user} tone="brand" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{fullName(user)}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <Badge tone={level.tone}>{level.label}</Badge>
      </td>
      <td className="px-5 py-4">
        <StatusBadge value={user?.accountStatus} map={ACCOUNT_STATUS} />
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
        {formatDate(user?.createdAt || admin.createdAt)}
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
        {user?.lastLoginAt ? formatDate(user.lastLoginAt) : 'Jamais'}
      </td>
    </tr>
  );
}

export default function AdminsPage() {
  const me = useGetAdminMeQuery();
  const { data, isLoading, isError, error, refetch } = useListAdminsQuery();
  const [createOpen, setCreateOpen] = useState(false);

  const isSuper = me.data?.roleAdmin === 'super';
  const admins = useMemo(() => data ?? [], [data]);

  return (
    <>
      <PageHeader
        icon={ShieldCheck}
        title="Administrateurs"
        description="Création et suivi des comptes ayant accès à l’espace d’administration."
        actions={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-stretch">
            <AdminStatsCard total={admins.length} loading={isLoading} />
            {isSuper && (
              <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
                <Plus className="size-4" aria-hidden="true" />
                Nouvel administrateur
              </Button>
            )}
          </div>
        }
      />

      {!me.isLoading && !isSuper && (
        <Card className="mb-6 border-amber-200 bg-amber-50 p-4 ring-1 ring-amber-200/80">
          <p className="text-sm text-amber-900">
            La création d’administrateurs est réservée aux <strong>super-administrateurs</strong>.
            Vous pouvez consulter la liste ci-dessous.
          </p>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={refetch} />
        ) : admins.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="Aucun administrateur"
            description="Créez le premier compte administrateur pour démarrer."
          />
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {admins.map((admin) => (
                <AdminCard key={admin.id} admin={admin} />
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80">
                  <tr>
                    <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Administrateur
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Niveau
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Statut
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Créé le
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Dernière connexion
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {admins.map((admin) => (
                    <AdminTableRow key={admin.id} admin={admin} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {isSuper && <CreateAdminForm open={createOpen} onClose={() => setCreateOpen(false)} />}
    </>
  );
}
