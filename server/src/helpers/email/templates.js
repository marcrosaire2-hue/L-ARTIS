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
              <h1 style="margin:0;color:#ffffff;font-size:22px;">Artisans Marketplace</h1>
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
              Cet e-mail a été envoyé par Artisans Marketplace. Si vous n'êtes pas à l'origine
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
function verifyEmailTemplate(url, name) {
  return layout(`
    <h2 style="margin:0 0 16px;color:#111827;">Confirmez votre adresse e-mail</h2>
    <p style="color:#374151;line-height:1.6;">Bonjour ${name},</p>
    <p style="color:#374151;line-height:1.6;">
      Merci de vous être inscrit sur Artisans Marketplace. Pour activer votre compte,
      veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous.
    </p>
    <p style="color:#6b7280;font-size:13px;">Ce lien expire dans 24 heures.</p>
    ${button(url, "Confirmer mon adresse e-mail")}
    <p style="color:#9ca3af;font-size:13px;">Si le bouton ne fonctionne pas, copiez ce lien :
      <br/>${url}</p>
  `);
}

/**
 * Réinitialisation du mot de passe.
 */
function resetPasswordTemplate(url, name) {
  return layout(`
    <h2 style="margin:0 0 16px;color:#111827;">Réinitialisation du mot de passe</h2>
    <p style="color:#374151;line-height:1.6;">Bonjour ${name},</p>
    <p style="color:#374151;line-height:1.6;">
      Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton
      ci-dessous pour en choisir un nouveau.
    </p>
    <p style="color:#6b7280;font-size:13px;">Ce lien expire dans 1 heure.</p>
    ${button(url, "Réinitialiser mon mot de passe")}
    <p style="color:#9ca3af;font-size:13px;">Si le bouton ne fonctionne pas, copiez ce lien :
      <br/>${url}</p>
  `);
}

/**
 * Bienvenue.
 */
function welcomeTemplate(name, role) {
  return layout(`
    <h2 style="margin:0 0 16px;color:#111827;">Bienvenue sur Artisans Marketplace 🎉</h2>
    <p style="color:#374151;line-height:1.6;">Bonjour ${name},</p>
    <p style="color:#374151;line-height:1.6;">
      Votre compte ${role === 'artisan' ? "d'artisan" : 'client'} a bien été créé.
      ${role === 'artisan'
        ? 'Votre profil sera publié après validation par notre équipe (24 à 48 h en moyenne).'
        : 'Vous pouvez dès maintenant rechercher un artisan près de chez vous.'}
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

module.exports = { verifyEmailTemplate, resetPasswordTemplate, welcomeTemplate, artisanStatusTemplate };
