export interface FaqArticleMeta {
  slug: string;
  /** ISO date (YYYY-MM-DD) this article first went live — used as JSON-LD datePublished. */
  datePublished: string;
  en: { title: string; description: string };
  pl: { title: string; description: string };
}

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
  },
  {
    slug: 'bottle-vs-gel',
    datePublished: '2026-08-08',
    en: {
      title: 'Bottle or gel? When each carb-delivery format actually pays off',
      description: 'Comparing bottles, gels, and solid food for getting carbs in during a ride.',
    },
    pl: {
      title: 'Bidon czy żel? Kiedy opłaca się każda forma dostarczania węglowodanów',
      description: 'Porównanie bidonu, żelu i jedzenia stałego jako źródeł węglowodanów na trasie.',
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
  },
  {
    slug: 'diy-flavor-additives',
    datePublished: '2026-08-08',
    en: {
      title: 'DIY flavor additives: simple ways to make your mix taste better',
      description:
        'Flavor drops, freeze-dried fruit, hibiscus, and other easy ways to fix a boring bottle.',
    },
    pl: {
      title: 'Domowe dodatki smakowe: proste sposoby na lepszy smak miksu',
      description:
        'Aromaty w kroplach, liofilizowane owoce, hibiskus i inne łatwe sposoby na nudny bidon.',
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
  },
];
