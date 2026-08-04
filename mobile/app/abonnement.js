import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import {
  AlertBox,
  Badge,
  Button,
  LoadingView,
  ScreenHeader,
} from '../src/components/ui';
import {
  useCancelSubscriptionMutation,
  useGetMySubscriptionQuery,
  useListPlansQuery,
  useSubscribeMutation,
} from '../src/features/subscriptions/subscriptions.api';
import { selectUser } from '../src/features/auth/authSlice';
import { errorMessage, formatPrice } from '../src/lib/format';
import { colors, radius, spacing, typography } from '../src/lib/theme';

const FEATURE_LABELS = {
  maxGallery: (n) => `Galerie jusqu'à ${n} photos`,
  featured: 'Mise en avant dans les résultats',
  prioritySupport: 'Support prioritaire',
  analytics: 'Statistiques de visibilité',
};

function PlanCard({ plan, currentPlan, onSelect, loading }) {
  const isCurrent = currentPlan === plan.plan;
  const features = Object.entries(plan.features || {})
    .filter(([, enabled]) => enabled)
    .map(([key, value]) => {
      const label = FEATURE_LABELS[key];
      return typeof label === 'function' ? label(value) : label;
    })
    .filter(Boolean);

  return (
    <View style={[styles.card, isCurrent && styles.cardCurrent]}>
      <View style={styles.planHead}>
        <Text style={styles.planName}>{plan.label}</Text>
        {isCurrent ? <Badge label="Actuel" tone="green" /> : null}
      </View>
      <Text style={styles.price}>
        {plan.priceMonthly === 0
          ? 'Gratuit'
          : `${formatPrice(plan.priceMonthly)} / mois`}
      </Text>
      {plan.priceYearly > 0 ? (
        <Text style={typography.small}>
          ou {formatPrice(plan.priceYearly)} / an
        </Text>
      ) : null}
      <View style={styles.features}>
        {features.map((feature) => (
          <Text key={feature} style={typography.small}>
            • {feature}
          </Text>
        ))}
      </View>
      {!isCurrent && plan.plan !== 'basic' ? (
        <Button
          label={`Choisir ${plan.label}`}
          variant="secondary"
          loading={loading}
          onPress={() => onSelect(plan.plan)}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}
    </View>
  );
}

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useSelector(selectUser);
  const [error, setError] = useState(null);

  const { data: plans, isLoading: loadingPlans } = useListPlansQuery();
  const { data: subscription, isLoading: loadingSub } = useGetMySubscriptionQuery(undefined, {
    skip: user?.role !== 'artisan',
  });
  const [subscribe, { isLoading: subscribing }] = useSubscribeMutation();
  const [cancel, { isLoading: canceling }] = useCancelSubscriptionMutation();

  if (user?.role !== 'artisan') {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <ScreenHeader title="Abonnement" onBack={() => router.back()} />
        <AlertBox tone="amber">Les abonnements sont réservés aux comptes artisans.</AlertBox>
      </View>
    );
  }

  if (!user.termsAcceptedAt) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <ScreenHeader title="Abonnement" onBack={() => router.back()} />
        <AlertBox tone="amber">Acceptez le règlement pour gérer votre abonnement.</AlertBox>
        <Button
          label="Voir le règlement"
          onPress={() => router.push({ pathname: '/reglement', params: { accept: '1', audience: 'artisan' } })}
          style={{ marginTop: spacing.md }}
        />
      </View>
    );
  }

  const onSelect = async (plan) => {
    setError(null);
    try {
      await subscribe({ plan, period: 'monthly' }).unwrap();
    } catch (err) {
      setError(errorMessage(err, "L'abonnement n'a pas pu être activé."));
    }
  };

  const onCancel = async () => {
    setError(null);
    try {
      await cancel().unwrap();
    } catch (err) {
      setError(errorMessage(err, "L'annulation a échoué."));
    }
  };

  if (loadingPlans || loadingSub) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <LoadingView label="Chargement des plans…" />
      </View>
    );
  }

  const currentPlan = subscription?.plan ?? 'basic';
  const isPaid = currentPlan !== 'basic' && subscription?.status === 'active';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <ScreenHeader
        title="Abonnement"
        subtitle="Développez votre visibilité"
        onBack={() => router.back()}
      />

      <AlertBox tone="amber">
        Les paiements Mobile Money seront bientôt disponibles. L'activation est provisoirement manuelle.
      </AlertBox>

      {error ? <AlertBox>{error}</AlertBox> : null}

      <View style={{ gap: spacing.md, marginTop: spacing.md }}>
        {(plans ?? []).map((plan) => (
          <PlanCard
            key={plan.plan}
            plan={plan}
            currentPlan={currentPlan}
            onSelect={onSelect}
            loading={subscribing}
          />
        ))}
      </View>

      {isPaid ? (
        <Button
          label="Annuler mon abonnement payant"
          variant="danger"
          loading={canceling}
          onPress={onCancel}
          style={{ marginTop: spacing.lg }}
        />
      ) : null}
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
    gap: spacing.sm,
  },
  cardCurrent: { borderColor: colors.brand, backgroundColor: colors.brandSurface },
  planHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planName: { ...typography.heading, fontSize: 18 },
  price: { fontSize: 20, fontWeight: '700', color: colors.brandDark },
  features: { gap: 4, marginTop: spacing.xs },
});
