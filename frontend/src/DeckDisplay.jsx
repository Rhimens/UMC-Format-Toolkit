import React from "react";
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
  
    // Inject local banlist directly
    const activeBanlist = banlist;  

  return (
    <div className="deck-builder-layout">

      {/* Right column: Banlist */}
      
        <div className="banlist-section">
        <h2>Ban List</h2>
        <p><strong>{activeBanlist?.name || "UMC | March 3, 2025"}</strong></p>

            {["forbidden", "limited", "semi_limited", "combo_ban", "combo_limited", "synergy_limited", "restricted", "soft_restricted"].map((category) =>
            activeBanlist?.[category]?.length > 0 ? (
            <div key={category} style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontWeight: 'bold', ...(banlistCategoryStyles[category] || {}) }}>
                {banlistCategoryDisplay[category] || category.replace(/_/g, ' ')}
                </h4>
                <ul>
                {activeBanlist[category].map((item, idx) => (
                    <li key={idx}>
                    {Array.isArray(item) ? item.join(" + ") : item}
                    </li>
                ))}
                </ul>
            </div>
            ) : null
            )}
        </div>

    </div>
  );
}
