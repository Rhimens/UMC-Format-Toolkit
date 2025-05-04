import React, { useEffect, useState } from 'react';
import axios from 'axios';

function CardList() {
  const [banlist, setBanlist] = useState(null);
  const [cards, setCards] = useState([]);
  const [cardSearch, setCardSearch] = useState('');
  const [openCardId, setOpenCardId] = useState(null);
  const [deck, setDeck] = useState([]); 
  const [sideDeck, setSideDeck] = useState([]); 
  const [banViolations, setBanViolations] = useState({});

  const [searchFields, setSearchFields] = useState({
    name: true,
    text: true,
    genre: true
  });

  const toggleSearchField = (field) => {
    setSearchFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  
  

  const violationRules = {
    forbidden: 'This card is Forbidden and cannot be included in any deck.',
    limited: 'This card is Limited (max. 1 copy).',
    semi_limited: 'This card is Semi-Limited (max. 2 copies).',
    combo_banned: 'These cards cannot be in the same deck together.',
    restricted: 'You can include only 1 copy of 1 card from this group.',
    soft_restricted: 'You can only include up to 3 total cards from this group, and only one of each.',
    combo_limited: 'Each card in this group is limited to 1 copy when they are in a deck together.',
    synergy_limited: 'Each card in this group is limited to 1 copy when any of them are in a deck together.',
    deck_limit: 'Your main deck must not exceed 60 cards.',
    extra_limit: 'Your extra deck must not exceed 15 cards.',
    side_limit: 'Your side deck must not exceed 15 cards.',
    max_copy: 'No card may appear more than 3 times in a deck.'
  };

  function toTitleCase(str) {
    return str.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1));
  }

  useEffect(() => {
    if (!banlist || !Array.isArray(deck)) return;
    const combinedDeck = [...deck, ...sideDeck];
    const newViolations = checkBanViolations(combinedDeck, banlist);
    setBanViolations(newViolations);
  }, [deck, sideDeck, banlist]);

  function addToSideDeck(card) {
    setSideDeck([...sideDeck, card]);
  }

  function removeFromSideDeck(index) {
    const updated = [...sideDeck];
    updated.splice(index, 1);
    setSideDeck(updated);
  }
  
  const typeOrder = { "Monster": 0, "Spell": 1, "Trap": 2, "Other": 3 };

  const getCardType = (card) => {
    if (!card || !card.type) return "Other";
    if (card.type.includes("Monster")) return "Monster";
    if (card.type.includes("Spell")) return "Spell";
    if (card.type.includes("Trap")) return "Trap";
    return "Other";
  };

  const sortDeckCards = (cards) => {
    return [...cards].sort((a, b) => {
      const aType = getCardType(a);
      const bType = getCardType(b);
      const typeDiff = typeOrder[aType] - typeOrder[bType];
      if (typeDiff !== 0) return typeDiff;
      const aName = a.full_data?.text?.en?.name?.toLowerCase() || '';
      const bName = b.full_data?.text?.en?.name?.toLowerCase() || '';
      return aName.localeCompare(bName);
    });
  };
  
  
  const addToDeck = (card) => {
    setDeck(prevDeck => sortDeckCards([...prevDeck, card]));
  };

  const removeFromDeck = (card) => {
    const index = deck.findIndex(c => c.uuid === card.uuid);
    if (index !== -1) {
      const newDeck = [...deck];
      newDeck.splice(index, 1);
      setDeck(sortDeckCards(newDeck));
    }
  };

  function checkBanViolations(deck, banlist) {
    const countByName = {};
    deck.forEach(card => {
      const name = card.full_data?.text?.en?.name?.toLowerCase?.();
      if (!name) return;
      countByName[name] = (countByName[name] || 0) + 1;
    });

    const violations = {
      forbidden: [],
      limited: [],
      semi_limited: [],
      combo_limited: [],
      synergy_limited: [],
      restricted: [],
      soft_restricted: [],
      combo_banned: [],
      deck_limit: [],
      extra_limit: [],
      side_limit: [],
      max_copy: []
    };

    for (const name in countByName) {
      const count = countByName[name];

      if (banlist.forbidden?.some(n => n.toLowerCase() === name) && count > 0) {
        violations.forbidden.push(name);
      }
      if (banlist.limited?.some(n => n.toLowerCase() === name) && count > 1) {
        violations.limited.push(name);
      }
      if (banlist.semi_limited?.some(n => n.toLowerCase() === name) && count > 2) {
        violations.semi_limited.push(name);
      }
      if (count > 3) {
        violations.max_copy.push(`${name} (${count})`);
      }
    }

    banlist.combo_limited?.forEach(group => {
      if (!Array.isArray(group)) return;
      const present = group.filter(name => countByName[name]);
      if (present.length >= 2) {
        present.forEach(name => {
          if (countByName[name] > 1) {
            violations.combo_limited.push(`${name} (${countByName[name]})`);
          }
        });
      }
    });

    banlist.synergy_limited?.forEach(group => {
      if (!Array.isArray(group)) return;
      const present = group.filter(name => countByName[name]);
      if (present.length >= 2) {
        present.forEach(name => {
          if (countByName[name] > 1) {
            violations.synergy_limited.push(`${name} (${countByName[name]})`);
          }
        });
      }
    });

    banlist.restricted?.forEach(group => {
      if (!Array.isArray(group)) return;
      const total = group.reduce((sum, name) => sum + (countByName[name] || 0), 0);
      if (total > 1) {
        const presentNames = group.filter(name => countByName[name]);
        violations.restricted.push(`${presentNames.join(' + ')} (${total})`);
      }
    });

    if (Array.isArray(banlist.restricted)) {
      banlist.restricted.forEach(entry => {
        if (Array.isArray(entry)) return;
        const name = entry.toLowerCase();
        if (countByName[name] > 1) {
          violations.restricted.push(name);
        }
      });

      const restrictedNames = banlist.restricted?.flat().map(name => name.toLowerCase()) || [];
      const restrictedCount = restrictedNames.reduce((sum, name) => sum + (countByName[name] || 0), 0);
      if (restrictedCount > 1) {
        const presentRestricted = restrictedNames.filter(name => countByName[name]);
        violations.restricted.push(`${presentRestricted.join(' + ')} (${restrictedCount})`);
      }
    }

    const softRestrictedNames = banlist.soft_restricted?.flat().map(n => n.toLowerCase()) || [];
    const presentSoftRestricted = softRestrictedNames.filter(name => countByName[name]);
    const totalSoftRestrictedCount = presentSoftRestricted.reduce((sum, name) => sum + (countByName[name] || 0), 0);
    const hasDuplicates = presentSoftRestricted.some(name => countByName[name] > 1);
    if (presentSoftRestricted.length > 1 && (totalSoftRestrictedCount > 3 || hasDuplicates)) {
      violations.soft_restricted.push(`${presentSoftRestricted.join(' + ')} (${totalSoftRestrictedCount})`);
    }

    banlist.combo_banned?.forEach(combo => {
      const lowerNames = deck.map(card => card.full_data?.text?.en?.name?.toLowerCase?.() || '');
      const normalizedCombo = combo.map(name => name.toLowerCase());
      if (normalizedCombo.every(name => lowerNames.includes(name))) {
        violations.combo_banned.push(combo.join(' + '));
      }
    });

    // Deck size limits
    const mainCount = deck.filter(card => {
      const types = card.full_data.classifications?.map(t => t.toLowerCase()) || [];
      return !(
        types.includes('fusion') ||
        types.includes('synchro') ||
        types.includes('xyz') ||
        types.includes('link')
      );
    }).length;

    const extraCount = deck.filter(card => {
      const types = card.full_data.classifications?.map(t => t.toLowerCase()) || [];
      return (
        types.includes('fusion') ||
        types.includes('synchro') ||
        types.includes('xyz') ||
        types.includes('link')
      );
    }).length;

    const sideCount = sideDeck.length;

    if (mainCount > 60) {
      violations.deck_limit.push(`Main Deck has ${mainCount} cards`);
    }
    if (extraCount > 15) {
      violations.extra_limit.push(`Extra Deck has ${extraCount} cards`);
    }
    if (sideCount > 15) {
      violations.side_limit.push(`Side Deck has ${sideCount} cards`);
    }

    return violations;
  }  

  useEffect(() => {
    axios.get('/enriched_cards.json')
      .then((response) => {
        setCards(response.data);
      })
      .catch((error) => {
        console.error('Failed to fetch cards:', error);
      });
  }, []);

  useEffect(() => {
    axios.get('/banlist.json')
      .then((response) => {
        setBanlist(response.data);
        console.log("Loaded banlist:", response.data);
      })
      .catch((error) => {
        console.error('Failed to fetch banlist:', error);
      });
  }, []);

  const getViolatingCardNames = () => {
    const names = new Set();
    for (const entries of Object.values(banViolations)) {
      for (const entry of entries) {
        const name = entry.split(' (')[0].split(' + ')[0].split(', ')[0];
        names.add(name);
      }
    }
    return names;
  };

  const violatingNames = getViolatingCardNames();

  const filteredCards = cards.filter(card => {
    const name = card.full_data?.text?.en?.name?.toLowerCase() || '';
    const text = card.full_data?.text?.en?.effect?.toLowerCase() || '';
    const genres = card.genres?.map(g => g.toLowerCase()) || [];
    const query = cardSearch.toLowerCase();
  
    return (
      (searchFields.name && name.includes(query)) ||
      (searchFields.text && text.includes(query)) ||
      (searchFields.genre && genres.some(g => g.includes(query)))
    );
  });
  

  const mainDeck = sortDeckCards(deck.filter(card => {
    const types = card.full_data.monsterCardTypes?.map(t => t.toLowerCase()) || [];
    return !(
      types.includes('fusion') ||
      types.includes('synchro') ||
      types.includes('xyz') ||
      types.includes('link')
    );
  }));
  
  const extraDeck = sortDeckCards(deck.filter(card => {
    const types = card.full_data.monsterCardTypes?.map(t => t.toLowerCase()) || [];
    return (
      types.includes('fusion') ||
      types.includes('synchro') ||
      types.includes('xyz') ||
      types.includes('link')
    );
  }));
  
  
  const exportDeckToYDK = () => {
    const main = [];
    const extra = [];
    const side = [];
  
    // Classify main and extra cards from deck
    deck.forEach(card => {
      const passcode = card.full_data.passwords?.[0];
      if (!passcode) return;
  
      const types = card.full_data.monsterCardTypes?.map(t => t.toLowerCase()) || [];
      const isExtraDeck =
        types.includes('fusion') ||
        types.includes('synchro') ||
        types.includes('xyz') ||
        types.includes('link');
  
      if (isExtraDeck) {
        extra.push(passcode);
      } else {
        main.push(passcode);
      }
    });
  
    // All side deck cards go in side
    sideDeck.forEach(card => {
      const passcode = card.full_data.passwords?.[0];
      if (!passcode) return;
      side.push(passcode);
    });
  
    const ydkLines = [
      '#Made with UMC Deck Toolkit',
      '#main',
      ...main,
      '#extra',
      ...extra,
      '!side',
      ...side
    ];
  
    const ydkContent = ydkLines.join('\n');
    const blob = new Blob([ydkContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deck.ydk';
    a.click();
    URL.revokeObjectURL(url);
  };  

  // BELOW IS RETURN FUNCTION
  // BELOW IS RETURN FUNCTION
  // BELOW IS RETURN FUNCTION
  // BELOW IS RETURN FUNCTION
  // BELOW IS RETURN FUNCTION  

  return (
    <div className="flex flex-row gap-4 p-4 max-w-screen-xl mx-auto">
  {/* LEFT: Deck Builder */}
  <div className="w-1/2 overflow-y-auto">
    {/* Deck Export + Violations */}
    {Object.entries(banViolations).map(([type, violations]) => (
      violations.length > 0 && (
        <div key={type} className="bg-red-100 text-yellow-800 p-2 rounded mt-2">
          ⚠️ {type.replace('_', ' ').toUpperCase()} Violations: ⚠️
          <ul className="list-disc pl-5">
            {violations.map((entry, i) => (
              <li key={i}>
                {toTitleCase(entry)}
                <div className="text-xs text-gray-600 italic">
                  {violationRules[type]}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )
    ))}
<div className="flex justify-center p-4 max-w-screen-xl mx-auto">
  <div className="rounded bg-gray-800 text-white p-4 text-xl font-bold">
    UMC Format Deck Toolkit
  </div>
</div>
    <button
      onClick={() => exportDeckToYDK(deck)}
      className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
    >
      Export to Duelingbook YDK
    </button>

    {/* Main Deck */}
    <h2 className="text-lg font-bold mt-8 mb-2">Main Deck ({mainDeck.length} cards)</h2>
    <div className="grid grid-cols-5 gap-2">
      {mainDeck.map((card) => {
        const isViolation = violatingNames.has(card.full_data.text.en.name);
        return (
          <div
            key={`${card.uuid}-${Math.random()}`}
            onClick={() => removeFromDeck(card)}
            className={`cursor-pointer border-2 rounded hover:border-red-500 transition ${isViolation ? 'border-red-600' : 'border-blue-300'}`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToSideDeck(card);
                removeFromDeck(card)
              }}
              className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              Move to Side
            </button>
            <img
              src={card.full_data.images?.[0]?.card}
              alt={card.full_data.text.en.name}
              className="w-full h-auto object-contain rounded"
            />
          </div>
        );
      })}
    </div>

    {/* Extra Deck */}
    <h2 className="text-lg font-bold mt-8 mb-2">Fusion Deck ({extraDeck.length} cards)</h2>
    <div className="grid grid-cols-5 gap-2">
      {extraDeck.map((card) => {
        const isViolation = violatingNames.has(card.full_data.text.en.name);
        return (
          <div
            key={`${card.uuid}-${Math.random()}`}
            onClick={() => removeFromDeck(card)}
            className={`cursor-pointer border-2 rounded hover:border-red-500 transition ${isViolation ? 'border-red-600' : 'border-blue-300'}`}
          >
            <img
              src={card.full_data.images?.[0]?.card}
              alt={card.full_data.text.en.name}
              className="w-full h-auto object-contain rounded"
            />
          </div>
        );
      })}
    </div>

    {/* Side Deck */}
    <h2 className="text-lg font-bold mt-8 mb-2">Side Deck ({sideDeck.length} cards)</h2>
    <div className="grid grid-cols-5 gap-2">
      {sideDeck.map((card, index) => {
        const isViolation = violatingNames.has(card.full_data.text.en.name);
        return (
          <div
            key={`${card.uuid}-${index}`}
            onClick={() => removeFromSideDeck(index)}
            className={`cursor-pointer border-2 rounded hover:border-red-500 transition ${isViolation ? 'border-red-600' : 'border-blue-300'}`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToDeck(card);
                removeFromSideDeck(index)
              }}
              className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              Move to Main
            </button>
            <img
              src={card.full_data.images?.[0]?.card}
              alt={card.full_data.text.en.name}
              className="w-full h-auto object-contain rounded"
            />
          </div>
        );
      })}
    </div>
  </div>

  {/* RIGHT: Card Search */}
  <div className="w-1/2 overflow-y-auto">
    <div className="flex gap-4 mb-4 items-center">
  <input
    type="text"
    value={cardSearch}
    onChange={e => setCardSearch(e.target.value)}
    placeholder="Search cards..."
    className="border px-2 py-1 rounded w-full"
  />
  <div className="flex gap-2 items-center">
    <label>
      <input
        type="checkbox"
        checked={searchFields.name}
        onChange={() => toggleSearchField('name')}
      /> Name
    </label>
    <label>
      <input
        type="checkbox"
        checked={searchFields.text}
        onChange={() => toggleSearchField('text')}
      /> Text
    </label>
    <label>
      <input
        type="checkbox"
        checked={searchFields.genre}
        onChange={() => toggleSearchField('genre')}
      /> Genre
    </label>
  </div>
</div>

    <div className="grid grid-cols-3 gap-2">
        {filteredCards.map((card) => (
          <div key={card.uuid} className="bg-white p-2 rounded shadow-md flex flex-col items-center">
            <div className="w-full max-w-[120px] aspect-[3/4] overflow-hidden cursor-pointer">
              <img
                src={card.full_data.images?.[0]?.card}
                alt={card.full_data?.text?.en?.name || 'Card'}
                className="w-full h-full object-contain"
                onClick={() => setOpenCardId(openCardId === card.uuid ? null : card.uuid)}
              />
            </div>
            <p className="text-xs text-center mt-2">{card.full_data?.text?.en?.name || 'Unnamed Card'}</p>
            <button
              onClick={() => addToDeck(card)}
              className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              Add to Deck
            </button>
            {openCardId === card.uuid && (
              <div className="mt-2 text-xs text-left w-full">
                {card.genres?.length > 0 ? (
                  <ul className="list-disc pl-4 mb-2">
                    {card.genres.map((genre, i) => (
                      <li key={i}>{genre}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="mb-2">No genres</div>
                )}
                <div className="italic">
                  {card.full_data.text?.en?.effect || 'No effect text available.'}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
  </div>
</div>
  );
}

export default CardList;
