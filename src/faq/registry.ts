import type { Lang } from '../i18n/strings';

// An intersection, not one named field per language: `article.en.title` still works everywhere
// (FaqIndex.*.tsx, build-static.mjs), but the per-language part is now `Record<Lang, ...>` so
// adding a language only means adding an entry to every ARTICLES item below (unavoidable —
// it's per-article translated content), never an edit to this type itself.
export type FaqArticleMeta = {
  slug: string;
  /** ISO date (YYYY-MM-DD) this article first went live — used as JSON-LD datePublished. */
  datePublished: string;
} & Record<Lang, { title: string; description: string }>;

export const ARTICLES: FaqArticleMeta[] = [
  {
    slug: 'carb-transporter-mix',
    datePublished: '2026-08-08',
    en: {
      title: "Why can't you absorb more than ~90g of carbs per hour?",
      description: 'How mixing glucose and fructose raises your gut absorption ceiling.',
    },
    pl: {
      title: 'Dlaczego nie wchłoniesz więcej niż ok. 90 g węglowodanów na godzinę?',
      description: 'Jak mieszanka glukozy i fruktozy podnosi sufit wchłaniania jelitowego.',
    },
    de: {
      title: 'Warum kannst du nicht mehr als ca. 90 g Kohlenhydrate pro Stunde aufnehmen?',
      description: 'Wie eine Glukose-Fruktose-Mischung deine Aufnahmeobergrenze im Darm anhebt.',
    },
    it: {
      title: "Perché non puoi assorbire più di ~90 g di carboidrati all'ora?",
      description:
        'Come una miscela di glucosio e fruttosio alza la soglia di assorbimento intestinale.',
    },
  },
  {
    slug: 'bonk-crisis',
    datePublished: '2026-08-08',
    en: {
      title: 'What actually happens when you bonk — and how to see it coming',
      description: 'The gap between carbs burned and carbs delivered, and how to watch it.',
    },
    pl: {
      title: 'Co się dzieje, gdy "łapiesz bombę" — i jak to przewidzieć',
      description: 'Luka między spalanymi a dostarczanymi węglowodanami i jak ją obserwować.',
    },
    de: {
      title: 'Was beim Hungerast wirklich passiert — und wie du ihn kommen siehst',
      description:
        'Die Lücke zwischen verbrannten und zugeführten Kohlenhydraten — und wie du sie im Blick behältst.',
    },
    it: {
      title: 'Cosa succede davvero quando arriva la crisi di fame — e come vederla arrivare',
      description:
        "Il divario tra carboidrati bruciati e carboidrati forniti, e come tenerlo d'occhio.",
    },
  },
  {
    slug: 'bottle-refill-planning',
    datePublished: '2026-08-08',
    en: {
      title: 'Planning bottle refills on a long ride',
      description: 'Where to place shop stops so you never run the tank dry.',
    },
    pl: {
      title: 'Jak zaplanować uzupełnianie bidonów na długiej trasie',
      description: 'Gdzie ustawić punkty zaopatrzenia, żeby nigdy nie zabrakło paliwa.',
    },
    de: {
      title: 'Flaschen auf einer langen Fahrt nachfüllen: so planst du es',
      description:
        'Wie du Verpflegungspunkte setzt, bevor die Lücke zwischen Bedarf und Vorrat zur Krise wird.',
    },
    it: {
      title: 'Pianificare le ricariche delle borracce su un giro lungo',
      description: 'Dove posizionare le tappe di rifornimento per non restare mai a secco.',
    },
  },
  {
    slug: 'malto-fructose-blend',
    datePublished: '2026-08-08',
    en: {
      title: 'Maltodextrin + fructose: why a transport blend beats glucose alone',
      description:
        "Plain maltodextrin is still just glucose to your gut — here's why adding fructose changes what you can actually absorb.",
    },
    pl: {
      title: 'Malto + fruktoza: dlaczego mieszanka transportowa działa lepiej niż sama glukoza',
      description:
        'Maltodekstryna to dla jelita nadal sama glukoza — dlaczego dodanie fruktozy zmienia to, ile faktycznie wchłoniesz.',
    },
    de: {
      title: 'Malto + Fruktose: warum eine Transporter-Mischung besser wirkt als Glukose allein',
      description:
        'Warum reines Maltodextrin bei ca. 60 g/h endet und Fruktose einen zweiten Aufnahmekanal öffnet.',
    },
    it: {
      title: 'Maltodestrine + fruttosio: perché una miscela di trasporto batte il solo glucosio',
      description:
        'Perché la sola maltodestrina si ferma a ca. 60 g/h e il fruttosio apre una seconda via di assorbimento.',
    },
  },
  {
    slug: 'carbs-per-hour-by-intensity',
    datePublished: '2026-08-08',
    en: {
      title: 'How many carbs per hour do you actually need?',
      description:
        'A practical guide by intensity and ride duration, from easy spins to multi-hour efforts.',
    },
    pl: {
      title: 'Ile węglowodanów na godzinę naprawdę potrzebujesz?',
      description:
        'Praktyczny przewodnik wg intensywności i czasu trwania — od luźnej jazdy po wielogodzinne wysiłki.',
    },
    de: {
      title: 'Wie viele Kohlenhydrate pro Stunde brauchst du wirklich?',
      description:
        'Ein praktischer 30-90-g/h-Bereich nach Fahrdauer und Intensität statt einer starren Regel.',
    },
    it: {
      title: "Quanti carboidrati all'ora servono davvero?",
      description:
        'Una guida pratica per intensità e durata del giro, dalle uscite leggere agli sforzi di più ore.',
    },
  },
  {
    slug: 'gut-training-carb-tolerance',
    datePublished: '2026-08-08',
    en: {
      title: 'Training your gut: how to safely raise your carb tolerance',
      description:
        'A progressive plan for handling more carbs per hour without the bloating and cramps.',
    },
    pl: {
      title: 'Trening jelita: jak bezpiecznie zwiększać tolerancję na węglowodany',
      description:
        'Stopniowy plan na przyjmowanie więcej węglowodanów na godzinę bez wzdęć i skurczów.',
    },
    de: {
      title: 'Darmtraining: wie du deine Kohlenhydrattoleranz sicher steigerst',
      description:
        'Wie du deinen Darm über Wochen an höhere Kohlenhydratmengen gewöhnst, statt es am Renntag zu riskieren.',
    },
    it: {
      title: "Allenare l'intestino: come alzare in sicurezza la tolleranza ai carboidrati",
      description:
        "Un piano progressivo per gestire più carboidrati all'ora senza gonfiore e crampi.",
    },
  },
  {
    slug: 'bottle-vs-gel',
    datePublished: '2026-08-08',
    en: {
      title: 'Bottle or gel? When and what to choose',
      description: 'Comparing bottles, gels, and solid food for getting carbs in during a ride.',
    },
    pl: {
      title: 'Bidon czy żel? Kiedy i co wybrać',
      description: 'Porównanie bidonu, żelu i jedzenia stałego jako źródeł węglowodanów na trasie.',
    },
    de: {
      title: 'Flasche oder Gel? Wann was wählen',
      description: 'Wann Flasche, Gel und feste Nahrung im Rennen jeweils ihre Stärken ausspielen.',
    },
    it: {
      title: 'Borraccia o gel? Quando e cosa scegliere',
      description:
        'Confronto tra borracce, gel e cibo solido per assumere carboidrati durante un giro.',
    },
  },
  {
    slug: 'hydration-water-per-hour',
    datePublished: '2026-08-08',
    en: {
      title: 'How much water per hour? Hydration, heat, and sweat rate',
      description: 'Why fluid needs swing so much between riders — and how to estimate yours.',
    },
    pl: {
      title: 'Ile wody na godzinę? Nawodnienie, temperatura i tempo pocenia',
      description:
        'Dlaczego zapotrzebowanie na płyny tak bardzo różni się między rowerzystami — i jak oszacować swoje.',
    },
    de: {
      title: 'Wie viel Wasser pro Stunde? Flüssigkeit, Hitze und Schweißrate',
      description:
        'Warum es keine feste ml-Zahl gibt und wie Temperatur deinen echten Flüssigkeitsbedarf bestimmt.',
    },
    it: {
      title: "Quanta acqua all'ora? Idratazione, caldo e tasso di sudorazione",
      description:
        'Perché il fabbisogno di liquidi varia tanto da persona a persona — e come stimare il tuo.',
    },
  },
  {
    slug: 'sodium-electrolytes-cycling',
    datePublished: '2026-08-08',
    en: {
      title: 'Sodium on the bike: when extra electrolytes actually make a difference',
      description:
        "Sweat sodium losses vary a lot between riders — here's when supplementing is worth it.",
    },
    pl: {
      title: 'Sód na rowerze: kiedy dodatkowa suplementacja elektrolitowa ma sens',
      description:
        'Straty sodu z potem mocno różnią się między osobami — kiedy warto je uzupełniać.',
    },
    de: {
      title: 'Natrium auf dem Rad: wann zusätzliche Elektrolyte wirklich einen Unterschied machen',
      description:
        'Wie du erkennst, ob du zu den "Salty Sweaters" gehörst, und wann sich zusätzliches Natrium lohnt.',
    },
    it: {
      title: 'Sodio in bici: quando gli elettroliti extra fanno davvero la differenza',
      description:
        'Le perdite di sodio col sudore variano molto da persona a persona — ecco quando conviene integrarlo.',
    },
  },
  {
    slug: 'honey-sugar-diy-mix',
    datePublished: '2026-08-08',
    en: {
      title: 'Honey or table sugar instead of a store-bought mix — does it work as well?',
      description:
        'The science behind DIY carb mixes, and how they compare to commercial isotonic powders.',
    },
    pl: {
      title: 'Miód albo cukier zamiast gotowego proszku — czy to działa tak samo dobrze?',
      description:
        'Nauka stojąca za domowymi miksami węglowodanowymi i porównanie z gotowymi proszkami izotonicznymi.',
    },
    de: {
      title: 'Honig oder Haushaltszucker statt fertigem Pulver — funktioniert das genauso gut?',
      description:
        'Warum eine Glukose-Fruktose-Mischung aus Honig oder Zucker fast identisch wirkt wie ein Fertigprodukt.',
    },
    it: {
      title:
        'Miele o zucchero da tavola al posto di una miscela pronta — funziona altrettanto bene?',
      description:
        'La scienza dietro le miscele di carboidrati fatte in casa, a confronto con le polveri isotoniche commerciali.',
    },
  },
  {
    slug: 'heat-carb-plan',
    datePublished: '2026-08-08',
    en: {
      title: "How heat changes your carb plan (it's not just 'drink more')",
      description:
        'Why hot-weather riding shifts what and how much you should take in, not just how much you drink.',
    },
    pl: {
      title: "Jak upał zmienia Twój plan węglowodanowy (to nie tylko 'pij więcej')",
      description:
        'Dlaczego jazda w upale zmienia to, co i ile powinieneś przyjmować — nie tylko ile pijesz.',
    },
    de: {
      title: "Wie Hitze deinen Kohlenhydratplan verändert (es ist nicht nur 'mehr trinken')",
      description:
        'Warum Hitze nicht nur mehr Schweiß bedeutet, sondern auch die Kohlenhydrataufnahme deines Darms bremst.',
    },
    it: {
      title: 'Come il caldo cambia il tuo piano di carboidrati (non basta «bevi di più»)',
      description: 'Perché il caldo cambia cosa e quanto dovresti assumere, non solo quanto bevi.',
    },
  },
  {
    slug: 'fueling-100km-vs-300km',
    datePublished: '2026-08-08',
    en: {
      title: 'Fueling a 100 km ride vs. a 300+ km ride: what actually changes',
      description: 'Why strategy shifts as rides stretch from a few hours to all day and beyond.',
    },
    pl: {
      title: 'Fueling na 100 km vs. 300 km: co się zmienia w strategii',
      description:
        'Dlaczego strategia zmienia się wraz z wydłużaniem trasy z kilku godzin na cały dzień i dłużej.',
    },
    de: {
      title: 'Fueling bei 100 km vs. 300 km: was sich an der Strategie ändert',
      description:
        'Wie sich Limitierung, Geschmacksermüdung und Logistik zwischen kurzen und Ultra-Distanzen verschieben.',
    },
    it: {
      title: 'Fueling per 100 km vs. 300+ km: cosa cambia davvero',
      description:
        "Perché la strategia cambia man mano che il giro passa da poche ore a un'intera giornata e oltre.",
    },
  },
  {
    slug: 'pace-power-absorption',
    datePublished: '2026-08-08',
    en: {
      title: 'Does your pace or power affect how much you can absorb?',
      description:
        "Demand and absorption capacity aren't the same thing — until intensity gets extreme.",
    },
    pl: {
      title: 'Czy tempo lub moc wpływają na to, ile możesz wchłonąć?',
      description:
        'Zapotrzebowanie i zdolność wchłaniania to nie to samo — dopóki intensywność nie zrobi się ekstremalna.',
    },
    de: {
      title: 'Beeinflussen Tempo oder Leistung, wie viel du aufnehmen kannst?',
      description:
        'Warum eine härtere Fahrt zwar deinen Kohlenhydratbedarf erhöht, aber nicht deine Aufnahmeobergrenze.',
    },
    it: {
      title: 'Ritmo o potenza influenzano quanto puoi assorbire?',
      description:
        "Fabbisogno e capacità di assorbimento non sono la stessa cosa — finché l'intensità non diventa estrema.",
    },
  },
  {
    slug: 'diy-flavor-additives',
    datePublished: '2026-08-08',
    en: {
      title:
        'DIY flavor additives: simple ways to make the contents of your bottle or gel taste better',
      description:
        'Flavor drops, freeze-dried fruit, hibiscus, and other easy ways to fix a boring bottle.',
    },
    pl: {
      title: 'Domowe dodatki smakowe: proste sposoby na lepszy smak zawartości bidonu czy żelu',
      description:
        'Aromaty w kroplach, liofilizowane owoce, hibiskus i inne łatwe sposoby na nudny bidon.',
    },
    de: {
      title:
        'Selbstgemachte Geschmackszusätze: einfache Wege, um Flasche oder Gel besser schmecken zu lassen',
      description:
        'Wie Zitrusaromen, Fruchtpulver, Hibiskus und Salz gegen Geschmacksermüdung auf langen Fahrten helfen.',
    },
    it: {
      title:
        'Aggiunte di gusto fatte in casa: modi semplici per migliorare il sapore di borraccia o gel',
      description:
        'Aromi in gocce, frutta liofilizzata, ibisco e altri modi facili per risolvere una borraccia noiosa.',
    },
  },
  {
    slug: 'what-the-chart-shows',
    datePublished: '2026-08-08',
    en: {
      title: 'What the chart actually shows: from bottle to bloodstream',
      description:
        'A line-by-line walkthrough of the simulation — intake, gut, absorption cap, and deficit.',
    },
    pl: {
      title: 'Co właściwie pokazuje wykres: od bidonu do krwiobiegu',
      description: 'Wykres linia po linii — spożycie, żołądek, sufit wchłaniania i niedobór.',
    },
    de: {
      title: 'Was das Diagramm eigentlich zeigt: von der Flasche in den Blutkreislauf',
      description:
        'Wie Carb Fueling Essen, Verdauung, Aufnahmeobergrenze und Defizit über die ganze Strecke sichtbar macht.',
    },
    it: {
      title: 'Cosa mostra davvero il grafico: dalla borraccia al flusso sanguigno',
      description:
        'Il grafico spiegato riga per riga — apporto, stomaco, soglia di assorbimento e deficit.',
    },
  },
  {
    slug: 'running-vs-cycling-carbs',
    datePublished: '2026-08-22',
    en: {
      title: 'Running vs. cycling: how carb needs and absorption really differ',
      description:
        "Your gut's absorption ceiling doesn't change between running and cycling — but your practical target should. Here's why.",
    },
    pl: {
      title:
        'Bieganie vs rower: czym naprawdę różni się zapotrzebowanie i wchłanianie węglowodanów',
      description:
        'Sufit wchłaniania jelita nie zmienia się między bieganiem a rowerem — ale Twój praktyczny cel powinien. Oto dlaczego.',
    },
    de: {
      title: 'Laufen vs. Rad: wie sich Kohlenhydratbedarf und -aufnahme wirklich unterscheiden',
      description:
        'Warum dieselbe Aufnahmeobergrenze beim Laufen wegen der mechanischen Belastung trotzdem öfter Probleme macht.',
    },
    it: {
      title: "Corsa vs bici: come cambiano davvero il fabbisogno e l'assorbimento dei carboidrati",
      description:
        'La soglia di assorbimento intestinale non cambia tra corsa e bici — ma il tuo obiettivo pratico sì. Ecco perché.',
    },
  },
  {
    slug: 'rice-cake-bars',
    datePublished: '2026-09-07',
    en: {
      title: 'Homemade rice cakes: a real-food recipe for when gels get old',
      description:
        'A simple rice, coconut, and date bar — the carb count per piece, and why real food beats another gel late in a long ride.',
    },
    pl: {
      title: 'Domowy rice cake: przepis na paliwo, gdy żele już nie wchodzą',
      description:
        'Prosty batonik z ryżu, mleczka kokosowego i daktyli — ile ma węglowodanów na porcję i dlaczego realne jedzenie wygrywa z kolejnym żelem pod koniec długiej trasy.',
    },
    de: {
      title: 'Rice Cake selbst gemacht: Verpflegung für den Moment, wenn Gele nicht mehr gehen',
      description:
        'Ein Reisriegel-Rezept mit Nährwerten gegen Geschmacksermüdung auf sehr langen Strecken.',
    },
    it: {
      title: 'Rice cake fatti in casa: una ricetta di cibo vero per quando i gel stancano',
      description:
        "Una barretta semplice di riso, cocco e datteri — i carboidrati per pezzo, e perché il cibo vero batte l'ennesimo gel a fine giornata su un giro lungo.",
    },
  },
];
