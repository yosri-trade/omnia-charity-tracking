/**
 * Génère une histoire d'impact narrative à partir des données famille + visites.
 * @param {Object} family - Famille (name, address, membersCount, familyHistory, needsDetails, status)
 * @param {Array} visits - Liste des visites (pour compter les interventions)
 * @returns {string} Texte narratif
 */
export function generateImpactStory(family, visits = []) {
  const parts = [];

  const count = Math.max(1, Number(family.membersCount) || 1);
  const address = (family.address || '').trim();
  let place = address;
  if (address.includes(',')) {
    place = address.split(',')[0].trim();
  }
  if (!place) place = 'cette zone';

  parts.push(`Famille de ${count} personne${count > 1 ? 's' : ''}, résidant à ${place}.`);

  const history = (family.familyHistory || '').trim();
  if (history) {
    parts.push(`Initialement signalée pour : ${history}.`);
  }

  const completedCount = Array.isArray(visits)
    ? visits.filter((v) => v.status === 'COMPLETED' || !v.status).length
    : 0;
  parts.push(`A bénéficié de ${completedCount} visite${completedCount !== 1 ? 's' : ''} à ce jour.`);

  const nd = family.needsDetails || {};
  const medications = nd.medications || [];
  const clothing = nd.clothing || [];

  if (medications.length > 0) {
    const list = medications.filter(Boolean).join(', ');
    if (list) {
      parts.push(`Un soutien médical spécifique a été apporté (${list}).`);
    }
  }

  if (clothing.length > 0) {
    const childrenCount = clothing.filter((c) => c.type === 'Enfant').length;
    const total = clothing.length;
    if (childrenCount > 0) {
      parts.push(
        `Des vêtements ont été fournis pour ${total} membre${total > 1 ? 's' : ''} (dont ${childrenCount} enfant${childrenCount > 1 ? 's' : ''}).`
      );
    } else {
      parts.push(
        `Des vêtements ont été fournis pour ${total} membre${total > 1 ? 's' : ''}.`
      );
    }
  }

  if (family.status === 'URGENT') {
    parts.push('La situation reste critique et nécessite un suivi immédiat.');
  } else {
    parts.push('La situation est en cours de stabilisation.');
  }

  return parts.join(' ');
}
