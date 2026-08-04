/**
 * Templates e-mail HTML (inline styles pour compatibilité clients mail).
 */

function layout(content) {
  return `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#1d4ed8;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;">L-ARTIS</h1>
              <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">La plateforme des artisans du Bénin</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#f9fafb;color:#6b7280;font-size:12px;">
              Cet e-mail a été envoyé par L-ARTIS. Si vous n'êtes pas à l'origine
              de cette action, ignorez simplement ce message.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(url, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
    <tr>
      <td style="background:#1d4ed8;border-radius:8px;">
        <a href="${url}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:bold;">${label}</a>
      </td>
    </tr>
  </table>`;
}

/**
 * Vérification d'adresse e-mail.
 */
function verifyEmailTemplate(code, name) {
  return layout(`
    <h2 style="margin:0 0 16px;color:#111827;">Confirmez votre adresse e-mail</h2>
    <p style="color:#374151;line-height:1.6;">Bonjour ${name},</p>
    <p style="color:#374151;line-height:1.6;">
      Merci de vous être inscrit sur L-ARTIS. Saisissez le code ci-dessous
      dans l'application ou sur le site pour vérifier votre adresse.
    </p>
    <p style="margin:28px 0;text-align:center;">
      <span style="display:inline-block;letter-spacing:8px;font-size:32px;font-weight:bold;color:#111827;background:#f3f4f6;padding:16px 24px;border-radius:12px;font-family:Consolas,Monaco,monospace;">${code}</span>
    </p>
    <p style="color:#6b7280;font-size:13px;text-align:center;">Ce code expire dans 15 minutes.</p>
    <p style="color:#9ca3af;font-size:13px;">Si vous n'êtes pas à l'origine de cette inscription, ignorez cet e-mail.</p>
  `);
}

/**
 * Réinitialisation du mot de passe.
 */
function resetPasswordTemplate(url, name, appUrl) {
  return layout(`
    <h2 style="margin:0 0 16px;color:#111827;">Réinitialisation du mot de passe</h2>
    <p style="color:#374151;line-height:1.6;">Bonjour ${name},</p>
    <p style="color:#374151;line-height:1.6;">
      Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton
      ci-dessous pour en choisir un nouveau.
    </p>
    <p style="color:#6b7280;font-size:13px;">Ce lien expire dans 1 heure.</p>
    ${button(url, "Réinitialiser mon mot de passe")}
    ${appUrl ? `<p style="color:#6b7280;font-size:13px;text-align:center;">Ou ouvrez dans l'application L-ARTIS :<br/><a href="${appUrl}" style="color:#1d4ed8;">${appUrl}</a></p>` : ''}
    <p style="color:#9ca3af;font-size:13px;">Si le bouton ne fonctionne pas, copiez ce lien :
      <br/>${url}</p>
  `);
}

/**
 * E-mail après confirmation de l'adresse : le profil artisan attend la validation admin.
 */
function pendingValidationTemplate(name) {
  return layout(`
    <h2 style="margin:0 0 16px;color:#111827;">E-mail confirmé — validation en cours</h2>
    <p style="color:#374151;line-height:1.6;">Bonjour ${name},</p>
    <p style="color:#374151;line-height:1.6;">
      Merci d'avoir confirmé votre adresse. Votre inscription artisan est bien enregistrée.
      Notre équipe examine votre profil avant publication (en général sous 24 à 48 h).
    </p>
    <p style="color:#374151;line-height:1.6;">
      Merci de patienter : vous recevrez un e-mail de bienvenue dès que votre compte sera validé.
    </p>
  `);
}

/**
 * Bienvenue (client après vérif e-mail, artisan après validation admin).
 */
function welcomeTemplate(name, role) {
  return layout(`
    <h2 style="margin:0 0 16px;color:#111827;">Bienvenue sur L-ARTIS</h2>
    <p style="color:#374151;line-height:1.6;">Bonjour ${name},</p>
    <p style="color:#374151;line-height:1.6;">
      ${role === 'artisan'
        ? 'Votre profil artisan a été validé par notre équipe. Il est désormais visible par les clients : vous pouvez recevoir des demandes de devis et gérer votre espace artisan.'
        : 'Votre compte client est prêt. Vous pouvez dès maintenant rechercher un artisan de confiance près de chez vous.'}
    </p>
  `);
}

/**
 * Statut du profil artisan après décision de l'administrateur.
 */
function artisanStatusTemplate(name, status, reason = '') {
  const content =
    status === 'validated'
      ? `<p style="color:#374151;line-height:1.6;">Votre profil a été validé et est désormais visible par les clients. Vous pouvez commencer à recevoir des demandes de devis.</p>`
      : status === 'rejected'
        ? `<p style="color:#374151;line-height:1.6;">Votre profil a été refusé. ${reason ? `Motif : <strong>${reason}</strong>` : 'Veuillez corriger les informations puis le soumettre à nouveau.'}</p>`
        : `<p style="color:#374151;line-height:1.6;">Votre profil a été suspendu. ${reason ? `Motif : <strong>${reason}</strong>` : 'Contactez le support pour plus d\'informations.'}</p>`;

  const title =
    status === 'validated'
      ? 'Votre profil est publié !'
      : status === 'rejected'
        ? 'Profil refusé'
        : 'Profil suspendu';

  return layout(`
    <h2 style="margin:0 0 16px;color:#111827;">${title}</h2>
    <p style="color:#374151;line-height:1.6;">Bonjour ${name},</p>
    ${content}
  `);
}

module.exports = {
  verifyEmailTemplate,
  resetPasswordTemplate,
  pendingValidationTemplate,
  welcomeTemplate,
  artisanStatusTemplate,
};
