import React, { useEffect, useState } from "react";
import "./DeckDisplay.css";
import banlist from './data/banlist.json'; // adjust path if needed

const formatCategory = (key) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

function sortDeckCards(cards) {
  if (!Array.isArray(cards)) return [];

  const typeOrder = { Monster: 0, Spell: 1, Trap: 2 };

  return [...cards].sort((a, b) => {
    const aType = a.type.includes("Monster") ? "Monster" : a.type.includes("Spell") ? "Spell" : "Trap";
    const bType = b.type.includes("Monster") ? "Monster" : b.type.includes("Spell") ? "Spell" : "Trap";

    if (aType !== bType) {
      return typeOrder[aType] - typeOrder[bType];
    }
    return a.name.localeCompare(b.name);
  });
}

const banlistCategoryDisplay = {
  forbidden: "Forbidden",
  limited: "Limited",
  semi_limited: "Semi-Limited",
  combo_ban: "Combo Banned",
  combo_limited: "Combo Limited",
  synergy_limited: "Synergy Limited",
  restricted: "Restricted",
  soft_restricted: "Soft Restricted"
};

const banlistCategoryStyles = {
  forbidden: { color: "red" },
  limited: { color: "orange" },
  semi_limited: { color: "goldenrod" },
  combo_ban: { color: "purple" },
  combo_limited: { color: "teal" },
  synergy_limited: { color: "blue" },
  restricted: { color: "blue" },
  soft_restricted: { color: "blue" },
};

export default function DeckDisplay({ deck = [] }) {
  const sortedDeck = sortDeckCards(deck);
  const activeBanlist = banlist;

  const [visibleCategories, setVisibleCategories] = useState(() =>
    Object.fromEntries(Object.keys(banlistCategoryDisplay).map((key) => [key, true]))
  );

  const [banlistTags, setBanlistTags] = useState({});

  // Build lookup of card IDs to tag names
  useEffect(() => {
    const tags = {};

    for (const [key, label] of Object.entries(banlistCategoryDisplay)) {
      const entries = activeBanlist[key] || [];

      if (key === "combo_ban" || key === "combo_limited" || key === "synergy_limited") {
        entries.forEach(group => {
          group.forEach(id => {
            tags[id] = label;
          });
        });
      } else {
        entries.forEach(id => {
          tags[id] = label;
        });
      }
    }

    setBanlistTags(tags);
  }, [activeBanlist]);

  return (
    <div className="deck-builder-layout">

      {/* Left column: Deck cards with tags */}
      <div className="deck-card-section">
      </div>

      {/* Right column: Banlist display */}
      <div className="banlist-section">
        <h2>Ban List</h2>
        <p><strong>{activeBanlist?.name || "UMC | March 3, 2025"}</strong></p>

        {Object.keys(banlistCategoryDisplay).map((category) => {
          const displayName = banlistCategoryDisplay[category];
          const categoryItems = activeBanlist?.[category] || [];

          if (categoryItems.length === 0) return null;

          return (
            <div key={category} style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>
                <input
                  type="checkbox"
                  checked={visibleCategories[category]}
                  onChange={() =>
                    setVisibleCategories(prev => ({
                      ...prev,
                      [category]: !prev[category]
                    }))
                  }
                />
                {' '}
                Show {displayName}
              </label>

              {visibleCategories[category] && (
                <>
                  <h4 style={{ fontWeight: 'bold', ...(banlistCategoryStyles[category] || {}) }}>
                    {displayName}
                  </h4>
                  <ul>
                    {categoryItems.map((item, idx) => (
                      <li key={idx}>
                        {Array.isArray(item) ? item.join(" + ") : item}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
