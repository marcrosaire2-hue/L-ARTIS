import { TERMS_EFFECTIVE_DATE, TERMS_VERSION } from './termsVersion';

/**
 * Règlement adressé aux clients — conforme aux principes du Code du numérique
 * (Livre IV commerce électronique, Livre V données personnelles) et à la
 * protection du consommateur au Bénin.
 */
export const reglementClient = {
  audience: 'client',
  title: 'Règlement applicable aux clients',
  subtitle: `Version ${TERMS_VERSION} — en vigueur au ${TERMS_EFFECTIVE_DATE}`,
  intro:
    'Le présent règlement encadre l’utilisation de L-ARTIS par toute personne physique ou morale agissant en qualité de client. En créant un compte et en cochant l’acceptation, vous reconnaissez avoir lu, compris et accepté l’intégralité de ces dispositions, conformément à la loi n° 2017-20 portant Code du numérique en République du Bénin.',
  sections: [
    {
      title: '1. Objet et champ d’application',
      paragraphs: [
        'L-ARTIS est une plateforme numérique de mise en relation entre clients et artisans établis au Bénin. Elle permet de rechercher des artisans, consulter leurs fiches, les contacter et, le cas échéant, demander un devis.',
        'Le présent règlement s’applique à toute utilisation du service via le site web ou l’application mobile L-ARTIS.',
        'L-ARTIS n’est pas le prestataire des travaux artisanaux : le contrat de service est conclu entre vous et l’artisan choisi.',
      ],
    },
    {
      title: '2. Inscription et compte',
      paragraphs: [
        'L’inscription est réservée aux personnes capables de contracter selon le droit béninois. Les mineurs doivent être représentés par un tuteur légal.',
        'Vous devez fournir des informations exactes et à jour : identité, numéro de téléphone béninois (identifiant de connexion) et adresse e-mail valide.',
        'Vous êtes responsable de la confidentialité de votre mot de passe et de toute activité réalisée depuis votre compte. Signalez immédiatement tout usage non autorisé.',
        'Un seul compte client par personne est autorisé, sauf accord préalable de L-ARTIS.',
      ],
    },
    {
      title: '3. Informations précontractuelles (commerce électronique)',
      paragraphs: [
        'Conformément au Livre IV du Code du numérique, avant toute conclusion d’un contrat de prestation avec un artisan, les informations essentielles doivent être accessibles : identité et coordonnées de l’artisan, nature de la prestation, prix ou modalités d’établissement du devis, et conditions principales de réalisation lorsque l’artisan les publie.',
        'Les devis, prix et délais communiqués par l’artisan lui sont opposables dans les conditions qu’il a indiquées. L-ARTIS ne garantit pas le contenu des offres émises par les artisans.',
        'Conservez une trace écrite (message, devis) des engagements pris avec l’artisan.',
      ],
    },
    {
      title: '4. Utilisation du service',
      paragraphs: [
        'Vous vous engagez à utiliser L-ARTIS de bonne foi, uniquement pour rechercher et solliciter des prestations artisanales légitimes.',
        'Il est interdit de : harceler un artisan ; publier des contenus diffamatoires, discriminatoires ou illicites ; usurper l’identité d’autrui ; tenter d’accéder aux systèmes de manière non autorisée ; collecter des données d’autres utilisateurs à des fins commerciales sans autorisation.',
        'Les avis éventuels doivent être sincères, fondés sur une expérience réelle, et ne pas contenir de propos injurieux.',
      ],
    },
    {
      title: '5. Relation avec l’artisan et paiements',
      paragraphs: [
        'Les modalités de paiement, d’acompte, de réalisation et de garantie sont convenues directement entre vous et l’artisan.',
        'Sauf mention contraire explicite, L-ARTIS n’encaisse pas le prix des prestations et n’agit pas comme établissement de paiement.',
        'En cas de litige sur la qualité ou l’exécution d’une prestation, contactez d’abord l’artisan. L-ARTIS peut, sans obligation, faciliter un dialogue ou suspendre un compte en cas de manquement grave signalé.',
      ],
    },
    {
      title: '6. Protection du consommateur',
      paragraphs: [
        'Lorsque vous agissez en tant que consommateur au sens de la loi n° 2007-21 portant protection du consommateur au Bénin, vous bénéficiez des droits qui y sont attachés (information, conformité, recours).',
        'L’artisan professionnel est tenu aux garanties légales applicables à sa prestation (conformité, vices cachés, etc.), dans les limites du droit béninois.',
        'Le droit de rétractation prévu par le Code du numérique s’applique selon la nature du contrat à distance conclu avec l’artisan et les exceptions légales (notamment prestations déjà entièrement exécutées avec votre accord).',
      ],
    },
    {
      title: '7. Données personnelles',
      paragraphs: [
        'L-ARTIS traite vos données (identité, téléphone, e-mail, localisation éventuellement renseignée, historiques d’usage) pour fournir le service, sécuriser les comptes et respecter ses obligations légales.',
        'Base légale principale : exécution du contrat de service (compte) et intérêt légitime de sécurité ; consentement lorsque requis.',
        'Vos données ne sont pas vendues. Elles peuvent être communiquées à l’artisan que vous contactez (dans la limite nécessaire à la mise en relation) et aux autorités lorsqu’une obligation légale l’exige.',
        'Vous pouvez demander l’accès, la rectification ou la suppression de vos données, et supprimer votre compte depuis l’espace « Mon compte ».',
      ],
    },
    {
      title: '8. Disponibilité, sécurité et responsabilité',
      paragraphs: [
        'L-ARTIS s’efforce d’assurer un service accessible et sécurisé, sans garantir une disponibilité continue ni l’absence d’erreurs.',
        'L-ARTIS n’est pas responsable des dommages résultant des prestations fournies par les artisans, ni des litiges purement contractuels entre client et artisan, sauf faute prouvée de la plateforme dans l’exécution de son propre service de mise en relation.',
        'La responsabilité de L-ARTIS, lorsqu’elle est engagée, est limitée aux dommages directs prévisibles liés à l’usage du service.',
      ],
    },
    {
      title: '9. Suspension et résiliation',
      paragraphs: [
        'Vous pouvez supprimer votre compte à tout moment.',
        'L-ARTIS peut suspendre ou clôturer un compte en cas de violation du présent règlement, de fraude, d’atteinte à la sécurité ou sur demande des autorités compétentes.',
      ],
    },
    {
      title: '10. Droit applicable',
      paragraphs: [
        'Le présent règlement est régi par le droit de la République du Bénin, notamment la loi n° 2017-20 portant Code du numérique.',
        'Tout litige relatif au service L-ARTIS fera l’objet d’une tentative de règlement amiable avant saisine des juridictions compétentes du Bénin.',
      ],
    },
  ],
  acceptanceLabel:
    'J’ai lu et j’accepte le règlement applicable aux clients de L-ARTIS, ainsi que les mentions légales. Je reconnais que L-ARTIS est une plateforme de mise en relation et que le contrat de prestation est conclu avec l’artisan.',
};
