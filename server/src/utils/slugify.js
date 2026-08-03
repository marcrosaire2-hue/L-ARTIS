/**
 * Slugify : convertit un texte en slug URL sûr (ASCII, minuscules, tirets).
 * Ex : "Plomberie Générale" -> "plomberie-generale"
 */
const slugify = (text) =>
  String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

module.exports = slugify;
