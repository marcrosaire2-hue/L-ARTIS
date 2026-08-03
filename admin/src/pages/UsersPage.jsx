import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { Ban, CalendarDays, Copy, KeyRound, RotateCcw, Trash2, Users } from 'lucide-react';
import {
  useDeleteUserMutation,
  useListUsersQuery,
  useResetUserPasswordMutation,
  useSetUserStatusMutation,
} from '../features/users/users.api';
import { selectUser } from '../features/auth/authSlice';
import { useListParams } from '../lib/useListParams';
import SearchInput from '../components/SearchInput';
import ConfirmAction from '../components/ConfirmAction';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Modal,
  RoleBadge,
  Select,
  Spinner,
  StatusBadge,
} from '../components/ui';
import {
  ACCOUNT_STATUS,
  ARTISAN_STATUS,
  ROLES,
  cleanParams,
  errorMessage,
  formatDate,
  formatNumber,
  fullName,
} from '../lib/format';

// L'API ne propose pas d'endpoint d'agrégation : le total est lu via
// `totalItems`, avec limit=1 pour ne pas rapatrier les documents.
const COUNT_ONLY = { limit: 1 };

const HEADERS = [
  { label: 'Utilisateur' },
  { label: 'Rôle' },
  { label: 'Profil' },
  { label: 'Statut' },
  { label: 'Inscrit le' },
  { label: 'Actions', className: 'text-right' },
];

function UserStatsCard({ total, loading }) {
  return (
    <Card className="flex items-center gap-4 p-5 sm:min-w-64">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-panel bg-gradient-to-br from-violet-100 to-violet-200/70 text-violet-700">
        <Users className="size-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        {loading ? (
          <Spinner className="size-6" />
        ) : (
          <p className="text-3xl font-bold tracking-tight text-slate-900">
            {formatNumber(total)}
          </p>
        )}
        <p className="mt-1 text-sm text-slate-500">Utilisateurs inscrits</p>
      </div>
    </Card>
  );
}

export default function UsersPage() {
  const { filters, page, update, setPage } = useListParams({ role: '', status: '', q: '' });
  const { data, isLoading, isFetching, isError, error, refetch } = useListUsersQuery(
    cleanParams({ ...filters, page })
  );
  const usersTotal = useListUsersQuery(COUNT_ONLY);
  const [setUserStatus, { isLoading: isUpdating }] = useSetUserStatusMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetUserPasswordMutation();
  const [issuedPassword, setIssuedPassword] = useState(null);
  const currentUser = useSelector(selectUser);

  const [action, setAction] = useState(null);
  const [actionError, setActionError] = useState(null);

  const onSearch = useCallback((q) => update({ q }), [update]);

  const closeAction = () => {
    setAction(null);
    setActionError(null);
  };

  const confirmAction = async (reason) => {
    setActionError(null);
    try {
      if (action.kind === 'delete') {
        await deleteUser(action.user._id).unwrap();
      } else if (action.kind === 'password') {
        const result = await resetPassword(action.user._id).unwrap();
        // Affiché une seule fois : il n'est stocké nulle part en clair
        setIssuedPassword({ user: action.user, value: result.temporaryPassword });
      } else {
        await setUserStatus({ id: action.user._id, status: action.kind, reason }).unwrap();
      }
      closeAction();
    } catch (requestError) {
      setActionError(errorMessage(requestError, "L'opération a échoué."));
    }
  };

  const suspendAction = (user) => ({
    kind: 'suspended',
    user,
    title: 'Suspendre ce compte ?',
    description: `${fullName(user)} — ${user.email}`,
    confirmLabel: 'Suspendre',
    variant: 'danger',
    reason: 'required',
    reasonLabel: 'Motif de la suspension',
    reasonHint: 'Toutes les sessions actives seront fermées immédiatement.',
  });

  const reactivateAction = (user) => ({
    kind: 'active',
    user,
    title: 'Réactiver ce compte ?',
    description: `${fullName(user)} — ${user.email}`,
    confirmLabel: 'Réactiver',
    variant: 'primary',
    reason: 'none',
  });

  const passwordAction = (user) => ({
    kind: 'password',
    user,
    title: 'Réinitialiser le mot de passe ?',
    description: `${fullName(user)} — ${user.phone || user.email}`,
    confirmLabel: 'Générer un mot de passe',
    variant: 'primary',
    reason: 'none',
  });

  const deleteAction = (user) => ({
    kind: 'delete',
    user,
    title: 'Supprimer définitivement ce compte ?',
    description: `${fullName(user)} — ${user.email}`,
    confirmLabel: 'Supprimer définitivement',
    variant: 'danger',
    reason: 'none',
  });

  const users = data?.items ?? [];

  return (
    <>
      <PageHeader
        icon={Users}
        title="Utilisateurs"
        description="Comptes clients, artisans et administrateurs de la plateforme."
        actions={
          <UserStatsCard total={usersTotal.data?.totalItems} loading={usersTotal.isLoading} />
        }
      />

      <Card className="mb-6 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={filters.q} onChange={onSearch} placeholder="Nom, numéro ou e-mail…" />
          <Select
            value={filters.role}
            onChange={(event) => update({ role: event.target.value })}
            aria-label="Filtrer par rôle"
            className="w-auto min-w-36"
          >
            <option value="">Tous les rôles</option>
            {Object.entries(ROLES).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            value={filters.status}
            onChange={(event) => update({ status: event.target.value })}
            aria-label="Filtrer par statut"
            className="w-auto min-w-36"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(ACCOUNT_STATUS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          {isFetching && !isLoading && <Spinner className="size-4" />}
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={refetch} />
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun utilisateur"
            description="Aucun compte ne correspond à ces critères."
          />
        ) : (
          <>
            <DataTable headers={HEADERS}>
              {users.map((user) => {
                const isSelf = String(user._id) === String(currentUser?.id);
                return (
                  <tr key={user._id} className="transition-colors duration-200 hover:bg-slate-50/80">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-slate-900">
                            <span className="truncate">{fullName(user)}</span>
                            {isSelf && <Badge tone="green">Vous</Badge>}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {user.phone || <span className="italic">sans téléphone</span>}
                          </p>
                          {user.email && (
                            <p className="truncate text-xs text-slate-400">{user.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-5 py-4">
                      {user.role === 'artisan' && user.profile ? (
                        <StatusBadge value={user.profile.status} map={ARTISAN_STATUS} />
                      ) : user.role === 'client' && user.profile ? (
                        <span className="text-xs text-slate-500">
                          {user.profile.commune || 'Commune non renseignée'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge value={user.accountStatus} map={ACCOUNT_STATUS} />
                        {!user.isEmailVerified && <Badge tone="slate">E-mail non vérifié</Badge>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                        <CalendarDays className="size-3.5 text-slate-400" aria-hidden="true" />
                        {formatDate(user.createdAt)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        {user.accountStatus === 'suspended' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isSelf}
                            onClick={() => setAction(reactivateAction(user))}
                            title="Réactiver le compte"
                          >
                            <RotateCcw className="size-3.5" aria-hidden="true" />
                            Réactiver
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isSelf}
                            onClick={() => setAction(suspendAction(user))}
                            title="Suspendre le compte"
                          >
                            <Ban className="size-3.5" aria-hidden="true" />
                            Suspendre
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isSelf || user.role === 'admin'}
                          onClick={() => setAction(passwordAction(user))}
                          title="Réinitialiser le mot de passe"
                          className="size-8 rounded-lg p-0 hover:bg-brand-50 hover:text-brand-700"
                        >
                          <KeyRound className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isSelf}
                          onClick={() => setAction(deleteAction(user))}
                          title="Supprimer définitivement"
                          className="size-8 rounded-lg p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </DataTable>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalItems={data.totalItems}
              onChange={setPage}
            />
          </>
        )}
      </Card>

      <ConfirmAction
        action={action}
        onClose={closeAction}
        onConfirm={confirmAction}
        loading={isUpdating || isDeleting || isResetting}
        error={actionError}
      />

      <Modal
        open={Boolean(issuedPassword)}
        onClose={() => setIssuedPassword(null)}
        title="Mot de passe temporaire"
        description={issuedPassword ? fullName(issuedPassword.user) : undefined}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Communiquez-le à la personne concernée (téléphone ou WhatsApp). Il ne sera
            <strong> plus jamais affiché</strong> et toutes ses sessions ont été fermées.
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-3">
            <code className="flex-1 font-mono text-lg tracking-wider text-slate-900">
              {issuedPassword?.value}
            </code>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigator.clipboard?.writeText(issuedPassword.value)}
            >
              <Copy className="size-3.5" aria-hidden="true" />
              Copier
            </Button>
          </div>
          {issuedPassword?.user?.phone && (
            <p className="text-sm text-slate-500">
              Identifiant de connexion : <strong>{issuedPassword.user.phone}</strong>
            </p>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setIssuedPassword(null)}>J'ai noté</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
