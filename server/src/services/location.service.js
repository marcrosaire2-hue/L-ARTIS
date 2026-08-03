/**
 * Service géographie — référentiel Bénin (département -> commune -> quartier).
 * Alimente les listes déroulantes d'inscription et les filtres de recherche.
 */
const { Location } = require('../models');

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
  return districts.sort((a, b) => a.localeCompare(b, 'fr'));
}

module.exports = { listDepartments, listDistricts };
