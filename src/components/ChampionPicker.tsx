import type { CSSProperties } from "react";
import { portraitUrl, type Champion } from "../../shared/champions";

interface ChampionPickerProps {
  champions: Champion[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ChampionPicker({ champions, selectedId, onSelect }: ChampionPickerProps) {
  return (
    <nav className="picker" aria-label="Champions">
      <ul className="picker__list">
        {champions.map((champion) => (
          <li key={champion.id}>
            <button
              type="button"
              className="picker__item"
              aria-pressed={champion.id === selectedId}
              onClick={() => onSelect(champion.id)}
              style={{ "--item-accent": champion.accent } as CSSProperties}
            >
              <img className="picker__portrait" src={portraitUrl(champion.id)} alt="" width={48} height={48} />
              <span className="picker__text">
                <span className="picker__name">{champion.name}</span>
                <span className="picker__title">{champion.title}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
