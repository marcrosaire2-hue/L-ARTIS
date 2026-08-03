import { useCallback, useEffect, useState } from 'react';
import { Lightbulb, Plus, Tags } from 'lucide-react';
import {
  useDeleteCategoryMutation,
  useDeleteTradeMutation,
  useListCategoriesQuery,
  useListTradesQuery,
} from '../features/catalog/catalog.api';
import ConfirmAction from '../components/ConfirmAction';
import CatalogIllustration from '../components/CatalogIllustration';
import CategoryDetails from '../components/catalog/CategoryDetails';
import CategoryForm from '../components/catalog/CategoryForm';
import CategoryList from '../components/catalog/CategoryList';
import TradeForm from '../components/catalog/TradeForm';
import { Button, Card, PageHeader } from '../components/ui';
import { errorMessage } from '../lib/format';

export default function CatalogPage() {
  const categories = useListCategoriesQuery();
  const [selectedId, setSelectedId] = useState(null);

  const selected = categories.data?.find((category) => category._id === selectedId) ?? null;

  // Sélectionne la première catégorie dès que la liste arrive
  useEffect(() => {
    if (!selectedId && categories.data?.length) setSelectedId(categories.data[0]._id);
  }, [categories.data, selectedId]);

  const trades = useListTradesQuery(
    { categoryId: selectedId, limit: 50 },
    { skip: !selectedId }
  );

  const [deleteCategory, { isLoading: isDeletingCategory }] = useDeleteCategoryMutation();
  const [deleteTrade, { isLoading: isDeletingTrade }] = useDeleteTradeMutation();

  const [categoryForm, setCategoryForm] = useState(null); // { category? }
  const [tradeForm, setTradeForm] = useState(null); // { trade? }
  const [action, setAction] = useState(null);
  const [actionError, setActionError] = useState(null);

  const selectCategory = useCallback((id) => setSelectedId(id), []);

  const openNewCategory = useCallback(() => setCategoryForm({}), []);
  const openEditCategory = useCallback((category) => setCategoryForm({ category }), []);
  const closeCategoryForm = useCallback(() => setCategoryForm(null), []);

  const openNewTrade = useCallback(() => setTradeForm({}), []);
  const openEditTrade = useCallback((trade) => setTradeForm({ trade }), []);
  const closeTradeForm = useCallback(() => setTradeForm(null), []);

  const requestDeleteCategory = useCallback((category) => {
    setAction({
      kind: 'category',
      target: category,
      title: 'Supprimer cette catégorie ?',
      description: category.name,
      confirmLabel: 'Supprimer',
      variant: 'danger',
      reason: 'none',
    });
  }, []);

  const requestDeleteTrade = useCallback((trade) => {
    setAction({
      kind: 'trade',
      target: trade,
      title: 'Supprimer ce métier ?',
      description: trade.name,
      confirmLabel: 'Supprimer',
      variant: 'danger',
      reason: 'none',
    });
  }, []);

  const closeAction = useCallback(() => {
    setAction(null);
    setActionError(null);
  }, []);

  const confirmAction = useCallback(async () => {
    setActionError(null);
    try {
      if (action.kind === 'category') {
        await deleteCategory(action.target._id).unwrap();
        if (action.target._id === selectedId) setSelectedId(null);
      } else {
        await deleteTrade(action.target._id).unwrap();
      }
      closeAction();
    } catch (error) {
      setActionError(errorMessage(error, 'La suppression a échoué.'));
    }
  }, [action, selectedId, deleteCategory, deleteTrade, closeAction]);

  return (
    <>
      <PageHeader
        icon={Tags}
        title="Catalogue"
        description="Gérez les catégories et métiers proposés aux artisans."
        actions={
          <Button onClick={openNewCategory} aria-label="Créer une nouvelle catégorie">
            <Plus className="size-4" aria-hidden="true" />
            Nouvelle catégorie
          </Button>
        }
      />

      <Card className="p-6 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[3fr_7fr]">
          <CategoryList
            categories={categories.data ?? []}
            isLoading={categories.isLoading}
            isError={categories.isError}
            error={categories.error}
            onRetry={categories.refetch}
            selectedId={selectedId}
            onSelect={selectCategory}
          />

          <CategoryDetails
            selected={selected}
            trades={trades}
            onEditCategory={openEditCategory}
            onDeleteCategory={requestDeleteCategory}
            onAddTrade={openNewTrade}
            onEditTrade={openEditTrade}
            onDeleteTrade={requestDeleteTrade}
          />
        </div>

        {/* Bannière conseil */}
        <div className="mt-8 flex items-center gap-5 overflow-hidden rounded-panel border border-brand-600/15 bg-brand-50 p-6 sm:gap-6 sm:p-8">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-md shadow-brand-600/25"
            aria-hidden="true"
          >
            <Lightbulb className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-brand-900">Conseil</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-brand-800/90">
              Créez des catégories claires et précises afin d'aider les artisans à choisir
              facilement leur domaine de compétence.
            </p>
          </div>
          <div className="hidden shrink-0 text-brand-100 sm:block">
            <CatalogIllustration className="size-24" />
          </div>
        </div>
      </Card>

      {categoryForm && (
        <CategoryForm category={categoryForm.category} onClose={closeCategoryForm} />
      )}
      {tradeForm && selected && (
        <TradeForm trade={tradeForm.trade} category={selected} onClose={closeTradeForm} />
      )}

      <ConfirmAction
        action={action}
        onClose={closeAction}
        onConfirm={confirmAction}
        loading={isDeletingCategory || isDeletingTrade}
        error={actionError}
      />
    </>
  );
}
