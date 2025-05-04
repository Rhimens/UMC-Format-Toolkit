import React, { useState } from "react";
import CardList from "./components/CardList";
import DeckDisplay from "./DeckDisplay";
import "./App.css"; // styling for the layout

export default function App() {
  const [deck, setDeck] = useState([]);

  return (
    
    <div className="app-container">
      {/* Middle column: Deck */}
      <div className="left-column">
        <DeckDisplay
          deck={deck}
          setDeck={setDeck}
        />
      </div>
      {/* Right column: Card list */}
      <div className="right-column">
        <CardList deck={deck} setDeck={setDeck} />
      </div>
    </div>
  );
}
