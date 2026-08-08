import { TERMS_EFFECTIVE_DATE, TERMS_VERSION } from './termsVersion';

/**
 * Règlement adressé aux artisans — obligations professionnelles sur une
 * place de marché numérique au Bénin (Code du numérique, Livre IV & V).
 */
export const reglementArtisan = {
  audience: 'artisan',
  title: 'Règlement applicable aux artisans',
  subtitle: `Version ${TERMS_VERSION} — en vigueur au ${TERMS_EFFECTIVE_DATE}`,
  intro:
    'Le présent règlement encadre l’utilisation de L-ARTIS par tout professionnel ou artisan souhaitant présenter ses services sur la plateforme. En créant un compte et en validant ce document, vous acceptez ces règles et vous engagez à respecter la loi n° 2017-20 portant Code du numérique en République du Bénin, ainsi que la réglementation applicable à votre activité.',
  sections: [
    {
      title: '1. Objet et statut',
      paragraphs: [
        'L-ARTIS met en relation des clients et des artisans. En vous inscrivant, vous agissez en qualité de professionnel offrant des prestations artisanales sur le territoire de la République du Bénin.',
        'Vous demeurez seul responsable de vos prestations, de vos devis, de vos prix et de la relation contractuelle avec vos clients.',
        'L-ARTIS n’est pas votre employeur, ni votre mandataire commercial exclusif, sauf convention écrite contraire.',
      ],
    },
    {
      title: '2. Conditions d’inscription et validation',
      paragraphs: [
        'Vous devez être majeur et habilité à exercer votre métier selon le droit béninois et, le cas échéant, les règles professionnelles applicables à votre corps de métier.',
        'Les informations fournies (identité, nom commercial, métiers, localisation, contacts, photos, tarifs) doivent être exactes, loyales et à jour.',
        'Votre fiche n’est publiée qu’après validation par l’équipe L-ARTIS. L-ARTIS peut refuser, suspendre ou retirer une fiche en cas d’informations inexactes, de non-conformité ou de signalement fondé.',
        'Le numéro de téléphone fourni est votre identifiant de connexion et le contact visible par les clients : vous devez pouvoir y être joint.',
      ],
    },
    {
      title: '3. Obligations d’information (commerce électronique)',
      paragraphs: [
        'En tant que professionnel présent sur une plateforme électronique, vous devez, conformément au Code du numérique, mettre à disposition des clients les informations essentielles : identité / nom commercial, coordonnées, description claire des prestations, modalités de devis et, lorsque cela s’applique, prix TTC ou bases de calcul.',
        'Les photos et descriptions doivent correspondre fidèlement à votre activité réelle. Toute publicité trompeuse est interdite.',
        'Lorsque vous émettez un devis ou une offre, vous précisez les éléments essentiels : nature des travaux, prix ou fourchette, délais approximatifs, conditions de paiement et de réalisation.',
      ],
    },
    {
      title: '4. Qualité des prestations et garanties',
      paragraphs: [
        'Vous vous engagez à exécuter les prestations avec diligence, dans le respect des règles de l’art et des normes de sécurité applicables.',
        'Vous êtes tenu aux garanties légales envers le consommateur (conformité, vices cachés, éviction le cas échéant), conformément au droit béninois et à la loi n° 2007-21 portant protection du consommateur.',
        'Vous assumez seul les litiges nés de l’exécution de vos prestations, sans préjudice du droit de L-ARTIS de suspendre votre compte en cas de manquements répétés ou graves.',
      ],
    },
    {
      title: '5. Conduite sur la plateforme',
      paragraphs: [
        'Il est interdit de : publier des contenus illicites ; usurper l’identité d’un tiers ; détourner des données clients à des fins non liées à la prestation ; harceler des utilisateurs ; contourner la validation ou les mesures de sécurité ; créer de faux avis.',
        'Vous devez répondre aux demandes des clients dans un délai raisonnable et avec courtoisie.',
        'Toute tentative de fraude, d’escroquerie ou d’usurpation entraînera la suspension immédiate du compte et pourra faire l’objet d’un signalement aux autorités.',
      ],
    },
    {
      title: '6. Relation commerciale et paiements',
      paragraphs: [
        'Les paiements des prestations se déroulent hors plateforme, sauf si L-ARTIS propose ultérieurement un module de paiement expressément activé.',
        'Vous êtes responsable du respect de vos obligations fiscales et sociales liées à votre activité (déclarations, IFU, etc.).',
        'L-ARTIS peut proposer des services payants aux artisans (mise en avant, options) : les conditions tarifaires seront alors communiquées distinctement avant tout engagement.',
      ],
    },
    {
      title: '7. Données personnelles et confidentialité',
      paragraphs: [
        'Vous traitez les données des clients que vous recevez via L-ARTIS (nom, téléphone, e-mail, détails de demande) uniquement pour répondre à leurs sollicitations et exécuter les prestations.',
        'Conformément au Livre V du Code du numérique, vous vous interdisez de revendre, publier ou réutiliser ces données à des fins de prospection non sollicitée ou de toute autre finalité incompatible.',
        'L-ARTIS traite vos données professionnelles pour publier votre fiche, sécuriser le compte et assurer le support. Vous pouvez demander la rectification ou la suppression de votre compte, sous réserve des obligations légales de conservation.',
      ],
    },
    {
      title: '8. Propriété intellectuelle et contenus',
      paragraphs: [
        'Vous garantissez disposer des droits sur les photos et textes que vous publiez. Vous concédez à L-ARTIS une licence non exclusive, mondiale et gratuite, pour afficher ces contenus sur la plateforme et dans les communications liées au service.',
        'La marque et les éléments de L-ARTIS restent la propriété exclusive de l’éditeur.',
      ],
    },
    {
      title: '9. Responsabilité de la plateforme',
      paragraphs: [
        'L-ARTIS fournit un outil de mise en relation et de présentation. Elle ne garantit pas un volume de demandes ni le comportement des clients.',
        'En tant qu’hébergeur de contenus utilisateur au sens du Code du numérique, L-ARTIS n’a pas d’obligation générale de surveillance, mais peut retirer un contenu signalé comme manifestement illicite.',
        'La responsabilité de L-ARTIS est limitée aux dommages directs résultant d’une faute prouvée dans la fourniture du service technique de plateforme.',
      ],
    },
    {
      title: '10. Suspension, résiliation et modifications',
      paragraphs: [
        'Vous pouvez demander la fermeture de votre compte à tout moment.',
        'L-ARTIS peut suspendre ou résilier l’accès en cas de violation du présent règlement, de rejet définitif de validation, de fraude ou sur injonction des autorités.',
        'L-ARTIS peut faire évoluer le règlement. En cas de modification substantielle, vous en serez informé et pourrez devoir accepter la nouvelle version pour continuer à utiliser le service.',
      ],
    },
    {
      title: '11. Droit applicable',
      paragraphs: [
        'Le présent règlement est régi par le droit de la République du Bénin, notamment la loi n° 2017-20 portant Code du numérique.',
        'Tout litige relatif à l’utilisation de L-ARTIS par un artisan fera l’objet d’une tentative de règlement amiable avant saisine des juridictions compétentes du Bénin.',
      ],
    },
  ],
  acceptanceLabel:
    'J’ai lu et j’accepte le règlement applicable aux artisans de L-ARTIS, ainsi que les mentions légales. Je m’engage à fournir des informations exactes, à respecter mes obligations professionnelles et à traiter loyalement les données des clients.',
};
