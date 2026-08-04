import { TERMS_VERSION } from './termsVersion';

/** Règlement d'utilisation — clients. */

export const REGLEMENT_CLIENT = {
  title: 'Règlement d’utilisation — Client',
  version: TERMS_VERSION,
  audience: 'client',
  sections: [
    {
      heading: '1. Acceptation',
      paragraphs: [
        'En créant un compte client sur L-ARTIS, vous acceptez le présent règlement dans sa version en vigueur (version ' +
          TERMS_VERSION +
          ').',
        'Si vous n’acceptez pas ces conditions, vous ne devez pas utiliser la plateforme.',
      ],
    },
    {
      heading: '2. Service proposé',
      paragraphs: [
        'L-ARTIS met à votre disposition un annuaire d’artisans, un système de demande de devis, de messagerie et d’avis.',
        'Le service est fourni « en l’état ». L-ARTIS ne garantit pas la disponibilité permanente ni l’aptitude d’un artisan à réaliser une prestation.',
      ],
    },
    {
      heading: '3. Compte et sécurité',
      paragraphs: [
        'Vous vous engagez à fournir des informations exactes et à maintenir la confidentialité de vos identifiants.',
        'Vous êtes responsable de toute activité réalisée depuis votre compte. Signalez immédiatement toute utilisation non autorisée.',
        'Conformément au Code du numérique (loi 2017-20), L-ARTIS peut suspendre ou fermer un compte en cas de fraude, usurpation d’identité ou comportement abusif.',
      ],
    },
    {
      heading: '4. Demandes de devis et relations avec les artisans',
      paragraphs: [
        'Les devis transmis via L-ARTIS n’engagent l’artisan qu’après acceptation explicite de sa part.',
        'Les prix, délais et conditions convenus le sont directement entre vous et l’artisan. L-ARTIS n’encaisse pas les paiements de prestation sauf mention contraire future.',
        'Vous vous engagez à ne pas solliciter indûment les artisans ni à utiliser leurs coordonnées à des fins de spam ou de démarchage commercial non consenti.',
      ],
    },
    {
      heading: '5. Avis et contenus',
      paragraphs: [
        'Les avis doivent refléter une expérience réelle, être loyaux et ne pas contenir de propos diffamatoires, injurieux, discriminatoires ou illicites.',
        'L-ARTIS se réserve le droit de modérer, masquer ou supprimer tout contenu contraire au présent règlement ou à la loi béninoise.',
      ],
    },
    {
      heading: '6. Signalements',
      paragraphs: [
        'Vous pouvez signaler tout profil, message ou contenu suspect via la fonctionnalité dédiée. L-ARTIS examine les signalements de bonne foi dans un délai raisonnable.',
      ],
    },
    {
      heading: '7. Données personnelles',
      paragraphs: [
        'Vos données sont traitées conformément au livre IV du Code du numérique. Seules les informations nécessaires à la mise en relation sont partagées avec les artisans que vous contactez.',
        'Vous pouvez demander la suppression de votre compte à tout moment depuis les paramètres du compte.',
      ],
    },
    {
      heading: '8. Modification et résiliation',
      paragraphs: [
        'L-ARTIS peut faire évoluer le présent règlement. En cas de modification substantielle, une nouvelle acceptation pourra vous être demandée.',
        'Vous pouvez cesser d’utiliser le service et supprimer votre compte à tout moment.',
      ],
    },
  ],
};
