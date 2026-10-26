import { newCard, review, type Card } from "../lib/srs";
import { emptyProgress, normalize, type Attempt, type MockResult, type Progress, type Settings } from "../lib/storage";

export type Action =
  | { type: "answer"; attempt: Attempt }
  | { type: "answers"; attempts: Attempt[] }
  | { type: "mock"; result: MockResult }
  | { type: "settings"; patch: Partial<Settings> }
  | { type: "import"; progress: Progress }
  | { type: "reset" };

function applyAttempt(cards: Record<string, Card>, a: Attempt) {
  const card = cards[a.q] ?? newCard(a.q, a.at);
  return { ...cards, [a.q]: review(card, a.correct, a.at) };
}

export function reducer(state: Progress, action: Action): Progress {
  switch (action.type) {
    case "answer":
      return { ...state, attempts: [...state.attempts, action.attempt], cards: applyAttempt(state.cards, action.attempt) };
    case "answers": {
      let cards = state.cards;
      for (const a of action.attempts) cards = applyAttempt(cards, a);
      return { ...state, attempts: [...state.attempts, ...action.attempts], cards };
    }
    case "mock":
      return { ...state, mocks: [...state.mocks, action.result] };
    case "settings":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "import":
      return normalize(action.progress);
    case "reset":
      return emptyProgress();
  }
}
