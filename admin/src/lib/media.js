/**
 * Résolution d'URL média — indépendante du fournisseur de stockage.
 * Cloudinary renvoie des URL absolues ; un stockage local (dossier
 * `/uploads/...`) renverrait des chemins relatifs à préfixer avec l'API.
 */
export function mediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v\d+$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
