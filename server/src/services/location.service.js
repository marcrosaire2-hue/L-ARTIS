/**
 * Service géographie — référentiel Bénin (département -> commune -> quartier).
 * Alimente les listes déroulantes d'inscription et les filtres de recherche.
 *
 * Si la collection Location est vide (seed non exécuté en prod), on sert le
 * référentiel statique embarqué pour ne pas bloquer l'inscription.
 */
const { Location } = require('../models');
const staticGeo = require('../data/beninGeography');

/**
 * Départements avec leurs communes, en une seule requête.
 * Retourne [{ department, communes: [...] }] trié alphabétiquement.
 */
async function listDepartments() {
  const rows = await Location.aggregate([
    { $match: { commune: { $ne: '' } } },
    { $group: { _id: '$department', communes: { $addToSet: '$commune' } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, department: '$_id', communes: 1 } },
  ]);

  if (!rows.length) {
    return staticGeo.listDepartments();
  }

  return rows.map((row) => ({
    department: row.department,
    communes: row.communes.sort((a, b) => a.localeCompare(b, 'fr')),
  }));
}

/**
 * Quartiers d'une commune (vide si la commune n'en référence aucun).
 */
async function listDistricts(commune) {
  const districts = await Location.distinct('district', {
    commune,
    district: { $ne: '' },
  });

  if (!districts.length) {
    return staticGeo.listDistricts(commune);
  }

  return districts.sort((a, b) => a.localeCompare(b, 'fr'));
}

module.exports = { listDepartments, listDistricts };
