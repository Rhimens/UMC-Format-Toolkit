// src/utils/banlistUtils.js

export function getBanlistViolations(deck, banlist) {
  const violations = [];

  if (!deck || !Array.isArray(deck)) return violations;
  if (!banlist) return violations;

  const cardCounts = {};
  deck.forEach((card) => {
    cardCounts[card.id] = (cardCounts[card.id] || 0) + 1;
  });

  for (const [cardId, count] of Object.entries(cardCounts)) {
    const limit = banlist[cardId];
    if (limit !== undefined && count > limit) {
      violations.push(`Too many copies of ${deck.find(c => c.id === parseInt(cardId)).name}`);
    }
  }

  // Add logic for combo bans, combo limits, etc. as needed

  return violations;
}
