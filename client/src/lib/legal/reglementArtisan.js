import { TERMS_VERSION } from './termsVersion';

/** Règlement d'utilisation — artisans. */

export const REGLEMENT_ARTISAN = {
  title: 'Règlement d’utilisation — Artisan',
  version: TERMS_VERSION,
  audience: 'artisan',
  sections: [
    {
      heading: '1. Acceptation',
      paragraphs: [
        'En créant un compte artisan sur L-ARTIS, vous acceptez le présent règlement (version ' +
          TERMS_VERSION +
          ') ainsi que les obligations légales applicables à votre activité au Bénin.',
      ],
    },
    {
      heading: '2. Profil et exactitude des informations',
      paragraphs: [
        'Vous vous engagez à publier un profil sincère : identité, métiers, zone d’intervention, tarifs indicatifs et coordonnées de contact.',
        'Les numéros RCCM et IFU, lorsqu’ils sont renseignés, doivent correspondre à votre situation réelle. L-ARTIS peut demander des justificatifs avant validation ou en cas de contrôle.',
        'Toute fausse déclaration peut entraîner le refus, la suspension ou la suppression de votre fiche.',
      ],
    },
    {
      heading: '3. Validation et visibilité',
      paragraphs: [
        'Les fiches artisans sont soumises à validation par L-ARTIS avant publication. Cette validation ne constitue pas une certification de compétence ni une garantie de qualité.',
        'L-ARTIS se réserve le droit de refuser ou retirer une fiche ne respectant pas les standards de la plateforme ou la réglementation en vigueur.',
      ],
    },
    {
      heading: '4. Devis et relation client',
      paragraphs: [
        'Vous vous engagez à répondre aux demandes de devis de manière professionnelle et dans des délais raisonnables.',
        'Les propositions (prix, délais, conditions) que vous acceptez via la plateforme engagent votre responsabilité vis-à-vis du client.',
        'Les litiges relatifs à l’exécution des prestations relèvent de votre relation directe avec le client ; L-ARTIS peut intervenir uniquement à titre de médiation de bonne foi.',
      ],
    },
    {
      heading: '5. Abonnements',
      paragraphs: [
        'Des formules d’abonnement (Basic, Pro, Business) peuvent être proposées pour des fonctionnalités avancées (visibilité, galerie étendue, statistiques).',
        'Les tarifs sont affichés en francs CFA (XOF). Sauf mention contraire, l’activation des formules payantes peut être provisoirement manuelle en attendant l’intégration des moyens de paiement Mobile Money.',
        'Vous pouvez résilier votre abonnement depuis votre espace ; la résiliation prend effet selon les conditions affichées au moment de la souscription.',
      ],
    },
    {
      heading: '6. Contenus et propriété intellectuelle',
      paragraphs: [
        'Vous garantissez disposer des droits sur les photos, textes et réalisations publiés sur votre fiche.',
        'Vous accordez à L-ARTIS une licence non exclusive permettant d’afficher ces contenus sur la plateforme et dans les supports de promotion du service.',
      ],
    },
    {
      heading: '7. Comportement et conformité',
      paragraphs: [
        'Sont interdits : pratiques trompeuses, contournement de la plateforme pour éviter les obligations, harcèlement, contenus illicites ou atteinte aux droits des tiers.',
        'Conformément au Code du numérique (loi 2017-20), L-ARTIS coopère avec les autorités compétentes en cas d’infraction manifeste.',
      ],
    },
    {
      heading: '8. Données et confidentialité',
      paragraphs: [
        'Les données de vos clients obtenues via L-ARTIS ne doivent être utilisées que dans le cadre de la relation professionnelle initiée sur la plateforme.',
        'Vous vous engagez à respecter les principes de minimisation et de sécurité prévus par la loi béninoise en matière de protection des données.',
      ],
    },
    {
      heading: '9. Modification et résiliation',
      paragraphs: [
        'L-ARTIS peut modifier le présent règlement ; une nouvelle acceptation pourra être requise.',
        'Vous pouvez demander la fermeture de votre compte ; la suppression de la fiche publique interviendra après traitement des demandes en cours.',
      ],
    },
  ],
};
