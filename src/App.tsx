import { useEffect, useMemo, useState } from "react";
import { Heart, Shield, Swords, RotateCcw } from "lucide-react";

type Language = "en" | "hu";
type Difficulty = "Easy" | "Normal" | "Hard";
type Suit = "clubs" | "diamonds" | "hearts" | "spades";
type Rank =
  "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
type Phase =
  "DRAWING" | "CLUB_SELECTION" | "RESOLUTION" | "BATTLE_END" | "GAME_OVER";
type C = { id: string; suit: Suit; rank: Rank; value: number };
type Flags = Record<Suit, boolean>;
type Summary = {
  base: number;
  spade: number;
  total: number;
  heart: number;
  raw: number;
  diamond: number;
  counter: number;
  joker: boolean;
};
type ResolutionPreview = {
  cardValues: number[];
  base: number;
  strength: number;
  heartCount: number;
  heartBattle: number;
  heartLegend: number;
  moraleBefore: number;
  moraleAfterHealing: number;
  spadeCount: number;
  spadeBattle: number;
  spadeLegend: number;
  totalPower: number;
  enemyBefore: number;
  enemyAfter: number;
  lastValue: number;
  enemyLevel: number;
  rawCounter: number;
  diamondCount: number;
  diamondBattle: number;
  diamondLegend: number;
  finalCounter: number;
};

type Game = {
  phase: Phase;
  difficulty: Difficulty;
  currentMorale: number;
  maximumMorale: number;
  enemyMorale: number;
  enemyLevel: number;
  enemyRank: Rank;
  attackDeck: C[];
  enemyDeck: C[];
  currentEnemy: C[];
  queenEnemy: C[];
  battleground: C[];
  discard: C[];
  removed: C[];
  legends: Record<Suit, C[]>;
  legendUsed: Flags;
  selected: Flags;
  usedClubs: string[];
  clubSelection: C[];
  jokers: number;
  last: string | null;
  duplicate: boolean;
  notice: string;
  summary: Summary | null;
  victory: boolean;
};
const RULEBOOK_URL =
  "https://drive.google.com/file/d/1E3ozP6v9BC3FDe7qAlg0YvCEZMPaB_CR/view";
const I18N = {
  en: {
    subtitle: "Interactive campaign prototype",
    easy: "Easy",
    normal: "Normal",
    hard: "Hard",
    morale: "Morale",
    start: "Start {difficulty} Game",
    rulebook: "Rulebook",
    readRules: "Read the Rulebook",
    newGame: "New game",
    sort: "Sort cards by value",
    level: "Level",
    currentMorale: "Current Morale",
    maximumMorale: "Maximum Morale",
    enemyMorale: "Enemy Morale",
    enemyDeck: "Enemy Deck",
    attackDeck: "Attack Deck",
    jokers: "Jokers",
    currentPhase: "Current phase",
    cards: "Cards",
    basePower: "Base Power",
    total: "Total Power",
    draw: "Draw card",
    stop: "Stop drawing",
    useClub: "Use {rank}♣",
    useClubLegend: "Use Club Legend",
    resolve: "Resolve attack",
    continueCampaign: "Continue campaign",
    legends: "Legend Areas",
    battleground: "Battleground",
    clubSelection: "Club Selection",
    discard: "Discard Pile",
    lastResolution: "Last resolution",
    available:
      "{selected} of {available} available Legend Areas were activated",
    congratulations: "Congratulations!",
    defeated:
      "You defeated the {rank}s. The defeated cards have joined your side.",
    finish: "Finish campaign",
    won: "Congratulations, you won!",
    lost: "Unfortunately, you lost.",
    wonText: "You defeated the King and completed the campaign.",
    startNew: "Start a new game",
    resetTitle: "Start a new game?",
    resetText: "The current game will be replaced.",
    cancel: "Cancel",
    noCards: "No cards remain",
    noCardsText:
      "The Attack Deck and Discard Pile are both empty. If you draw now, you lose the game.",
    drawLose: "Draw and lose",
    clubWarn: "Use Club at 1 Morale?",
    clubWarnText: "A Joker will be spent immediately if available.",
    continue: "Continue",
    fastResolution: "Fast attack resolution",
    resolutionTitle: "Attack Resolution",
    healingStep: "1. Healing",
    powerStep: "2. Total Power",
    counterStep: "3. Counterattack",
    resultStep: "Calculation complete",
    battlegroundBonus: "Battleground bonus",
    legendBonus: "Legend Area bonus",
    moraleChange: "Morale",
    enemyMoraleChange: "Enemy Morale",
    rawCounter: "Raw counterattack",
    finalCounter: "Final counterattack",
    cardSum: "Sum of cards",
    applyResolution: "Accept",
    empty: "Empty",
    clubsName: "Clubs",
    diamondsName: "Diamonds",
    heartsName: "Hearts",
    spadesName: "Spades",
    used: "used",
    no: "no",
  },
  hu: {
    subtitle: "Interaktív kampányprototípus",
    easy: "Könnyű",
    normal: "Normál",
    hard: "Nehéz",
    morale: "Morál",
    start: "{difficulty} játék indítása",
    rulebook: "Szabálykönyv (angol)",
    readRules: "Szabálykönyv megnyitása (angol)",
    newGame: "Új játék",
    sort: "Lapok rendezése érték szerint",
    level: "Szint",
    currentMorale: "Aktuális Morál",
    maximumMorale: "Maximális Morál",
    enemyMorale: "Ellenfél Morálja",
    enemyDeck: "Ellenségpakli",
    attackDeck: "Támadópakli",
    jokers: "Jokerek",
    currentPhase: "Aktuális fázis",
    cards: "Lapok",
    basePower: "Alaperő",
    total: "Összerő",
    draw: "Laphúzás",
    stop: "Megállás",
    useClub: "{rank}♣ használata",
    useClubLegend: "Treff Legenda használata",
    resolve: "Támadás kiértékelése",
    continueCampaign: "Kampány folytatása",
    legends: "Legenda-területek",
    battleground: "Csatatér",
    clubSelection: "Treff lapválasztás",
    discard: "Dobópakli",
    lastResolution: "Előző kiértékelés",
    available: "{selected}/{available} elérhető Legenda-terület aktiválva",
    congratulations: "Gratulálok!",
    defeated:
      "Legyőzted a(z) {rank} értékű ellenfeleket. A lapok most hozzád álltak.",
    finish: "Kampány befejezése",
    won: "Gratulálok, nyertél!",
    lost: "Sajnos elveszítetted a játékot.",
    wonText: "Legyőzted a Királyt és teljesítetted a kampányt.",
    startNew: "Új játék indítása",
    resetTitle: "Új játékot kezdesz?",
    resetText: "A jelenlegi játékállás elveszik.",
    cancel: "Mégse",
    noCards: "Nincs több húzható lap",
    noCardsText:
      "A Támadópakli és a Dobópakli is üres. Ha most húzol, elveszíted a játékot.",
    drawLose: "Húzás és vereség",
    clubWarn: "Treff használata 1 Morálnál?",
    clubWarnText: "Ha van elérhető Joker, azonnal felhasználódik.",
    continue: "Folytatás",
    fastResolution: "Gyors támadáskiértékelés",
    resolutionTitle: "Támadás kiértékelése",
    healingStep: "1. Gyógyulás",
    powerStep: "2. Összerő",
    counterStep: "3. Visszatámadás",
    resultStep: "A számítás elkészült",
    battlegroundBonus: "Csatatér bónusz",
    legendBonus: "Legenda-terület bónusz",
    moraleChange: "Morál",
    enemyMoraleChange: "Ellenfél Morálja",
    rawCounter: "Nyers visszatámadás",
    finalCounter: "Végső visszatámadás",
    cardSum: "Lapok összege",
    applyResolution: "Elfogadás",
    empty: "Üres",
    clubsName: "Treff",
    diamondsName: "Káró",
    heartsName: "Kőr",
    spadesName: "Pikk",
    used: "felhasználva",
    no: "nem",
  },
} as const;
type TKey = keyof typeof I18N.en;
const template = (text: string, values: Record<string, string | number> = {}) =>
  Object.entries(values).reduce(
    (r, [k, v]) => r.split(`{${k}}`).join(String(v)),
    text,
  );

const SUITS: Suit[] = ["clubs", "diamonds", "hearts", "spades"];
const RANKS: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];
const META = {
  clubs: { s: "♣", n: "Clubs" },
  diamonds: { s: "♦", n: "Diamonds" },
  hearts: { s: "♥", n: "Hearts" },
  spades: { s: "♠", n: "Spades" },
};
const MORALE = { Easy: 30, Normal: 25, Hard: 20 };
const ENEMY: { [k: number]: number } = {
  1: 10,
  2: 15,
  3: 21,
  4: 28,
  5: 35,
  6: 45,
  7: 60,
  8: 100,
};
const flags = (): Flags => ({
  clubs: false,
  diamonds: false,
  hearts: false,
  spades: false,
});
const val = (r: Rank) =>
  r === "A" ? 1 : r === "J" ? 11 : r === "Q" ? 12 : r === "K" ? 13 : Number(r);
const shuffle = <T,>(a: T[]) => {
  a = [...a];
  for (let i = a.length - 1; i; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const deck = () =>
  RANKS.flatMap((rank) =>
    SUITS.map((suit) => ({
      id: `${rank}-${suit}`,
      rank,
      suit,
      value: val(rank),
    })),
  );
const dups = (a: C[]) => {
  const m = new Map<Rank, number>();
  a.forEach((c) => m.set(c.rank, (m.get(c.rank) || 0) + 1));
  return [...m].filter((x) => x[1] > 1).map((x) => x[0]);
};
function fresh(d: Difficulty): Game {
  const all = deck(),
    atk = new Set<Rank>(["A", "2", "3", "4"]);
  return {
    phase: "DRAWING",
    difficulty: d,
    currentMorale: MORALE[d],
    maximumMorale: MORALE[d],
    enemyMorale: 10,
    enemyLevel: 1,
    enemyRank: "5",
    attackDeck: shuffle(all.filter((c) => atk.has(c.rank))),
    enemyDeck: all
      .filter((c) => !atk.has(c.rank) && c.rank !== "5")
      .sort((a, b) => a.value - b.value),
    currentEnemy: shuffle(all.filter((c) => c.rank === "5")),
    queenEnemy: [],
    battleground: [],
    discard: [],
    removed: [],
    legends: { clubs: [], diamonds: [], hearts: [], spades: [] },
    legendUsed: flags(),
    selected: flags(),
    usedClubs: [],
    clubSelection: [],
    jokers: 2,
    last: null,
    duplicate: false,
    notice: "The first battle is ready. Draw the first Attack card.",
    summary: null,
    victory: false,
  };
}
function CardView({
  c,
  small = true,
  last = false,
  onClick,
}: {
  c: C;
  small?: boolean;
  last?: boolean;
  onClick?: () => void;
}) {
  const isRed = c.suit === "hearts" || c.suit === "diamonds";
  return (
    <button
      className={`card ${isRed ? "red-card" : "black-card"} ${small ? "small" : ""} ${last ? "last" : ""}`}
      onClick={onClick}
      disabled={!onClick}
    >
      {/* A kártyán csak a felső rang és az alatta lévő suit látszik. */}
      <b>{c.rank}</b>
      <strong>{META[c.suit].s}</strong>
    </button>
  );
}
function Stack({ n, label }: { n: number; label: string }) {
  return (
    <div className="stackBox">
      <div className="stack">
        <span>{n}</span>
      </div>
      <small>{label}</small>
    </div>
  );
}
function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="overlay">
      <div className="modal">{children}</div>
    </div>
  );
}
export default function App() {
  const [language, setLanguage] = useState<Language>(() =>
    localStorage.getItem("one-more-card-language") === "hu" ? "hu" : "en",
  );
  const setLang = (value: Language) => {
    localStorage.setItem("one-more-card-language", value);
    setLanguage(value);
  };
  const t = (key: TKey, values?: Record<string, string | number>) =>
    template(I18N[language][key], values);
  const difficultyName = (d: Difficulty) =>
    d === "Easy" ? t("easy") : d === "Normal" ? t("normal") : t("hard");
  const phaseName = (p: Phase) =>
    p === "DRAWING"
      ? language === "hu"
        ? "HÚZÁS"
        : "DRAWING"
      : p === "CLUB_SELECTION"
        ? language === "hu"
          ? "TREFF VÁLASZTÁS"
          : "CLUB SELECTION"
        : p === "RESOLUTION"
          ? language === "hu"
            ? "KIÉRTÉKELÉS"
            : "RESOLUTION"
          : p === "BATTLE_END"
            ? language === "hu"
              ? "CSATA VÉGE"
              : "BATTLE END"
            : language === "hu"
              ? "JÁTÉK VÉGE"
              : "GAME OVER";
  const noticeText = (n: string) => {
    if (language === "en") return n;
    const m: Record<string, string> = {
      "The first battle is ready. Draw the first Attack card.":
        "Az első csata előkészítve. Húzd fel az első Támadólapot.",
      "No drawable card exists.": "Nincs több húzható lap.",
      "Choose optional Legend abilities, then resolve.":
        "Válaszd ki az opcionális Legenda-képességeket, majd értékeld ki a támadást.",
      "The Club cost reduced Morale below 1.":
        "A Treff költsége 1 alá csökkentette a Morált.",
      "Your Morale fell below 1 and no Joker remained.":
        "A Morálod 1 alá csökkent, és nem maradt Jokered.",
      "Enemy defeated. The final counterattack was survived.":
        "Az ellenfél legyőzve. Túlélted az utolsó visszatámadást.",
      "You defeated the King.": "Legyőzted a Királyt.",
      "Jacks and Queens attack together.": "A Bubik és Dámák együtt támadnak.",
      "The final King battle begins.":
        "Elkezdődik a Király elleni utolsó csata.",
    };
    if (m[n]) return m[n];
    let x = n.match(/^Duplicate (.+) detected/);
    if (x) return `Duplikált érték: ${x[1]}. Az Alaperő 0.`;
    x = n.match(/^(.+) entered the Battleground/);
    if (x) return `${x[1]} a Csatatérre került.`;
    x = n.match(/^Choose one of (\d+) cards/);
    if (x) return `Válassz egy lapot a(z) ${x[1]} lap közül.`;
    x = n.match(/^(.+) became a Legend/);
    if (x) return `${x[1]} Legendává vált.`;
    x = n.match(/^The (.+)s are ready/);
    if (x) return `A(z) ${x[1]} értékű ellenfelek készen állnak.`;
    return n;
  };
  const [difficulty, setDifficulty] = useState<Difficulty>("Normal");
  const [g, setG] = useState<Game | null>(null);
  const [reset, setReset] = useState(false);
  const [clubWarn, setClubWarn] = useState<string | null>(null);
  const [sortCards, setSortCards] = useState(false);
  const [drawWarn, setDrawWarn] = useState(false);
  const [fastResolution, setFastResolution] = useState(() =>
    localStorage.getItem("one-more-card-fast-resolution") === "true",
  );
  const [resolutionPreview, setResolutionPreview] = useState<ResolutionPreview | null>(null);
  const [resolutionStep, setResolutionStep] = useState(0);
  const changeFastResolution = (value: boolean) => {
    localStorage.setItem("one-more-card-fast-resolution", String(value));
    setFastResolution(value);
  };
  const suitName = (suit: Suit) =>
    suit === "clubs" ? t("clubsName") :
    suit === "diamonds" ? t("diamondsName") :
    suit === "hearts" ? t("heartsName") : t("spadesName");

  useEffect(() => {
    if (!resolutionPreview || resolutionStep >= 3) return;
    const timer = window.setTimeout(() => setResolutionStep((step) => step + 1), 650);
    return () => window.clearTimeout(timer);
  }, [resolutionPreview, resolutionStep]);
  const active = g?.currentEnemy[0],
    queen = g?.queenEnemy[0];
  const activeSuits = useMemo(
    () => [active?.suit, queen?.suit].filter(Boolean) as Suit[],
    [active, queen],
  );
  const blocked = (s: Suit, legend = false) =>
    activeSuits.includes(s) && !(legend && g?.difficulty === "Easy");
  if (!g)
    return (
      <main className="menu">
        <h1>One More Card?!</h1>
        <p>{t("subtitle")}</p>
        <div className="difficulty">
          {(["Easy", "Normal", "Hard"] as Difficulty[]).map((d) => (
            <button
              className={difficulty === d ? "chosen" : ""}
              onClick={() => setDifficulty(d)}
            >
              <b>{difficultyName(d)}</b>
              <span>
                {MORALE[d]} {t("morale")}
              </span>
            </button>
          ))}
        </div>
        <button className="primary" onClick={() => setG(fresh(difficulty))}>
          {t("start", { difficulty: difficultyName(difficulty) })}
        </button>
        <a
          className="rulebookLink menuRulebookLink"
          href={RULEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("readRules")}
        </a>
        <LanguageSwitch language={language} onChange={setLang} />
      </main>
    );
  const loseMorale = (x: Game, n: number) => {
    let current = x.currentMorale - n,
      j = x.jokers,
      used = false;
    if (current < 1 && j > 0) {
      j--;
      current = x.maximumMorale;
      used = true;
    }
    return [
      { ...x, currentMorale: current, jokers: j },
      current < 1,
      used,
    ] as const;
  };
  const prepare = (x: Game) => {
    let y = { ...x, attackDeck: [...x.attackDeck], discard: [...x.discard] };
    if (!y.attackDeck.length) {
      if (!y.discard.length)
        return [
          {
            ...y,
            phase: "GAME_OVER" as Phase,
            notice: "No drawable card exists.",
            victory: false,
          },
          null,
        ] as const;
      y.attackDeck = shuffle(y.discard);
      y.discard = [];
      if (y.difficulty !== "Hard")
        y.currentMorale = Math.min(
          y.maximumMorale,
          y.currentMorale + y.enemyLevel,
        );
    }
    return [y, y.attackDeck.pop() || null] as const;
  };
  const enter = (x: Game, c: C) => {
    const bg = [...x.battleground, c],
      duplicate = dups(bg).length > 0;
    return {
      ...x,
      battleground: bg,
      last: c.id,
      duplicate,
      phase: duplicate ? ("RESOLUTION" as Phase) : ("DRAWING" as Phase),
      notice: duplicate
        ? `Duplicate ${dups(bg).join(", ")} detected. Base Power is 0.`
        : `${c.rank}${META[c.suit].s} entered the Battleground.`,
    };
  };
  const performDraw = () => {
    const [x, c] = prepare(g);
    setG(c ? enter(x, c) : x);
  };
  const draw = () => {
    if (!g.attackDeck.length && !g.discard.length) {
      setDrawWarn(true);
      return;
    }
    performDraw();
  };
  const stop = () =>
    g.battleground.length &&
    setG({
      ...g,
      phase: "RESOLUTION",
      selected: flags(),
      notice: "Choose optional Legend abilities, then resolve.",
    });
  const beginClub = (source: "legend" | "battle", id?: string) => {
    let x = {
      ...g,
      usedClubs: source === "battle" && id ? [...g.usedClubs, id] : g.usedClubs,
      legendUsed:
        source === "legend" ? { ...g.legendUsed, clubs: true } : g.legendUsed,
    };
    const [m, lost] = loseMorale(x, 1);
    if (lost)
      return setG({
        ...m,
        phase: "GAME_OVER",
        notice: "The Club cost reduced Morale below 1.",
        victory: false,
      });
    let y = m,
      n =
        (source === "legend" ? g.legends.clubs.length : g.battleground.length) +
        1,
      cs: C[] = [];
    for (let i = 0; i < n; i++) {
      const [z, c] = prepare(y);
      y = z;
      if (!c) break;
      cs.push(c);
    }
    setG({
      ...y,
      phase: "CLUB_SELECTION",
      clubSelection: cs,
      notice: `Choose one of ${cs.length} cards.`,
    });
  };
  const askClub = (source: "legend" | "battle", id?: string) =>
    g.currentMorale === 1
      ? setClubWarn(source === "legend" ? "legend" : id || "")
      : beginClub(source, id);
  const chooseClub = (c: C) =>
    setG(
      enter(
        {
          ...g,
          discard: [
            ...g.discard,
            ...g.clubSelection.filter((x) => x.id !== c.id),
          ],
          clubSelection: [],
        },
        c,
      ),
    );
  const createResolutionPreview = (): ResolutionPreview | null => {
    const last = g.battleground.find((c) => c.id === g.last);
    if (!last) return null;
    const strength = g.battleground.length;
    const count = (suit: Suit) => g.battleground.filter((c) => c.suit === suit).length;
    const base = g.duplicate ? 0 : g.battleground.reduce((sum, card) => sum + card.value, 0);
    const heartCount = count("hearts");
    const heartBattle = blocked("hearts") ? 0 : heartCount * strength;
    const heartLegend = g.selected.hearts ? g.legends.hearts.length : 0;
    const spadeCount = count("spades");
    const spadeBattle = blocked("spades") ? 0 : spadeCount * strength;
    const spadeLegend = g.selected.spades ? g.legends.spades.length : 0;
    const diamondCount = count("diamonds");
    const diamondBattle = blocked("diamonds") ? 0 : diamondCount * strength;
    const diamondLegend = g.selected.diamonds ? g.legends.diamonds.length : 0;
    const rawCounter = last.value + g.enemyLevel;
    return {
      cardValues: g.battleground.map((card) => card.value),
      base,
      strength,
      heartCount,
      heartBattle,
      heartLegend,
      moraleBefore: g.currentMorale,
      moraleAfterHealing: Math.min(g.maximumMorale, g.currentMorale + heartBattle + heartLegend),
      spadeCount,
      spadeBattle,
      spadeLegend,
      totalPower: base + spadeBattle + spadeLegend,
      enemyBefore: g.enemyMorale,
      enemyAfter: g.enemyMorale - base - spadeBattle - spadeLegend,
      lastValue: last.value,
      enemyLevel: g.enemyLevel,
      rawCounter,
      diamondCount,
      diamondBattle,
      diamondLegend,
      finalCounter: Math.max(0, rawCounter - diamondBattle - diamondLegend),
    };
  };

  const resolve = () => {
    if (fastResolution) {
      applyResolution();
      return;
    }
    const preview = createResolutionPreview();
    if (!preview) return;
    setResolutionStep(0);
    setResolutionPreview(preview);
  };

  const applyResolution = () => {
    const last = g.battleground.find((c) => c.id === g.last);
    if (!last) return;
    const strength = g.battleground.length,
      count = (s: Suit) => g.battleground.filter((c) => c.suit === s).length,
      base = g.duplicate ? 0 : g.battleground.reduce((n, c) => n + c.value, 0),
      spade = blocked("spades") ? 0 : count("spades") * strength,
      ls = g.selected.spades ? g.legends.spades.length : 0,
      heart = blocked("hearts") ? 0 : count("hearts") * strength,
      lh = g.selected.hearts ? g.legends.hearts.length : 0,
      raw = last.value + g.enemyLevel,
      diamond = blocked("diamonds") ? 0 : count("diamonds") * strength,
      ld = g.selected.diamonds ? g.legends.diamonds.length : 0,
      counter = Math.max(0, raw - diamond - ld),
      enemyMorale = g.enemyMorale - base - spade - ls;
    let x = {
      ...g,
      currentMorale: Math.min(g.maximumMorale, g.currentMorale + heart + lh),
      enemyMorale,
    };
    const [m, lost, joker] = loseMorale(x, counter),
      summary = {
        base,
        spade: spade + ls,
        total: base + spade + ls,
        heart: heart + lh,
        raw,
        diamond: diamond + ld,
        counter,
        joker,
      };
    if (lost)
      return setG({
        ...m,
        phase: "GAME_OVER",
        summary,
        notice: "Your Morale fell below 1 and no Joker remained.",
        victory: false,
      });
    const legends = {
        ...m.legends,
        [last.suit]: [...m.legends[last.suit], last],
      },
      used = { ...m.legendUsed };
    SUITS.forEach((s) => {
      if (m.selected[s]) used[s] = true;
    });
    let clean = {
      ...m,
      legends,
      legendUsed: used,
      selected: flags(),
      discard: [
        ...m.discard,
        ...m.battleground.filter((c) => c.id !== last.id),
      ],
      battleground: [],
      last: null,
      duplicate: false,
      usedClubs: [],
      summary,
    };
    if (enemyMorale <= 0)
      return setG({
        ...clean,
        phase: "BATTLE_END",
        notice: "Enemy defeated. The final counterattack was survived.",
      });
    let ce = [...clean.currentEnemy.slice(1), clean.currentEnemy[0]],
      qe = clean.queenEnemy.length
        ? [...clean.queenEnemy.slice(1), clean.queenEnemy[0]]
        : [];
    let guard = 0;
    while (qe.length && ce[0].suit === qe[0].suit && guard++ < qe.length)
      qe = [...qe.slice(1), qe[0]];
    setG({
      ...clean,
      currentEnemy: ce,
      queenEnemy: qe,
      phase: "DRAWING",
      notice: `${last.rank}${META[last.suit].s} became a Legend.`,
    });
  };
  const nextBattle = () => {
    const max = g.maximumMorale + g.enemyLevel,
      cur = Math.min(max, g.currentMorale + g.enemyLevel);
    if (g.enemyRank === "K")
      return setG({
        ...g,
        maximumMorale: max,
        currentMorale: cur,
        phase: "GAME_OVER",
        victory: true,
        notice: "You defeated the King.",
      });
    let ed = [...g.enemyDeck],
      common = {
        maximumMorale: max,
        currentMorale: cur,
        legendUsed: flags(),
        selected: flags(),
        phase: "DRAWING" as Phase,
        summary: null,
      };
    if (g.enemyRank === "10") {
      let j = shuffle(ed.splice(0, 4)),
        q = shuffle(ed.splice(0, 4)),
        guard = 0;
      while (j[0].suit === q[0].suit && guard++ < 4) q = [...q.slice(1), q[0]];
      return setG({
        ...g,
        ...common,
        discard: [...g.discard, ...g.currentEnemy],
        enemyDeck: ed,
        currentEnemy: j,
        queenEnemy: q,
        enemyRank: "J",
        enemyLevel: 7,
        enemyMorale: ENEMY[7],
        notice: "Jacks and Queens attack together.",
      });
    }
    if (g.enemyRank === "J") {
      const k = shuffle(ed.splice(0, 4));
      return setG({
        ...g,
        ...common,
        removed: [...g.removed, ...g.currentEnemy, ...g.queenEnemy],
        enemyDeck: ed,
        currentEnemy: k,
        queenEnemy: [],
        enemyRank: "K",
        enemyLevel: 8,
        enemyMorale: 100,
        notice: "The final King battle begins.",
      });
    }
    const next = shuffle(ed.splice(0, 4)),
      rank = next[0].rank,
      level = g.enemyLevel + 1;
    setG({
      ...g,
      ...common,
      discard: [...g.discard, ...g.currentEnemy],
      enemyDeck: ed,
      currentEnemy: next,
      queenEnemy: [],
      enemyRank: rank,
      enemyLevel: level,
      enemyMorale: ENEMY[level],
      notice: `The ${rank}s are ready.`,
    });
  };
  const displayCards = (cards: C[]) =>
    sortCards
      ? [...cards].sort(
          (a, b) =>
            a.value - b.value || SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit),
        )
      : cards;
  const available = SUITS.filter(
    (s) =>
      s !== "clubs" &&
      g.legends[s].length &&
      !g.legendUsed[s] &&
      !blocked(s, true),
  );
  const base = g.duplicate
    ? 0
    : g.battleground.reduce((n, c) => n + c.value, 0);
  const battleClubs = g.battleground.filter(
    (c) => c.suit === "clubs" && !g.usedClubs.includes(c.id),
  );
  return (
    <main>
      <header>
        <div className="headerMain">
          <h1>
            One More Card?! <small>{difficultyName(g.difficulty)}</small>{" "}
            <em>
              {t("level")} {g.enemyLevel}
            </em>
          </h1>
          <p>{noticeText(g.notice)}</p>
        </div>
        {/* Jobb oldali fejlécműveletek: rendezési könnyítés és új játék. */}
        <div className="headerActions">
          <div className="headerToggles">
            <label className="sortToggle">
              <input
                type="checkbox"
                checked={sortCards}
                onChange={(e) => setSortCards(e.target.checked)}
              />
              {t("sort")}
            </label>
            <label className="sortToggle">
              <input
                type="checkbox"
                checked={fastResolution}
                onChange={(e) => changeFastResolution(e.target.checked)}
              />
              {t("fastResolution")}
            </label>
          </div>
          <div className="headerButtonStack">
            <button onClick={() => setReset(true)}>
              <RotateCcw /> {t("newGame")}
            </button>
            <a
              className="rulebookLink headerRulebookLink"
              href={RULEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("rulebook")}
            </a>
          </div>
          <LanguageSwitch language={language} onChange={setLang} compact />
        </div>
      </header>

      {/* Felső állapotsor: egy közös Morale-panel három sorral, mellette a paklik és Jokerek. */}
      <div className="topStatus">
        <div className="morales">
          <Stat
            title={t("currentMorale")}
            value={g.currentMorale}
            icon={<Heart />}
          />
          <Stat
            title={t("maximumMorale")}
            value={g.maximumMorale}
            icon={<Shield />}
          />
          <Stat
            title={t("enemyMorale")}
            value={g.enemyMorale}
            icon={<Swords />}
          />
        </div>
        {/* Small card méretű Enemy Deck és Attack Deck. */}
        <div className="topDecks">
          <Stack n={g.enemyDeck.length} label={t("enemyDeck")} />
          <Stack n={g.attackDeck.length} label={t("attackDeck")} />
        </div>
        {/* Két small card méretű Joker-hely; az elhasznált Joker szürkítve marad. */}
        <div className="jokerPanel">
          <small>{t("jokers")}</small>
          <div className="jokerCards">
            {[0, 1].map((index) => (
              <div
                key={index}
                className={`jokerCard ${index >= g.jokers ? "used" : ""}`}
              >
                {index < g.jokers ? "🃏" : "×"}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Első sor: Current Enemy balra, műveleti gombok jobbra. Második sor: fázisadatok. */}
      <section className={`phase ${g.phase.toLowerCase()}`}>
        <div className="phaseEnemy">
          {active && <CardView c={active} />}
          {queen ? (
            <CardView c={queen} />
          ) : (
            <div className="enemyPlaceholder" />
          )}
        </div>
        <div className="phaseInfo">
          <small>{t("currentPhase")}</small>
          <h2>{phaseName(g.phase)}</h2>
          <p>
            {t("cards")} {g.battleground.length} · {t("basePower")} {base}
          </p>
          {g.phase === "RESOLUTION" && available.length > 0 && (
            <p>
              {t("available", {
                selected: available.filter((s) => g.selected[s]).length,
                available: available.length,
              })}
            </p>
          )}
        </div>
        <div className="actions">
          {g.phase === "DRAWING" && (
            <>
              {/* A dinamikus Treff-opciók mindig a két fix húzási gomb elé kerülnek. */}
              <div className="clubActions">
                {battleClubs.map((c) => (
                  <button
                    key={c.id}
                    disabled={blocked("clubs")}
                    onClick={() => askClub("battle", c.id)}
                  >
                    {t("useClub", { rank: c.rank })}
                  </button>
                ))}
                {g.legends.clubs.length > 0 && !g.legendUsed.clubs && (
                  <button
                    disabled={blocked("clubs", true)}
                    onClick={() => askClub("legend")}
                  >
                    {t("useClubLegend")}
                  </button>
                )}
              </div>
              {/* A Draw card és Stop drawing fixen a jobb szélen marad. */}
              <div className="fixedDrawActions">
                <button onClick={draw}>{t("draw")}</button>
                <button onClick={stop} disabled={!g.battleground.length}>
                  {t("stop")}
                </button>
              </div>
            </>
          )}
          {g.phase === "RESOLUTION" && (
            <button onClick={resolve}>{t("resolve")}</button>
          )}
          {resolutionPreview && (
        <Modal>
          <div className="resolutionWalkthrough">
            <h2>{t("resolutionTitle")}</h2>

            <section className="resolutionStep visible">
              <h3>{t("healingStep")}</h3>
              <p>
                ♥ {t("battlegroundBonus")}: {resolutionPreview.heartCount} × {resolutionPreview.strength} = {resolutionPreview.heartBattle}
              </p>
              <p>♥ {t("legendBonus")}: +{resolutionPreview.heartLegend}</p>
              <strong>
                {t("moraleChange")}: {resolutionPreview.moraleBefore} → {resolutionPreview.moraleAfterHealing}
              </strong>
            </section>

            {resolutionStep >= 1 && (
              <section className="resolutionStep visible">
                <h3>{t("powerStep")}</h3>
                <p>
                  {t("cardSum")}: {resolutionPreview.cardValues.join(" + ")} = {resolutionPreview.base}
                </p>
                <p>♠ {t("battlegroundBonus")}: +{resolutionPreview.spadeBattle}</p>
                <p>♠ {t("legendBonus")}: +{resolutionPreview.spadeLegend}</p>
                <strong>
                  {t("total")}: {resolutionPreview.base} + {resolutionPreview.spadeBattle} + {resolutionPreview.spadeLegend} = {resolutionPreview.totalPower}
                </strong>
                <p>
                  {t("enemyMoraleChange")}: {resolutionPreview.enemyBefore} → {resolutionPreview.enemyAfter}
                </p>
              </section>
            )}

            {resolutionStep >= 2 && (
              <section className="resolutionStep visible">
                <h3>{t("counterStep")}</h3>
                <p>
                  {t("rawCounter")}: {resolutionPreview.lastValue} + {resolutionPreview.enemyLevel} = {resolutionPreview.rawCounter}
                </p>
                <p>♦ {t("battlegroundBonus")}: −{resolutionPreview.diamondBattle}</p>
                <p>♦ {t("legendBonus")}: −{resolutionPreview.diamondLegend}</p>
                <strong>
                  {t("finalCounter")}: {resolutionPreview.rawCounter} − {resolutionPreview.diamondBattle} − {resolutionPreview.diamondLegend} = {resolutionPreview.finalCounter}
                </strong>
              </section>
            )}

            {resolutionStep >= 3 && (
              <div className="resolutionComplete">
                <strong>{t("resultStep")}</strong>
                <button
                  className="primary"
                  onClick={() => {
                    setResolutionPreview(null);
                    applyResolution();
                  }}
                >
                  {t("applyResolution")}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {g.phase === "BATTLE_END" && (
            <button onClick={nextBattle}>{t("continueCampaign")}</button>
          )}
        </div>
      </section>
      <div className="board">
        <div>
          <Area title={t("legends")}>
            <div className="legendGrid">
              {SUITS.map((s) => {
                const b = blocked(s, true),
                  selectable =
                    g.phase === "RESOLUTION" &&
                    s !== "clubs" &&
                    g.legends[s].length &&
                    !g.legendUsed[s] &&
                    !b;
                return (
                  <button
                    className={`legend ${b ? "blocked" : ""} ${g.selected[s] ? "selected" : ""}`}
                    aria-disabled={!selectable}
                    onClick={() =>
                      setG({
                        ...g,
                        selected: { ...g.selected, [s]: !g.selected[s] },
                      })
                    }
                  >
                    <h3
                      className={
                        s === "hearts" || s === "diamonds"
                          ? "red-suit"
                          : "black-suit"
                      }
                    >
                      {META[s].s} {suitName(s)}
                    </h3>
                    {/* Képernyőn kiskártyák, mobilon tömör értéklista látszik. */}
                    <div className="legendCards">
                      {g.legends[s].length ? (
                        displayCards(g.legends[s]).map((c) => (
                          <CardView key={c.id} c={c} />
                        ))
                      ) : (
                        <span>{t("empty")}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Area>
          <Area title={t("battleground")}>
            <div className="cards">
              {g.battleground.map((c) => (
                <CardView c={c} last={c.id === g.last} />
              ))}
            </div>
          </Area>
          {g.phase === "CLUB_SELECTION" && (
            <Area title={t("clubSelection")}>
              <div className="cards">
                {g.clubSelection.map((c) => (
                  <CardView c={c} onClick={() => chooseClub(c)} />
                ))}
              </div>
            </Area>
          )}
          <Area title={t("discard")}>
            <div className="cards discardCards">
              {displayCards(g.discard).map((c) => (
                <CardView key={c.id} c={c} small />
              ))}
            </div>
          </Area>
          {/*
            Az előző kiértékelés összefoglalója ideiglenesen kikommentelve.
            Később átalakítva egyszerűen visszakapcsolható.

          {g.summary && (
            <Area title={t("lastResolution")}>
              <p>
                Base {g.summary.base} · ♠ +{g.summary.spade} · Total{" "}
                {g.summary.total} · ♥ +{g.summary.heart} · Counter{" "}
                {g.summary.counter} · {t("jokers")}{" "}
                {g.summary.joker ? t("used") : t("no")}
              </p>
            </Area>
          )} 
          */}
        </div>
      </div>
      {g.phase === "BATTLE_END" && (
        <Modal>
          <h2>{t("congratulations")}</h2>
          <p>{t("defeated", { rank: g.enemyRank })}</p>
          <button className="primary" onClick={nextBattle}>
            {g.enemyRank === "K" ? t("finish") : t("continueCampaign")}
          </button>
        </Modal>
      )}
      {g.phase === "GAME_OVER" && (
        <Modal>
          <h2>{g.victory ? t("won") : t("lost")}</h2>
          <p>{g.victory ? t("wonText") : noticeText(g.notice)}</p>
          <button className="primary" onClick={() => setG(fresh(g.difficulty))}>
            {t("startNew")}
          </button>
        </Modal>
      )}
      {reset && (
        <Modal>
          <h2>{t("resetTitle")}</h2>
          <p>{t("resetText")}</p>
          <div className="actions">
            {(["Easy", "Normal", "Hard"] as Difficulty[]).map((d) => (
              <button
                onClick={() => {
                  setG(fresh(d));
                  setReset(false);
                }}
              >
                {d}
              </button>
            ))}
            <button onClick={() => setReset(false)}>{t("cancel")}</button>
          </div>
        </Modal>
      )}
      {drawWarn && (
        <Modal>
          <h2>{t("noCards")}</h2>
          <p>{t("noCardsText")}</p>
          <div className="actions">
            <button onClick={() => setDrawWarn(false)}>{t("cancel")}</button>
            <button
              onClick={() => {
                setDrawWarn(false);
                performDraw();
              }}
            >
              {t("drawLose")}
            </button>
          </div>
        </Modal>
      )}
      {clubWarn !== null && (
        <Modal>
          <h2>{t("clubWarn")}</h2>
          <p>{t("clubWarnText")}</p>
          <div className="actions">
            <button onClick={() => setClubWarn(null)}>{t("cancel")}</button>
            <button
              onClick={() => {
                const p = clubWarn;
                setClubWarn(null);
                beginClub(
                  p === "legend" ? "legend" : "battle",
                  p === "legend" ? undefined : p,
                );
              }}
            >
              {t("continue")}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
function LanguageSwitch({
  language,
  onChange,
  compact = false,
}: {
  language: Language;
  onChange: (value: Language) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`languageSwitch ${compact ? "compact" : ""}`}
      aria-label="Language / Nyelv"
    >
      <button
        className={language === "en" ? "active" : ""}
        onClick={() => onChange("en")}
      >
        EN
      </button>
      <button
        className={language === "hu" ? "active" : ""}
        onClick={() => onChange("hu")}
      >
        HU
      </button>
    </div>
  );
}
function Area({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="area">
      <h4>{title}</h4>
      {children}
    </section>
  );
}
function Stat({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="stat">
      <div>
        <small>{title}</small>
        <b>{value}</b>
      </div>
      {icon}
    </div>
  );
}
