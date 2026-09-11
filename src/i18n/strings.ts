// Alphabetical by code, and kept that way as languages are added: this array's order is the
// order every language list renders in — the calculator's dropdown (Header.tsx), the mobile
// profile, and the static pages' switch (src/static/LangMenu.tsx).
export const LANGS = ['de', 'en', 'it', 'pl'] as const;
export type Lang = (typeof LANGS)[number];

export interface StringTable {
  tagline: string;
  desktop: string;
  mobile: string;
  routeCycling: string;
  routeRunning: string;
  byRoute: string;
  byTime: string;
  distance: string;
  speed: string;
  sportCycling: string;
  sportRunning: string;
  pace: string;
  hours: string;
  minutes: string;
  duration: string;
  weight: string;
  preMealCarbs: string;
  preMealMinutes: string;
  intensity: string;
  intensityHint: string;
  intensityInfoBtnLabel: string;
  low: string;
  medium: string;
  high: string;
  temp: string;
  carbsPerHour: string;
  gear: string;
  settings: string;
  profile: string;
  addGear: string;
  savedLocally: string;
  canCarry: string;
  gelPartsLabel: string;
  gearHint: string;
  settingsHint: string;
  curve: string;
  gutHint: string;
  curveHint: string;
  absorbed: string;
  gutLane: string;
  need: string;
  timeline: string;
  axisTime: string;
  gutOver: string;
  gutAt: string;
  dry: string;
  dryAt: string;
  carbMode: string;
  fluidMode: string;
  tDry: string;
  legFluid: string;
  legSweat: string;
  legCap: string;
  capNote: string;
  capNote2: string;
  capNoteFluid: string;
  tAbsorbed: string;
  tCap: string;
  tGutPeak: string;
  timelineHint: string;
  dragHint: string;
  addFuel: string;
  removeItem?: string;
  addShopStop: string;
  addFillTo: string;
  emptyLaneHint: string;
  coverage: string;
  summary: string;
  hydration: string;
  sweatLoss: string;
  planned: string;
  needSum: string;
  recipes: string;
  recipesHint: string;
  ratio: string;
  mixRatioHint: string;
  mixSugarBlendHeader: string;
  mixSugarAmountIzo: string;
  mixSugarAmountGel: string;
  mixSaltAmount: string;
  ratioLabelSugar: string;
  ratioLabelHoney: string;
  concLabel: string;
  saltLabel: string;
  citricLabel: string;
  citricSourceLabel: string;
  mixFlavorHeader: string;
  mixCitricHint: string;
  citricSourceCitric: string;
  citricSourceLemon: string;
  citricSourceLime: string;
  citricSourceLemonJuice: string;
  citricSourceLimeJuice: string;
  citricFieldLemon: string;
  citricFieldLime: string;
  citricFieldLemonJuice: string;
  citricFieldLimeJuice: string;
  gelConcLabel: string;
  per100: string;
  per100Ml: string;
  per100Fruit: string;
  mixIzo: string;
  mixGel: string;
  target: string;
  mobileNotesTitle: string;
  tCarbs: string;
  tTarget: string;
  tGap: string;
  tKcal: string;
  tDrink: string;
  tSolid: string;
  tRefills: string;
  tPortions: string;
  tabPlan: string;
  tabGear: string;
  tabFood: string;
  tabMe: string;
  ok: string;
  low2: string;
  over: string;
  dip: string;
  hydOk: string;
  hydLow: string;
  gpx: string;
  gpxFile: string;
  gpxOn: string;
  gpxPick: string;
  gpxBad: string;
  shot: string;
  sipped: string;
  water: string;
  izo: string;
  gel: string;
  fill: string;
  refills: string;
  addFill: string;
  noRoom: string;
  foodLane: string;
  foodLaneSub: string;
  addFoodHint: string;
  portions: string;
  malto: string;
  fructose: string;
  salt: string;
  citric: string;
  waterFill: string;
  carbsIn: string;
  perPortion: string;
  refillAt: string;
  langName: string;
  langShort: string;
  itemsSuffix: string;
  newVessel: string;
  viewLabel: string;
  viewAuto: string;
  autoDetected: string;
  themeToggleLabel: string;
  themeLabel: string;
  themeAuto: string;
  themeLight: string;
  themeDark: string;
  viewModeConfirmTitle: string;
  viewModeConfirmBody: string;
  viewModeConfirmCancel: string;
  viewModeConfirmConfirm: string;
  mixSection: string;
  editInSettings: string;
  ratioCustom: string;
  resetDefaults: string;
  foodSection: string;
  addFoodItem: string;
  newFood: string;
  fName: string;
  fCarbs: string;
  fMl: string;
  fCont: string;
  fContHeader: string;
  foodSectionHint: string;
  foodContHint: string;
  mixHintPre: string;
  mixHintLink1: string;
  mixHintMid1: string;
  mixHintLink2: string;
  mixHintMid2: string;
  mixHintLink3: string;
  mixHintMid3: string;
  mixHintLink4: string;
  mixHintPost: string;
  notes: { title: string; body: string }[];
  ftAboutBody: string;
  ftSources2: string;
  ftPrivacy: string;
  ftLegal: string;
  ftLegalBody: string;
  ftLinks: string;
  ftFaq: string;
  ftIssues: string;
  ftRepo: string;
  ftSupport: string;
  ftSponsor: string;
  ftContact: string;
  ftCopyright: string;
  tourWelcomeTitle: string;
  tourWelcomeBody: string;
  tourRouteTitle: string;
  tourRouteBody: string;
  tourRouteBodyMobile: string;
  tourChartTitle: string;
  tourChartBody: string;
  tourChartBodyMobile: string;
  tourFillTitle: string;
  tourFillBody: string;
  tourFillBodyMobile: string;
  tourAddFillTitle: string;
  tourAddFillBody: string;
  tourAddFillBodyMobile: string;
  tourAddShopTitle: string;
  tourAddShopBody: string;
  tourAddShopBodyMobile: string;
  tourClosingTitle: string;
  tourClosingBody: string;
  tourClosingBodyMobile: string;
  tourNext: string;
  tourBack: string;
  tourSkip: string;
  tourFinish: string;
  tourStepLabel: string;
  tourReplayButton: string;
  tourConfirmTitle: string;
  tourConfirmBody: string;
  tourConfirmCancel: string;
  tourConfirmStart: string;
  tabMix: string;
  editRoutePrefix: string;
  narrationRate: string;
  narrationFluid: string;
  narrationProfile: string;
  scrubHint: string;
  legendGpx: string;
  chartHelpBtnLabel: string;
  chartHelpTitle: string;
  chartHelpFullTour: string;
  chartHelpScrubNote: string;
  chartHelpAxisNote: string;
  chartHelpAbsorbedBody: string;
  chartHelpNeedBody: string;
  chartHelpCapBody: string;
  chartHelpGutBody: string;
  chartHelpDeficitLabel: string;
  chartHelpDeficitBody: string;
  chartHelpFluidAbsorbedBody: string;
  chartHelpFluidCapBody: string;
  chartHelpSweatBody: string;
  foodSection2: string;
  gearHintMobile: string;
  mixHintMobile: string;
  absCapNoteMobile: string;
  gelPartsStepper: string;
  foodStepwise: string;
  foodAddProduct: string;
  meWeight: string;
  meApp: string;
  meLanguage: string;
  meView: string;
  mixSheetTitle: string;
  mixSheetSubtitle: string;
  mixSheetEmpty: string;
  mixRowSugar: string;
  mixRowMalto: string;
  mixRowFructose: string;
  mixRowSalt: string;
  mixRowCitric: string;
  mixRowWater: string;
  routeSheetTitleCycling: string;
  routeSheetTitleRunning: string;
  routeSheetPreStart: string;
  routeSheetIntensity: string;
  routeSheetTemp: string;
  routeSheetGpxSection: string;
  routeSheetGpxNote: string;
  routeSheetLoadFile: string;
  routeSheetDone: string;
  shopSheetTitle: string;
  shopSheetKm: string;
  shopSheetName: string;
  shopSheetAdd: string;
  shopDefaultName: string;
  combineFillCheckbox: string;
  combineSectionTitle: string;
  combineSectionHint: string;
  combineBottles: string;
  combineNote: string;
  combineMixedLabel: string;
  combinePourLabel: string;
  combineCrossTypeConfirmTitle: string;
  combineCrossTypeConfirmBody: string;
  combineCrossTypeConfirmCancel: string;
  gelLockedNote: string;
  unlockGelButton: string;
  combineCrossTypeConfirmConfirm: string;
  bidonComposition: string;
  perFillGrams: string;
  addLandmark: string;
  noGap: string;
  noRoomHint: string;
  rateInSegmentSuffix: string;
  eatenOnceLabel: string;
  carbCardTitle: string;
  inPlanSuffix: string;
  planDataSection: string;
  planDataHint: string;
  exportPlanButton: string;
  importPlanButton: string;
  importPlanConfirmTitle: string;
  importPlanConfirmBody: string;
  importPlanConfirmCancel: string;
  importPlanConfirmConfirm: string;
  importPlanError: string;
  importPlanSuccess: string;
  exportPlanError: string;
  clearPlanButton: string;
  printPlanButton: string;
  printStripBottles: string;
  printStripFood: string;
  printStripStops: string;
  printCutHint: string;
  clearPlanConfirmTitle: string;
  clearPlanConfirmBody: string;
  clearPlanConfirmCancel: string;
  clearPlanConfirmConfirm: string;
  recoveryLabel: string;
  recoveryHint: string;
  carbRateHint: string;
  waterBalanceHint: string;
  waterBalanceHintLink: string;
  waterBalanceAria: string;
  waterBalanceLabel: string;
}

export const STR: Record<Lang, StringTable> = {
  pl: {
    tagline: 'planer węglowodanów i nawodnienia',
    desktop: 'Komputer',
    mobile: 'Telefon',
    routeCycling: 'Trasa rowerowa',
    routeRunning: 'Trasa biegowa',
    byRoute: 'Dystans + tempo',
    byTime: 'Czas',
    distance: 'Dystans',
    speed: 'Śr. prędkość',
    sportCycling: 'Rower',
    sportRunning: 'Bieg',
    pace: 'Tempo (min/km)',
    hours: 'Godziny',
    minutes: 'Minuty',
    duration: 'Czas trwania',
    weight: 'Waga',
    preMealCarbs: 'Węgle przed startem',
    preMealMinutes: 'Czas przed startem',
    intensity: 'Intensywność',
    intensityHint:
      'Niska = swobodnie rozmawiasz pełnymi zdaniami. Średnia = rozmawiasz, ale pojedynczymi zdaniami. Wysoka = ledwo mówisz, skupiony na oddechu. Od tego zależy, ile węglowodanów na godzinę zaplanuje Carb Fueling — a przy Wysokiej dodatkowo obniża to, ile Twoje jelito faktycznie jest w stanie wchłonąć.',
    intensityInfoBtnLabel: 'Wyjaśnij intensywność',
    low: 'Niska',
    medium: 'Średnia',
    high: 'Wysoka',
    temp: 'Temperatura',
    carbsPerHour: 'Zapotrzebowanie',
    gear: 'Mój sprzęt',
    settings: 'Ustawienia',
    profile: 'Profil',
    addGear: 'Dodaj bidon',
    savedLocally: 'Zapisane lokalnie',
    canCarry: 'Może zawierać:',
    gelPartsLabel: 'porcje',
    gearHint:
      'Nazwa, pojemność i to, co dany bidon może wozić. Żel dzieli się na tyle porcji, ile tu ustawisz.',
    settingsHint:
      'Wszystko zapisuje się w tej przeglądarce (localStorage) — bez konta, bez backendu.',
    curve: 'Planowanie',
    gutHint:
      'To Twój żołądek: górny pasek pokazuje, co w nim zalega i jak szybko się trawi, aż do górnego limitu pojemności.',
    curveHint:
      'Gruba ciągła linia to tempo, w jakim realnie wchłaniasz węglowodany — rdzawe pola to godziny, w których wchłaniasz mniej, niż potrzebujesz.',
    absorbed: 'Wchłonięte',
    gutLane: 'W żołądku',
    need: 'Zapotrzebowanie',
    timeline: 'Rozkład',
    axisTime: 'godziny',
    gutOver: 'Za dużo naraz — ',
    gutAt: ' g zalega w żołądku ok. ',
    dry: 'Dziura w tankowaniu: ',
    dryAt: ' bez cukru, ok. ',
    carbMode: 'Węglowodany (g/h)',
    fluidMode: 'Nawodnienie (ml/h)',
    tDry: 'Najdłuższa dziura',
    legFluid: 'Płyny',
    legSweat: 'Pot',
    legCap: 'Limit wchłaniania',
    capNote: 'Limit wchłaniania: ',
    capNote2:
      ' — tyle maksymalnie na godzinę wchłonie Twoje jelito, obojętnie ile zjesz; nadwyżka nie znika, tylko czeka w żołądku. Rośnie, gdy mieszasz glukozę z fruktozą, bo mają osobne drogi wchłaniania (glukoza ok. 60 g/h, fruktoza dokłada do tego ok. 30 g/h) — dlatego liczę go z Twojej proporcji maltodekstryna:fruktoza (Jeukendrup, przegląd 2010–2014).',
    capNoteFluid:
      'Limit wchłaniania: ok. 900 ml/h — tyle żołądek średnio oddaje do jelita w wysiłku (przerywana linia); u konkretnej osoby to realnie ±kilkaset ml, zależnie od intensywności i wytrenowania jelita. Powyżej tego tempa linia robi się coraz bardziej żółta, potem pomarańczowa i czerwona — to sygnał rosnącego ryzyka zalegania i dyskomfortu, nie twardy limit. Do sumy nawodnienia i tak liczy się tylko tyle, ile żołądek zdążył przepuścić, zanim trasa się skończyła.',
    tAbsorbed: 'Wchłonięte',
    tCap: 'Limit wchłaniania',
    tGutPeak: 'Max w żołądku',
    timelineHint:
      'Podgląd — pozycję, zakres i zawartość każdej dolewki ustawiasz na wykresie powyżej.',
    dragHint:
      'Paski nie nachodzą na siebie — w ciasnej luce przeciągany pasek się skraca. Kreski porcji żelu przesuwasz osobno.',
    addFuel: 'Dodaj jedzenie:',
    removeItem: 'Usuń',
    addShopStop: 'Dodaj sklep',
    addFillTo: 'Dodaj dolewkę do ',
    emptyLaneHint: 'Kliknij +, żeby dodać dolewkę',
    coverage: 'Pokrycie zapotrzebowania',
    summary: 'Podsumowanie',
    hydration: 'Nawodnienie',
    sweatLoss: 'Utrata',
    planned: 'Plan',
    needSum: 'Zapotrzebowanie',
    recipes: 'Skład bidonów',
    recipesHint: 'Gramy do odmierzenia na każde napełnienie — osobno na bidon, flask czy słoiczek.',
    ratio: 'Maltodekstryna : Fruktoza',
    mixRatioHint:
      'Maltodekstryna i fruktoza wchłaniają się w jelicie dwoma osobnymi drogami — łącząc je, organizm przyswaja więcej węglowodanów w ciągu godziny niż z samej maltodekstryny. Domyślna proporcja to 2:1, ale podobny efekt daje zwykły cukier (naturalnie ok. 1:1 glukozy do fruktozy) albo miód (ok. 0,8:1) — to gotowe, naturalne odpowiedniki tej samej mieszanki. Przy dobrze wytrenowanym jelicie sprawdza się też mieszanka 1,2:1.',
    mixSugarBlendHeader: 'Mieszanka cukrów — stosunek Maltodekstryny do Fruktozy',
    mixSugarAmountIzo: 'Ile cukru (łącznie) ma być w napoju',
    mixSugarAmountGel: 'Ile cukru (łącznie) ma być w żelu',
    mixSaltAmount: 'Uzupełnienie soli mineralnych: sól',
    ratioLabelSugar: 'Cukier',
    ratioLabelHoney: 'Miód',
    concLabel: 'cukry',
    saltLabel: 'sól',
    citricLabel: 'kwasek',
    citricSourceLabel: 'Kwasek',
    mixFlavorHeader: 'Dodatek smakowy redukujący słodki smak',
    mixCitricHint: 'Kwasek to tylko smak — nie wpływa na tempo wchłaniania węglowodanów.',
    citricSourceCitric: 'Kwasek cytrynowy',
    citricSourceLemon: 'Cytryna',
    citricSourceLime: 'Limonka',
    citricSourceLemonJuice: 'Sok z cytryny',
    citricSourceLimeJuice: 'Sok z limonki',
    citricFieldLemon: 'Świeża cytryna',
    citricFieldLime: 'Świeża limonka',
    citricFieldLemonJuice: 'Sok z cytryny w butelce',
    citricFieldLimeJuice: 'Sok z limonki w butelce',
    gelConcLabel: 'cukry',
    per100: 'g/100 ml',
    per100Ml: 'ml/100 ml',
    per100Fruit: '%/100 ml',
    mixIzo: 'Napój',
    mixGel: 'Żel',
    target: 'Cel',
    mobileNotesTitle: 'Zasady wersji mobilnej',
    tCarbs: 'Cukry łącznie',
    tTarget: 'Cel',
    tGap: 'Różnica',
    tKcal: 'Energia',
    tDrink: 'Z płynów',
    tSolid: 'Z jedzenia',
    tRefills: 'Dolewki',
    tPortions: 'Porcje żelu',
    tabPlan: 'Plan',
    tabGear: 'Sprzęt',
    tabFood: 'Produkty',
    tabMe: 'Ja',
    ok: 'Plan pokrywa zapotrzebowanie równomiernie. Największy dołek: ',
    low2: 'Za mało cukru — dołóż element w drugiej połowie trasy.',
    over: 'Powyżej zapotrzebowania — ryzyko problemów żołądkowych.',
    dip: ' g poniżej krzywej ok. ',
    hydOk: 'Płyny pokrywają utratę. Uzupełniaj równomiernie.',
    hydLow: 'Zaplanuj dolewkę lub dodatkowy bidon.',
    gpx: 'Profil GPX',
    gpxFile: 'track.gpx (demo)',
    gpxOn: 'Wł.',
    gpxPick: 'Wczytaj',
    gpxBad: 'Nie udało się odczytać pliku GPX.',
    shot: 'jednorazowo',
    sipped: 'popijane',
    water: 'Woda',
    izo: 'Izo',
    gel: 'Żel',
    fill: 'Napełnienie',
    refills: 'dolewki',
    addFill: '+ dolewka po wyczerpaniu',
    noRoom: 'brak wolnej luki',
    foodLane: 'Jedzenie / dodatki',
    foodLaneSub: 'mogą się nakładać',
    addFoodHint: 'wybierz z listy pod wykresem',
    portions: 'porcji',
    malto: 'Maltodekstryna',
    fructose: 'Fruktoza',
    salt: 'Sól',
    citric: 'Kwasek cytrynowy',
    waterFill: 'Woda',
    carbsIn: 'Cukry',
    perPortion: 'Na porcję',
    refillAt: 'dolewka na ',
    langName: 'Polski',
    langShort: 'PL',
    itemsSuffix: 'elementów',
    newVessel: 'Nowy bidon',
    viewLabel: 'Tryb wyświetlania',
    viewAuto: 'Auto',
    autoDetected: 'wykryte automatycznie: ',
    themeToggleLabel: 'Przełącz motyw (auto/jasny/ciemny)',
    themeLabel: 'Motyw',
    themeAuto: 'Auto',
    themeLight: 'Jasny',
    themeDark: 'Ciemny',
    viewModeConfirmTitle: 'Wymusić ten widok?',
    viewModeConfirmBody:
      'Ekran przestanie się automatycznie dopasowywać do rozmiaru urządzenia. Możesz to zmienić w dowolnej chwili w tym samym miejscu.',
    viewModeConfirmCancel: 'Anuluj',
    viewModeConfirmConfirm: 'Wymuś',
    mixSection: 'Mieszanka',
    editInSettings: 'ustawienia mieszanki',
    ratioCustom: 'własna',
    resetDefaults: 'Przywróć domyślne',
    foodSection: 'Jedzenie i dodatki',
    addFoodItem: 'Dodaj produkt',
    newFood: 'Nowy produkt',
    fName: 'produkt',
    fCarbs: 'cukry (g)',
    fMl: 'płyn (ml)',
    fCont: 'stopniowo',
    fContHeader: 'uwalnianie',
    foodSectionHint:
      'Twoja lista produktów — te przyciski pojawiają się pod wykresem. Podaj same węglowodany w porcji (nie wagę batona) i ewentualny płyn.',
    foodContHint:
      'Zaznaczenie „stopniowo” sprawia, że produkt trafia na wykres powoli, rozłożony na kilku kilometrach — banana zjesz od razu, ale żelki podjadasz po drodze.',
    mixHintPre: 'Tu ustalisz, z czego będzie się składać Twój napój i żel — ',
    mixHintLink1: 'proporcja cukrów',
    mixHintMid1: ' (możesz też użyć zwykłego ',
    mixHintLink2: 'cukru albo miodu',
    mixHintMid2: '), ',
    mixHintLink3: 'sól',
    mixHintMid3: ' i ',
    mixHintLink4: 'dodatek smakowy',
    mixHintPost:
      '. Wartości podajesz na 100 ml, więc stąd liczone są gramy dla każdego napełnienia w planie.',
    notes: [
      {
        title: 'Linia na każdy bidon',
        body: 'Bidon 720, bidon 610, flask — każdy ma własną linię i nie da się wrzucić żelu do bidonu z izo.',
      },
      {
        title: 'Dolewka po wyczerpaniu',
        body: 'Napełnienia nie zachodzą na siebie: pasek zatrzymuje się na sąsiedzie, a + wstawia dolewkę w wolnej luce.',
      },
      {
        title: 'Jedzenie osobno',
        body: 'Banan i żelki mogą się nakładać, piwo zero bierzesz jednorazowo na stacji — dlatego mają własną linię.',
      },
      {
        title: 'Skład na bidon',
        body: 'Karta „Skład bidonów” liczy gramy maltodekstryny, fruktozy, soli i kwasku dla każdego napełnienia osobno.',
      },
    ],
    ftAboutBody:
      'Carb Fueling liczy, ile węglowodanów i płynów zabrać na trasę — z dystansu, tempa, wagi, intensywności i temperatury — a potem rozkłada je na bidony, flaski i jedzenie w czasie. Plan, sprzęt i lista produktów zapisują się w tej przeglądarce.',
    ftPrivacy:
      'Bez konta, bez serwera, bez cookies. Anonimowe liczniki odwiedzin (GoatCounter) — bez śledzenia Cię między stronami.',
    ftLegal: 'Zastrzeżenie prawne',
    ftLegalBody:
      'To narzędzie edukacyjne i pomocnicze — nie jest poradą medyczną, dietetyczną ani treningową i nie zastępuje kontaktu ze specjalistą. Wyliczenia są szacunkowe, oparte na uśrednionych modelach; Twoje realne zapotrzebowanie, tolerancja żołądkowa, poziom nawodnienia i reakcja na wysiłek mogą się od nich istotnie różnić. Korzystasz z aplikacji na własną odpowiedzialność i wyłącznie na własne ryzyko. Autor nie ponosi odpowiedzialności za jakiekolwiek skutki zdrowotne, kontuzje, szkody, straty ani decyzje podjęte na podstawie wyników — w szczególności nie odpowiada za Twoje zdrowie ani życie. Jeśli chorujesz (m.in. cukrzyca, choroby nerek, serca, przewodu pokarmowego), przyjmujesz leki, jesteś w ciąży albo planujesz długi lub bardzo intensywny start — skonsultuj plan żywieniowy z lekarzem lub dietetykiem sportowym. Nie ignoruj objawów: przy zawrotach głowy, nudnościach, dezorientacji, skurczach lub podejrzeniu hiponatremii przerwij wysiłek i szukaj pomocy. Aplikacja jest dostarczana „taką, jaka jest”, bez żadnych gwarancji.',
    ftLinks: 'Współtwórz',
    ftFaq: 'FAQ',
    ftIssues: 'Pomysły i błędy → GitHub Issues',
    ftRepo: 'Kod źródłowy na GitHubie',
    ftSupport: 'Postaw mi kawę',
    ftSponsor: 'Wesprzyj',
    ftContact: 'Napisz do mnie',
    ftSources2: 'Utrata potu: przybliżenie z wagi, intensywności i temperatury.',
    ftCopyright: '© 2026 Carb Fueling · open source',
    tourWelcomeTitle: 'Witaj w Carb Fueling',
    tourWelcomeBody:
      'W kilku krokach pokażemy, jak zaplanować węglowodany i płyny na trasę oraz jak czytać wynik. Zajmie to około minuty.',
    tourRouteTitle: 'Trasa i wynik',
    tourRouteBody:
      'Tu opisujesz przejazd — dystansem i tempem albo czasem trwania — oraz warunki (intensywność, temperatura, posiłek przed startem). Karty obok pokazują, czy Twój plan pokrywa zapotrzebowanie na węglowodany i płyny. Możesz też wczytać własny plik GPX — wtedy tempo i zapotrzebowanie dopasują się do prawdziwego profilu Twojej trasy (podjazdów i zjazdów), a nie uśrednionego.',
    tourRouteBodyMobile:
      'Trasę edytujesz przyciskiem u góry ekranu — dystansem i tempem albo czasem trwania, plus warunkami (intensywność, temperatura, posiłek przed startem) oraz wczytaniem pliku GPX. Te karty pokazują, czy Twój plan pokrywa zapotrzebowanie na węglowodany i płyny.',
    tourChartTitle: 'Wykres: podaż kontra zapotrzebowanie',
    tourChartBody:
      'Liczby po lewej to skala: gramy węglowodanów na godzinę (g/h). Ciągła linia to ile realnie dostarczasz, przerywana — ile potrzebujesz. Kropkowana pozioma linia to limit wchłaniania: tyle maksymalnie na godzinę wchłonie Twoje jelito, niezależnie od tego, ile zjesz — nadwyżka czeka w żołądku. Pasek nad wykresem to właśnie ten żołądek: pokazuje, co aktualnie trawi. Dodaliśmy przykładowy bidon, żebyś zobaczył, jak to wygląda w praktyce.',
    tourChartBodyMobile:
      'Ciągła linia to ile węglowodanów na godzinę realnie dostarczasz, przerywana — ile potrzebujesz. Kropkowana pozioma linia to limit wchłaniania: tyle maksymalnie na godzinę wchłonie Twoje jelito, niezależnie od tego, ile zjesz — nadwyżka czeka w żołądku. Górna część wykresu to właśnie ten żołądek: pokazuje, co aktualnie trawi. Przesuń palcem po wykresie, żeby odczytać dokładne wartości w danym miejscu trasy. Dodaliśmy przykładowy bidon, żebyś zobaczył, jak to wygląda w praktyce.',
    tourFillTitle: 'Bidon: przesuwanie, zwężanie, zmiana zawartości',
    tourFillBody:
      'Ten pasek to właśnie dodany bidon. Środek można chwycić i przesunąć po trasie, a lewą lub prawą krawędź — żeby skrócić lub wydłużyć odcinek, na którym z niego pijesz. Po najechaniu kursorem pojawiają się przyciski zmiany zawartości (woda / izo / żel), jeśli bidon obsługuje więcej niż jeden rodzaj. Spróbuj tego po zamknięciu touru.',
    tourFillBodyMobile:
      'To dodany bidon. Stuknij w niego, żeby rozwinąć edycję — przyciskami „od” i „do” przesuniesz go po trasie albo zmienisz długość odcinka, a przyciski obok pozwolą zmienić zawartość (woda / izo / żel), jeśli bidon obsługuje więcej niż jeden rodzaj.',
    tourAddFillTitle: 'Dodaj kolejną dolewkę',
    tourAddFillBody:
      'Ten przycisk „+” wstawia kolejną dolewkę w pierwszej wolnej luce na trasie — przydaje się, gdy bidon się skończy i trzeba go napełnić czymś innym. To samo dotyczy jedzenia: przyciski z listą produktów pod wykresem dodają kolejne pozycje jednym kliknięciem.',
    tourAddFillBodyMobile:
      'Ten przycisk dodaje kolejną dolewkę w pierwszej wolnej luce na trasie — przydaje się, gdy bidon się skończy i trzeba go napełnić czymś innym. To samo dotyczy jedzenia: przyciski z listą produktów niżej dodają kolejne pozycje jednym stuknięciem.',
    tourAddShopTitle: 'Punkty zaopatrzenia',
    tourAddShopBody:
      'Ten „+” dodaje na wykresie znacznik punktu zaopatrzenia (np. sklepu) — możesz przeciągnąć go w dowolne miejsce trasy, żeby zaznaczyć, na którym kilometrze planujesz dokupić jedzenie lub napój.',
    tourAddShopBodyMobile:
      'Ten przycisk otwiera formularz punktu zaopatrzenia — wpisujesz kilometr i nazwę (np. sklep), żeby zaznaczyć, gdzie planujesz dokupić jedzenie lub napój.',
    tourClosingTitle: 'To wszystko na start',
    tourClosingBody:
      'Przepisy na uzupełnianie dodanych bidonów i dolewek znajdziesz pod wykresem. Sprzęt, Mieszankę, Produkty i Ustawienia (waga, tryb widoku) znajdziesz w nagłówku. Ten tour możesz odpalić ponownie w każdej chwili przyciskiem w stopce. Jeśli zechcesz dowiedzieć się więcej, zawsze możesz zajrzeć do FAQ — znajdziesz je też w stopce.',
    tourClosingBodyMobile:
      'Przepisy na uzupełnianie bidonów znajdziesz pod przyciskiem „Skład bidonów” na liście planu. Ustawienia i język zmienisz w zakładce „Ja”, a proporcje mieszanki i dostępne bidony — w zakładkach „Mix” i „Sprzęt”. Ten tour możesz odpalić ponownie w każdej chwili przyciskiem w zakładce „Ja”. Jeśli zechcesz dowiedzieć się więcej, FAQ znajdziesz też w zakładce „Ja”.',
    tourNext: 'Dalej',
    tourBack: 'Wstecz',
    tourSkip: 'Pomiń',
    tourFinish: 'Zakończ',
    tourStepLabel: 'Krok',
    tourReplayButton: 'Pokaż tour ponownie',
    tourConfirmTitle: 'Uruchomić tour ponownie?',
    tourConfirmBody:
      'Tour wczyta przykładowe dane (trasa i jeden bidon) w miejsce Twojego aktualnego planu. Tej zmiany nie da się cofnąć.',
    tourConfirmCancel: 'Anuluj',
    tourConfirmStart: 'Uruchom tour',
    tabMix: 'Mieszanka',
    editRoutePrefix: 'Edytuj trasę:',
    narrationRate:
      'Ile węgli na godzinę realnie wchłaniasz (linia) wobec zapotrzebowania (przerywana). Kropkowana to limit wchłaniania.',
    narrationFluid:
      'Ile płynu pijesz na godzinę (linia) wobec tego, ile tracisz z potem (przerywana).',
    narrationProfile:
      'Profil trasy — wysokość nad poziomem morza. Podjazdy podnoszą zapotrzebowanie.',
    scrubHint: 'przesuń palcem, by odczytać',
    legendGpx: 'cel',
    chartHelpBtnLabel: 'Wyjaśnij wykres',
    chartHelpTitle: 'Jak czytać ten wykres',
    chartHelpFullTour: 'Pokaż mi cały samouczek',
    chartHelpScrubNote:
      'Przeciągnij palcem po wykresie, żeby zobaczyć dokładne liczby w danym miejscu trasy.',
    chartHelpAxisNote: 'Dokładne wartości pokazują liczby przy osiach po lewej i na dole wykresu.',
    chartHelpAbsorbedBody:
      'Powoli zwiększa to ilość węglowodanów dostępnych w Twoim organizmie. Planując trasę, starasz się utrzymać tę linię jak najbliżej zapotrzebowania. Kolor linii zmienia się zależnie od tego, co zjadłeś.',
    chartHelpNeedBody:
      'Tyle węglowodanów wymaga od Ciebie trasa w tej godzinie — w czasie wysiłku powinieneś przyjąć tyle węglowodanów.',
    chartHelpCapBody:
      'Maksimum, jakie Twoje jelito wchłonie w ciągu godziny, niezależnie od tego, ile zjesz lub wypijesz.',
    chartHelpGutBody: 'To, co zjesz lub wypijesz, trafia do żołądka i tam się powoli trawi.',
    chartHelpDeficitLabel: 'Niedobór',
    chartHelpDeficitBody: 'Tu wchłaniasz mniej, niż potrzebujesz — ryzyko spadku formy.',
    chartHelpFluidAbsorbedBody: 'Ile faktycznie pijesz w tej godzinie.',
    chartHelpFluidCapBody:
      'Orientacyjne tempo, z jakim żołądek oddaje płyn do jelita. Powyżej niego linia robi się coraz bardziej żółta, potem pomarańczowa i czerwona — to rosnące ryzyko zalegania, nie twardy limit.',
    chartHelpSweatBody: 'Ile tracisz z potem — Twoje zapotrzebowanie na płyny.',
    foodSection2: 'Jedzenie',
    gearHintMobile:
      'Co masz na rowerze. Objętość i dozwolona zawartość decydują o tym, ile węgli wchodzi w jedno napełnienie.',
    mixHintMobile:
      'Skład izo i żelu. Zmiana przelicza gramaturę dla każdego napełnienia i limit wchłaniania.',
    absCapNoteMobile: 'Przy tej proporcji limit to {cap} g/h — kropkowana linia na wykresie.',
    gelPartsStepper: 'Liczba porcji żelu',
    foodStepwise: 'stopniowo',
    foodAddProduct: '+ Dodaj produkt',
    meWeight: 'Waga',
    meApp: 'Aplikacja',
    meLanguage: 'Język',
    meView: 'Tryb wyświetlania',
    mixSheetTitle: 'Skład bidonów',
    mixSheetSubtitle: 'Gramy do odmierzenia na każde napełnienie',
    mixSheetEmpty: 'Brak napełnień · —',
    mixRowSugar: 'Cukry',
    mixRowMalto: 'Maltodekstryna',
    mixRowFructose: 'Fruktoza',
    mixRowSalt: 'Sól',
    mixRowCitric: 'Kwasek cytrynowy',
    mixRowWater: 'Woda',
    routeSheetTitleCycling: 'TRASA ROWEROWA I WARUNKI',
    routeSheetTitleRunning: 'TRASA BIEGOWA I WARUNKI',
    routeSheetPreStart: 'PRZED STARTEM',
    routeSheetIntensity: 'Intensywność',
    routeSheetTemp: 'Temperatura',
    routeSheetGpxSection: 'PROFIL GPX',
    routeSheetGpxNote:
      'Włączony profil zmienia zapotrzebowanie na podjazdach. Ikona oka nad wykresem pokazuje sam profil.',
    routeSheetLoadFile: 'Wczytaj plik',
    routeSheetDone: 'Gotowe',
    shopSheetTitle: 'PUNKT ORIENTACYJNY',
    shopSheetKm: 'Kilometr',
    shopSheetName: 'Nazwa',
    shopSheetAdd: 'Dodaj',
    shopDefaultName: 'Sklep',
    combineFillCheckbox: 'Przygotuj razem',
    combineSectionTitle: 'Wspólna porcja',
    combineSectionHint:
      'Zaznacz napełnienia, które przygotowujesz razem (dowolne bidony, dowolny moment), żeby zobaczyć jedną wspólną porcję zamiast osobnych składów.',
    combineBottles: 'Bidony',
    combineNote: 'Uwzględnione we wspólnej porcji powyżej.',
    combineMixedLabel: 'Izo + żel',
    combinePourLabel: 'Ile do którego bidonu',
    combineCrossTypeConfirmTitle: 'Połączyć izo i żel w jedną porcję?',
    combineCrossTypeConfirmBody:
      'Ta wspólna porcja przejmie z ustawień izo: proporcję malto:fruktoza, sól oraz kwasek (ilość i rodzaj). Własne ustawienia żelu zostają zapisane, ale nie obowiązują, dopóki porcje są połączone — edytuj je w ustawieniach izo. Stężenie żelu (g/100 ml) nadal ustawiasz osobno.',
    combineCrossTypeConfirmCancel: 'Anuluj',
    combineCrossTypeConfirmConfirm: 'Połącz',
    gelLockedNote:
      'Masz połączone porcje — proporcja, sól i kwasek żelu są przejęte z ustawień izo, edytuj je tam.',
    unlockGelButton: 'Odblokuj',
    bidonComposition: 'SKŁAD BIDONÓW',
    perFillGrams: 'gramatura na napełnienie ›',
    addLandmark: 'Dodaj punkt orientacyjny',
    noGap: 'brak wolnego odcinka',
    noRoomHint: 'Brak miejsca',
    rateInSegmentSuffix: ' g/h w tym odcinku',
    eatenOnceLabel: 'zjedzone jednorazowo',
    carbCardTitle: 'Węglowodany',
    inPlanSuffix: '× w planie',
    planDataSection: 'Dane planu',
    planDataHint:
      'Zapisz cały plan (trasę, sprzęt, mieszankę, produkty, sklepy) do pliku albo wczytaj wcześniejszą kopię na innym urządzeniu.',
    exportPlanButton: 'Pobierz plan',
    importPlanButton: 'Załaduj plan',
    importPlanConfirmTitle: 'Zastąpić bieżący plan?',
    importPlanConfirmBody:
      'Import nadpisze Twoją aktualną trasę, sprzęt, mieszankę, produkty i sklepy danymi z pliku. Tej zmiany nie da się cofnąć.',
    importPlanConfirmCancel: 'Anuluj',
    importPlanConfirmConfirm: 'Importuj',
    importPlanError:
      'Nie udało się wczytać pliku — sprawdź, czy to poprawny eksport planu z Carb Fueling.',
    importPlanSuccess: 'Plan zaimportowany.',
    exportPlanError: 'Nie udało się zapisać pliku. Spróbuj ponownie.',
    clearPlanButton: 'Od nowa',
    printPlanButton: 'Drukuj',
    printStripBottles: 'Bidony',
    printStripFood: 'Jedzenie',
    printStripStops: 'Postoje',
    printCutHint: 'Wytnij i przyklej na górnej rurze',
    clearPlanConfirmTitle: 'Zacząć od nowa?',
    clearPlanConfirmBody:
      'Usunie napełnienia, produkty i postoje z trasy. Trasa, sprzęt i mieszanka zostają bez zmian. Tej zmiany nie da się cofnąć.',
    clearPlanConfirmCancel: 'Anuluj',
    clearPlanConfirmConfirm: 'Zacznij od nowa',
    recoveryLabel: 'Regeneracja',
    recoveryHint:
      'Ilość węglowodanów, którą należy spożyć po jeździe, aby uzupełnić glikogen mięśniowy.',
    carbRateHint:
      'Kolor paska pokazuje realne tempo dowozu węgli (g/h) względem tego, ile faktycznie potrzebuje ta trasa — nie procentu wyżej. Zielono jest, gdy dowozisz tyle, ile trzeba; jeśli potrzeba przekracza ok. 40 g/h, wystarczy dobić do 40 g/h, bo powyżej tego dokładanie węgli daje już bardzo mało. Poniżej 1h jazdy/biegu pasek jest szary, bo w tak krótkim czasie węgle i tak nie mają większego znaczenia. Bordowy oznacza, że zaplanowane tempo przekracza to, co Twoje jelito realnie wchłonie — nadmiar zostaje w żołądku i ciągnie wodę, stąd nudności czy wzdęcia przy przejedzeniu.',
    waterBalanceHint:
      'Minus to niedobór wobec strat potu, plus to picie ponad nie. Dopuszczalny niedobór maleje wraz z temperaturą; nadmiar to ryzyko hiponatremii.',
    waterBalanceHintLink: 'Jak to czytać →',
    waterBalanceAria: 'Co oznacza bilans płynów',
    // Not "ubytek masy ciała": the number is signed, and a plus means the plan has the rider
    // gaining water, not losing it.
    waterBalanceLabel: 'Bilans płynów w % masy ciała',
  },
  en: {
    tagline: 'carbohydrate & hydration planner',
    desktop: 'Desktop',
    mobile: 'Phone',
    routeCycling: 'Cycling route',
    routeRunning: 'Running route',
    byRoute: 'Distance + pace',
    byTime: 'Time',
    distance: 'Distance',
    speed: 'Avg speed',
    sportCycling: 'Cycling',
    sportRunning: 'Running',
    pace: 'Pace (min/km)',
    hours: 'Hours',
    minutes: 'Minutes',
    duration: 'Duration',
    weight: 'Weight',
    preMealCarbs: 'Carbs before start',
    preMealMinutes: 'Time before start',
    intensity: 'Intensity',
    intensityHint:
      'Low = you can chat comfortably in full sentences. Medium = you talk, but in short sentences. High = you can barely speak, focused on breathing. This drives how many carbs per hour the app plans for — and at High, it also lowers how much your gut can actually absorb.',
    intensityInfoBtnLabel: 'Explain intensity',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    temp: 'Temperature',
    carbsPerHour: 'Requirement',
    gear: 'My gear',
    settings: 'Settings',
    profile: 'Profile',
    addGear: 'Add bottle',
    savedLocally: 'Saved locally',
    canCarry: 'Can carry:',
    gelPartsLabel: 'portions',
    gearHint:
      'Name, capacity and what this bottle may carry. Gel splits into as many portions as you set here.',
    settingsHint: 'Everything is stored in this browser (localStorage) — no account, no backend.',
    curve: 'Planning',
    gutHint:
      "This is your stomach: the top strip shows what's sitting in it and how fast it's digesting, up to its capacity limit.",
    curveHint:
      "The thick solid line is the rate you're actually absorbing carbs at — rust areas are the hours you're absorbing less than you need.",
    absorbed: 'Absorbed',
    gutLane: 'In the gut',
    need: 'Requirement',
    timeline: 'Schedule',
    axisTime: 'hours',
    gutOver: 'Too much at once — ',
    gutAt: ' g sitting in the stomach around ',
    dry: 'Fuelling gap: ',
    dryAt: ' with no carbs, around ',
    carbMode: 'Carbs (g/h)',
    fluidMode: 'Hydration (ml/h)',
    tDry: 'Longest gap',
    legFluid: 'Fluids',
    legSweat: 'Sweat',
    legCap: 'Absorption limit',
    capNote: 'Absorption limit: ',
    capNote2:
      " — that's the most your gut can absorb per hour no matter how much you eat; anything above it doesn't vanish, it just waits in the stomach. It goes up when you mix glucose and fructose, since they're absorbed through separate routes (glucose ~60 g/h, fructose adds ~30 g/h on top) — that's why it's derived from your maltodextrin:fructose ratio (Jeukendrup, 2010–2014 reviews).",
    capNoteFluid:
      'Absorption limit: ~900 ml/h — roughly how fast the stomach passes fluid on to the gut under load (dashed line); the real number varies by a few hundred ml either way depending on intensity and gut training. Above that pace the line shifts from yellow to orange to red — a comfort-risk signal, not a hard cutoff. Your hydration total still only counts what the stomach had time to clear before the ride ended.',
    tAbsorbed: 'Absorbed',
    tCap: 'Absorption limit',
    tGutPeak: 'Peak in stomach',
    timelineHint:
      'Read-only view — set position, range and contents of each refill on the chart above.',
    dragHint:
      'Bars never overlap — a dragged bar shortens to fit a tight gap. Gel portion marks drag on their own.',
    addFuel: 'Add food:',
    removeItem: 'Remove',
    addShopStop: 'Add shop stop',
    addFillTo: 'Add a fill to ',
    emptyLaneHint: 'Click + to add a fill',
    coverage: 'Requirement covered',
    summary: 'Summary',
    hydration: 'Hydration',
    sweatLoss: 'Loss',
    planned: 'Planned',
    needSum: 'Requirement',
    recipes: 'Bottle recipes',
    recipesHint: 'Grams to measure out for each fill — per bottle, flask or jar.',
    ratio: 'Maltodextrin : Fructose',
    mixRatioHint:
      "Maltodextrin and fructose are absorbed through two separate gut pathways — combining them lets your body take in more carbs per hour than from maltodextrin alone. The default ratio is 2:1, but plain sugar (naturally about 1:1 glucose to fructose) or honey (about 0.8:1) give a similar effect — they're ready-made, natural equivalents of the same blend. A well-trained gut can also work well with a 1.2:1 mix.",
    mixSugarBlendHeader: 'Sugar blend — Maltodextrin to Fructose ratio',
    mixSugarAmountIzo: 'How much sugar (total) should be in the drink',
    mixSugarAmountGel: 'How much sugar (total) should be in the gel',
    mixSaltAmount: 'Mineral salt top-up: salt',
    ratioLabelSugar: 'Sugar',
    ratioLabelHoney: 'Honey',
    concLabel: 'carbs',
    saltLabel: 'salt',
    citricLabel: 'citric',
    citricSourceLabel: 'Acid',
    mixFlavorHeader: 'Flavor additive to reduce sweetness',
    mixCitricHint: "Citric is purely about taste — it doesn't affect carb absorption speed.",
    citricSourceCitric: 'Citric acid',
    citricSourceLemon: 'Lemon',
    citricSourceLime: 'Lime',
    citricSourceLemonJuice: 'Lemon juice',
    citricSourceLimeJuice: 'Lime juice',
    citricFieldLemon: 'Fresh lemon',
    citricFieldLime: 'Fresh lime',
    citricFieldLemonJuice: 'Bottled lemon juice',
    citricFieldLimeJuice: 'Bottled lime juice',
    gelConcLabel: 'carbs',
    per100: 'g/100 ml',
    per100Ml: 'ml/100 ml',
    per100Fruit: '%/100 ml',
    mixIzo: 'Drink',
    mixGel: 'Gel',
    target: 'Target',
    mobileNotesTitle: 'Mobile rules',
    tCarbs: 'Total carbs',
    tTarget: 'Target',
    tGap: 'Difference',
    tKcal: 'Energy',
    tDrink: 'From drinks',
    tSolid: 'From food',
    tRefills: 'Refills',
    tPortions: 'Gel portions',
    tabPlan: 'Plan',
    tabGear: 'Gear',
    tabFood: 'Products',
    tabMe: 'Me',
    ok: 'Intake tracks the requirement evenly. Biggest dip: ',
    low2: 'Not enough carbs — add an item in the second half.',
    over: 'Above requirement — risk of stomach trouble.',
    dip: ' g below the curve around ',
    hydOk: 'Fluids cover the loss. Sip steadily.',
    hydLow: 'Plan a refill or an extra bottle.',
    gpx: 'GPX profile',
    gpxFile: 'track.gpx (demo)',
    gpxOn: 'On',
    gpxPick: 'Load',
    gpxBad: 'Could not read that GPX file.',
    shot: 'shot',
    sipped: 'sipped',
    water: 'Water',
    izo: 'Izo',
    gel: 'Gel',
    fill: 'Fill',
    refills: 'refills',
    addFill: '+ refill once empty',
    noRoom: 'no free gap',
    foodLane: 'Food / extras',
    foodLaneSub: 'may overlap',
    addFoodHint: 'pick from the list under the chart',
    portions: 'portions',
    malto: 'Maltodextrin',
    fructose: 'Fructose',
    salt: 'Salt',
    citric: 'Citric acid',
    waterFill: 'Water',
    carbsIn: 'Carbs',
    perPortion: 'Per portion',
    refillAt: 'refill at ',
    langName: 'English',
    langShort: 'EN',
    itemsSuffix: 'items',
    newVessel: 'New bottle',
    viewLabel: 'Display mode',
    viewAuto: 'Auto',
    autoDetected: 'auto-detected: ',
    themeToggleLabel: 'Toggle theme (auto/light/dark)',
    themeLabel: 'Theme',
    themeAuto: 'Auto',
    themeLight: 'Light',
    themeDark: 'Dark',
    viewModeConfirmTitle: 'Force this view?',
    viewModeConfirmBody:
      'The layout will stop adapting automatically to your device. You can change this again anytime from the same place.',
    viewModeConfirmCancel: 'Cancel',
    viewModeConfirmConfirm: 'Force',
    mixSection: 'Drink mix',
    editInSettings: 'mix settings',
    ratioCustom: 'custom',
    resetDefaults: 'Reset to defaults',
    foodSection: 'Food & extras',
    addFoodItem: 'Add product',
    newFood: 'New product',
    fName: 'product',
    fCarbs: 'carbs (g)',
    fMl: 'fluid (ml)',
    fCont: 'over time',
    fContHeader: 'release',
    foodSectionHint:
      'Your product list — these buttons show up under the chart. Enter carbs per serving (not the bar weight) and any fluid.',
    foodContHint:
      'Turning on "over time" spreads the product on the chart gradually over a few kilometers — you eat a banana right away, but you nibble gummies along the way.',
    mixHintPre: "Here you'll set the composition of your drink and gel — ",
    mixHintLink1: 'sugar ratio',
    mixHintMid1: ' (plain ',
    mixHintLink2: 'sugar or honey',
    mixHintMid2: ' work too), ',
    mixHintLink3: 'salt',
    mixHintMid3: ' and a ',
    mixHintLink4: 'flavor additive',
    mixHintPost: '. Values are per 100 ml, so per-fill grams in the plan are derived from this.',
    notes: [
      {
        title: 'A lane per bottle',
        body: 'Big bottle, small bottle, flask — each has its own lane, so gel cannot land in the izo bottle.',
      },
      {
        title: 'Refill once empty',
        body: 'Fills never overlap: a bar stops at its neighbour and + inserts a refill into a free gap.',
      },
      {
        title: 'Food apart',
        body: 'Banana and chews may overlap, a zero beer is one stop — hence their own lane.',
      },
      {
        title: 'Per-bottle recipe',
        body: 'The recipe card computes maltodextrin, fructose, salt and citric grams for every single fill.',
      },
    ],
    ftAboutBody:
      'Carb Fueling works out how many carbs and how much fluid to take on a ride — from distance, pace, weight, intensity and temperature — then spreads them across bottles, flasks and food over time. Your plan, gear and product list stay in this browser.',
    ftPrivacy:
      'No account, no server, no cookies. Anonymous, cookieless visit counts (GoatCounter) — no cross-site tracking.',
    ftLegal: 'Disclaimer',
    ftLegalBody:
      'This is an educational planning aid — not medical, dietary or coaching advice, and no substitute for a professional. All figures are estimates based on averaged models; your real requirement, gut tolerance, hydration status and response to effort may differ significantly. You use the app on your own responsibility and entirely at your own risk. The author accepts no liability for any health consequences, injury, damage, loss or decisions made on the basis of these results — and specifically takes no responsibility for your health or life. If you have a medical condition (including diabetes, kidney, heart or gastrointestinal disease), take medication, are pregnant, or are preparing for a long or very hard event, discuss your fuelling plan with a doctor or sports dietitian. Never ignore symptoms: if you feel dizzy, nauseous, disoriented, cramping, or suspect hyponatraemia, stop and seek help. The app is provided "as is", without warranty of any kind.',
    ftLinks: 'Contribute',
    ftFaq: 'FAQ',
    ftIssues: 'Ideas & bugs → GitHub Issues',
    ftRepo: 'Source code on GitHub',
    ftSupport: 'Buy me a coffee',
    ftSponsor: 'Sponsor',
    ftContact: 'Get in touch',
    ftSources2: 'Sweat loss: an estimate from weight, intensity and temperature.',
    ftCopyright: '© 2026 Carb Fueling · open source',
    tourWelcomeTitle: 'Welcome to Carb Fueling',
    tourWelcomeBody:
      'A few steps to show you how to plan carbs and fluids for your ride, and how to read the result. Takes about a minute.',
    tourRouteTitle: 'Route & result',
    tourRouteBody:
      "Describe your ride here — distance and pace, or a duration — plus conditions (intensity, temperature, pre-ride meal). The cards next to it show whether your plan covers your carb and fluid needs. You can also load your own GPX file — pace and requirement will then match your route's real profile (climbs and descents) instead of an averaged one.",
    tourRouteBodyMobile:
      'Edit your route with the button at the top of the screen — distance and pace, or a duration, plus conditions (intensity, temperature, pre-ride meal) and loading a GPX file. These cards show whether your plan covers your carb and fluid needs.',
    tourChartTitle: 'The chart: supply vs. requirement',
    tourChartBody:
      "The numbers on the left are the scale: grams of carbs per hour (g/h). The solid line is how many carbs you're actually delivering, the dashed line is how many you need. The dotted horizontal line is the absorption limit: the most your gut can absorb per hour no matter how much you eat — anything above it waits in the stomach. The bar above the chart is that stomach: it shows what it's currently digesting. We added a sample bottle so you can see how this looks in practice.",
    tourChartBodyMobile:
      "The solid line is how many carbs per hour you're actually delivering, the dashed line is how many you need. The dotted horizontal line is the absorption limit: the most your gut can absorb per hour no matter how much you eat — anything above it waits in the stomach. The top of the chart is that stomach: it shows what it's currently digesting. Drag your finger across the chart to read exact values at any point on the route. We added a sample bottle so you can see how this looks in practice.",
    tourFillTitle: 'A bottle: move it, resize it, change its contents',
    tourFillBody:
      'This bar is the bottle we just added. You can drag the middle to move it along the route, or either edge to shorten or lengthen the stretch you drink it over. Hovering it reveals buttons to switch its contents (water / izo / gel) if the bottle allows more than one. Try it once you close the tour.',
    tourFillBodyMobile:
      'This is the bottle we just added. Tap it to expand its editor — the "from" and "to" buttons move it along the route or change how long the segment is, and the buttons next to them switch its contents (water / izo / gel) if the bottle allows more than one.',
    tourAddFillTitle: 'Add another fill',
    tourAddFillBody:
      'This "+" button inserts another fill into the first free gap on the route — useful once a bottle runs dry and needs refilling with something else. The same idea applies to food: the product buttons under the chart add another item with one click.',
    tourAddFillBodyMobile:
      'This button inserts another fill into the first free gap on the route — useful once a bottle runs dry and needs refilling with something else. The same applies to food: the product buttons further down add another item with one tap.',
    tourAddShopTitle: 'Resupply points',
    tourAddShopBody:
      'This "+" adds a resupply marker on the chart (e.g. a shop) — drag it anywhere on the route to mark which kilometer you plan to buy more food or drink at.',
    tourAddShopBodyMobile:
      'This button opens a small form for a resupply point — enter the kilometer and a name (e.g. a shop) to mark where you plan to buy more food or drink.',
    tourClosingTitle: "That's the essentials",
    tourClosingBody:
      "Recipes for topping up the bottles and fills you've added are under the chart. Gear, Mix, Products and Settings (weight, view mode) are in the header. Replay this tour any time from the button in the footer. Want to know more? The FAQ is in the footer too.",
    tourClosingBodyMobile:
      'Recipes for topping up bottles are behind the "Bottle recipes" button on the plan list. Change settings and language in the "Me" tab, and mix ratios and available bottles in the "Mix" and "Gear" tabs. Replay this tour any time from the button in the "Me" tab. Want to know more? The FAQ is in the "Me" tab too.',
    tourNext: 'Next',
    tourBack: 'Back',
    tourSkip: 'Skip',
    tourFinish: 'Finish',
    tourStepLabel: 'Step',
    tourReplayButton: 'Replay tour',
    tourConfirmTitle: 'Replay the tour?',
    tourConfirmBody:
      "The tour will load sample data (a route and one bottle) over your current plan. This can't be undone.",
    tourConfirmCancel: 'Cancel',
    tourConfirmStart: 'Start tour',
    tabMix: 'Mix',
    editRoutePrefix: 'Edit route:',
    narrationRate:
      "How many carbs per hour you're actually absorbing (line) vs. requirement (dashed). Dotted is the absorption limit.",
    narrationFluid:
      "How much fluid you're drinking per hour (line) vs. how much you lose to sweat (dashed).",
    narrationProfile: 'Route profile — elevation above sea level. Climbs raise the requirement.',
    scrubHint: 'drag to read',
    legendGpx: 'target',
    chartHelpBtnLabel: 'Explain the chart',
    chartHelpTitle: 'How to read this chart',
    chartHelpFullTour: 'Show me the full tour',
    chartHelpScrubNote:
      'Drag your finger across the chart to see exact numbers at any point on the route.',
    chartHelpAxisNote: 'Exact values are shown by the numbers along the left and bottom axes.',
    chartHelpAbsorbedBody:
      "This slowly increases the amount of carbs available in your body. When planning the route, you try to keep this line as close as possible to what you need. The line's color changes depending on what you've eaten.",
    chartHelpNeedBody:
      'This is how many carbs the route demands from you in that hour — during the effort you should take in this many carbs.',
    chartHelpCapBody: 'The most your gut can absorb per hour, no matter how much you eat or drink.',
    chartHelpGutBody: 'What you eat or drink goes into your stomach, where it slowly digests.',
    chartHelpDeficitLabel: 'Deficit',
    chartHelpDeficitBody: "Here you're absorbing less than you need — risk of running low.",
    chartHelpFluidAbsorbedBody: "How much you're actually drinking in that hour.",
    chartHelpFluidCapBody:
      'Roughly how fast the stomach passes fluid on to the gut. Above it the line shifts from yellow to orange to red — rising risk of it backing up, not a hard cutoff.',
    chartHelpSweatBody: 'How much you lose through sweat — your fluid requirement.',
    foodSection2: 'Food',
    gearHintMobile:
      "What's on your bike. Volume and allowed contents decide how many carbs fit in one fill.",
    mixHintMobile:
      'Izo and gel composition. Changing it recalculates grams per fill and the absorption limit.',
    absCapNoteMobile: 'At this ratio the limit is {cap} g/h — the dotted line on the chart.',
    gelPartsStepper: 'Gel portions per fill',
    foodStepwise: 'over time',
    foodAddProduct: '+ Add product',
    meWeight: 'Weight',
    meApp: 'App',
    meLanguage: 'Language',
    meView: 'Display mode',
    mixSheetTitle: 'Bottle recipes',
    mixSheetSubtitle: 'Grams to measure out for each fill',
    mixSheetEmpty: 'No fills · —',
    mixRowSugar: 'Carbs',
    mixRowMalto: 'Maltodextrin',
    mixRowFructose: 'Fructose',
    mixRowSalt: 'Salt',
    mixRowCitric: 'Citric acid',
    mixRowWater: 'Water',
    routeSheetTitleCycling: 'CYCLING ROUTE & CONDITIONS',
    routeSheetTitleRunning: 'RUNNING ROUTE & CONDITIONS',
    routeSheetPreStart: 'BEFORE THE START',
    routeSheetIntensity: 'Intensity',
    routeSheetTemp: 'Temperature',
    routeSheetGpxSection: 'GPX PROFILE',
    routeSheetGpxNote:
      'An enabled profile changes the requirement on climbs. The eye icon above the chart shows the profile itself.',
    routeSheetLoadFile: 'Load file',
    routeSheetDone: 'Done',
    shopSheetTitle: 'LANDMARK',
    shopSheetKm: 'Kilometer',
    shopSheetName: 'Name',
    shopSheetAdd: 'Add',
    shopDefaultName: 'Shop',
    combineFillCheckbox: 'Prepare together',
    combineSectionTitle: 'Combined batch',
    combineSectionHint:
      'Pick the fills you prepare together (any bottle, any time) to see one combined batch instead of separate recipes.',
    combineBottles: 'Bottles',
    combineNote: 'Included in the combined batch above.',
    combineMixedLabel: 'Izo + gel',
    combinePourLabel: 'How much goes in each bottle',
    combineCrossTypeConfirmTitle: 'Combine izo and gel into one batch?',
    combineCrossTypeConfirmBody:
      "This combined batch takes its malto:fructose ratio, salt, and citric (amount and source) from your izo settings. Gel's own values stay saved but won't apply while combined — edit them under izo instead. Gel's concentration (g/100 ml) is still set independently.",
    combineCrossTypeConfirmCancel: 'Cancel',
    combineCrossTypeConfirmConfirm: 'Combine',
    gelLockedNote:
      "You have a combined batch — gel's ratio, salt, and citric are inherited from izo, edit them there.",
    unlockGelButton: 'Unlock',
    bidonComposition: 'BOTTLE RECIPES',
    perFillGrams: 'grams per fill ›',
    addLandmark: 'Add landmark',
    noGap: 'no free gap',
    noRoomHint: 'No room',
    rateInSegmentSuffix: ' g/h in this stretch',
    eatenOnceLabel: 'eaten once',
    carbCardTitle: 'Carbs',
    inPlanSuffix: '× in plan',
    planDataSection: 'Plan data',
    planDataHint:
      'Save your whole plan (route, gear, mix, products, shops) to a file, or load a backup on another device.',
    exportPlanButton: 'Download plan',
    importPlanButton: 'Load plan',
    importPlanConfirmTitle: 'Replace your current plan?',
    importPlanConfirmBody:
      "Importing will overwrite your current route, gear, mix, products and shops with the file's data. This can't be undone.",
    importPlanConfirmCancel: 'Cancel',
    importPlanConfirmConfirm: 'Import',
    importPlanError: "Could not read that file — check it's a valid Carb Fueling plan export.",
    importPlanSuccess: 'Plan imported.',
    exportPlanError: 'Could not save the file. Please try again.',
    clearPlanButton: 'Start over',
    printPlanButton: 'Print',
    printStripBottles: 'Bottles',
    printStripFood: 'Food',
    printStripStops: 'Stops',
    printCutHint: 'Cut out and tape to your top tube',
    clearPlanConfirmTitle: 'Start over?',
    clearPlanConfirmBody:
      "This removes fills, food and stops from your route. Your route, gear and mix stay as they are. This can't be undone.",
    clearPlanConfirmCancel: 'Cancel',
    clearPlanConfirmConfirm: 'Start over',
    recoveryLabel: 'Recovery',
    recoveryHint:
      'The amount of carbohydrates to eat after your ride to replenish muscle glycogen.',
    carbRateHint:
      "The bar's colour tracks your realised delivery rate (g/h) against what this specific ride actually needs — not the percentage above it. It turns green once you're delivering what the ride needs; if that need is above roughly 40 g/h, reaching 40 g/h is enough, since more carbs past that point barely help. Under 1h of riding/running the bar turns grey, because carbs barely matter over that short a time anyway. Maroon means the planned rate is past what your gut can actually absorb — the excess sits in your stomach and pulls in water, which is what causes nausea or bloating from overeating.",
    waterBalanceHint:
      'A minus is a shortfall against your sweat loss, a plus is drinking past it. The tolerable shortfall shrinks as it gets hotter; a surplus risks hyponatraemia.',
    waterBalanceHintLink: 'How to read this →',
    waterBalanceAria: 'What the fluid balance means',
    waterBalanceLabel: 'Fluid balance as % of body mass',
  },
  de: {
    tagline: 'Kohlenhydrat- und Flüssigkeitsplaner',
    desktop: 'Desktop',
    mobile: 'Telefon',
    routeCycling: 'Radstrecke',
    routeRunning: 'Laufstrecke',
    byRoute: 'Distanz + Tempo',
    byTime: 'Zeit',
    distance: 'Distanz',
    speed: 'Ø Geschwindigkeit',
    sportCycling: 'Rad',
    sportRunning: 'Lauf',
    pace: 'Tempo (min/km)',
    hours: 'Stunden',
    minutes: 'Minuten',
    duration: 'Dauer',
    weight: 'Gewicht',
    preMealCarbs: 'Kohlenhydrate vor dem Start',
    preMealMinutes: 'Zeit vor dem Start',
    intensity: 'Intensität',
    intensityHint:
      'Niedrig = du kannst dich entspannt in ganzen Sätzen unterhalten. Mittel = du redest noch, aber in kurzen Sätzen. Hoch = du kannst kaum sprechen, konzentriert auf die Atmung. Davon hängt ab, wie viele Kohlenhydrate pro Stunde die App einplant — und bei Hoch sinkt zusätzlich, wie viel dein Darm tatsächlich aufnehmen kann.',
    intensityInfoBtnLabel: 'Intensität erklären',
    low: 'Niedrig',
    medium: 'Mittel',
    high: 'Hoch',
    temp: 'Temperatur',
    carbsPerHour: 'Bedarf',
    gear: 'Meine Ausrüstung',
    settings: 'Einstellungen',
    profile: 'Profil',
    addGear: 'Flasche hinzufügen',
    savedLocally: 'Lokal gespeichert',
    canCarry: 'Kann enthalten:',
    gelPartsLabel: 'Portionen',
    gearHint:
      'Name, Fassungsvermögen und Inhalt dieser Flasche. Gel wird in so viele Portionen aufgeteilt, wie du hier festlegst.',
    settingsHint:
      'Alles wird in diesem Browser gespeichert (localStorage) — kein Konto, kein Backend.',
    curve: 'Planung',
    gutHint:
      'Das ist dein Magen: Der obere Streifen zeigt, was gerade drin liegt und wie schnell es verdaut wird, bis zur Kapazitätsgrenze.',
    curveHint:
      'Die dicke durchgezogene Linie zeigt, wie schnell du tatsächlich Kohlenhydrate aufnimmst — rostrote Flächen sind Stunden, in denen du weniger aufnimmst, als du brauchst.',
    absorbed: 'Aufgenommen',
    gutLane: 'Im Magen',
    need: 'Bedarf',
    timeline: 'Zeitplan',
    axisTime: 'Stunden',
    gutOver: 'Zu viel auf einmal — ',
    gutAt: ' g liegen im Magen gegen ',
    dry: 'Versorgungslücke: ',
    dryAt: ' ohne Kohlenhydrate, gegen ',
    carbMode: 'Kohlenhydrate (g/h)',
    fluidMode: 'Flüssigkeit (ml/h)',
    tDry: 'Längste Lücke',
    legFluid: 'Flüssigkeit',
    legSweat: 'Schweiß',
    legCap: 'Aufnahmeobergrenze',
    capNote: 'Aufnahmeobergrenze: ',
    capNote2:
      ' — so viel nimmt dein Darm maximal pro Stunde auf, egal wie viel du isst; der Überschuss verschwindet nicht, sondern wartet im Magen. Sie steigt, wenn du Glukose und Fruktose mischst, da sie über getrennte Wege aufgenommen werden (Glukose ca. 60 g/h, Fruktose legt ca. 30 g/h obendrauf) — deshalb wird sie aus deinem Verhältnis Maltodextrin:Fruktose berechnet (Jeukendrup, Übersichtsarbeiten 2010–2014).',
    capNoteFluid:
      'Aufnahmeobergrenze: ca. 900 ml/h — so schnell gibt der Magen unter Belastung im Schnitt Flüssigkeit an den Darm weiter (gestrichelte Linie); real schwankt das je nach Intensität und Darmtraining um einige hundert ml. Oberhalb dieses Tempos wird die Linie zunehmend gelb, dann orange und rot — ein Signal für steigendes Risiko, kein harter Grenzwert. In die Flüssigkeitssumme zählt trotzdem nur, was der Magen bis zum Ende der Strecke tatsächlich weitergeben konnte.',
    tAbsorbed: 'Aufgenommen',
    tCap: 'Aufnahmeobergrenze',
    tGutPeak: 'Max. im Magen',
    timelineHint:
      'Nur zur Ansicht — Position, Bereich und Inhalt jeder Nachfüllung stellst du oben im Diagramm ein.',
    dragHint:
      'Balken überlappen nie — ein gezogener Balken verkürzt sich, wenn die Lücke eng wird. Gel-Portionsmarken lassen sich einzeln verschieben.',
    addFuel: 'Essen hinzufügen:',
    removeItem: 'Entfernen',
    addShopStop: 'Stopp hinzufügen',
    addFillTo: 'Füllung hinzufügen zu ',
    emptyLaneHint: 'Klick auf +, um eine Füllung hinzuzufügen',
    coverage: 'Bedarfsdeckung',
    summary: 'Zusammenfassung',
    hydration: 'Flüssigkeitszufuhr',
    sweatLoss: 'Verlust',
    planned: 'Geplant',
    needSum: 'Bedarf',
    recipes: 'Flaschenrezepte',
    recipesHint: 'Gramm zum Abmessen für jede Füllung — pro Flasche, Flask oder Glas.',
    ratio: 'Maltodextrin : Fruktose',
    mixRatioHint:
      'Maltodextrin und Fruktose werden über zwei getrennte Wege im Darm aufgenommen — kombiniert nimmt dein Körper dadurch mehr Kohlenhydrate pro Stunde auf als mit Maltodextrin allein. Das Standardverhältnis ist 2:1, aber normaler Zucker (natürlich etwa 1:1 Glukose zu Fruktose) oder Honig (etwa 0,8:1) erzielen einen ähnlichen Effekt — sie sind fertige, natürliche Entsprechungen derselben Mischung. Bei einem gut trainierten Darm funktioniert auch ein Verhältnis von 1,2:1 gut.',
    mixSugarBlendHeader: 'Zuckermischung — Verhältnis Maltodextrin zu Fruktose',
    mixSugarAmountIzo: 'Wie viel Zucker (insgesamt) im Getränk sein soll',
    mixSugarAmountGel: 'Wie viel Zucker (insgesamt) im Gel sein soll',
    mixSaltAmount: 'Mineralsalz-Ausgleich: Salz',
    ratioLabelSugar: 'Zucker',
    ratioLabelHoney: 'Honig',
    concLabel: 'Kohlenhydrate',
    saltLabel: 'Salz',
    citricLabel: 'Zitronensäure',
    citricSourceLabel: 'Säure',
    mixFlavorHeader: 'Geschmackszusatz zur Reduzierung der Süße',
    mixCitricHint:
      'Zitronensäure ist reine Geschmackssache — sie beeinflusst nicht die Aufnahmegeschwindigkeit der Kohlenhydrate.',
    citricSourceCitric: 'Zitronensäure',
    citricSourceLemon: 'Zitrone',
    citricSourceLime: 'Limette',
    citricSourceLemonJuice: 'Zitronensaft',
    citricSourceLimeJuice: 'Limettensaft',
    citricFieldLemon: 'Frische Zitrone',
    citricFieldLime: 'Frische Limette',
    citricFieldLemonJuice: 'Zitronensaft (Flasche)',
    citricFieldLimeJuice: 'Limettensaft (Flasche)',
    gelConcLabel: 'Kohlenhydrate',
    per100: 'g/100 ml',
    per100Ml: 'ml/100 ml',
    per100Fruit: '%/100 ml',
    mixIzo: 'Getränk',
    mixGel: 'Gel',
    target: 'Ziel',
    mobileNotesTitle: 'Mobile Regeln',
    tCarbs: 'Kohlenhydrate gesamt',
    tTarget: 'Ziel',
    tGap: 'Differenz',
    tKcal: 'Energie',
    tDrink: 'Aus Getränken',
    tSolid: 'Aus Nahrung',
    tRefills: 'Nachfüllungen',
    tPortions: 'Gel-Portionen',
    tabPlan: 'Plan',
    tabGear: 'Ausrüstung',
    tabFood: 'Produkte',
    tabMe: 'Ich',
    ok: 'Die Zufuhr folgt dem Bedarf gleichmäßig. Größter Einbruch: ',
    low2: 'Zu wenig Kohlenhydrate — füge im zweiten Streckenteil ein Element hinzu.',
    over: 'Über dem Bedarf — Risiko für Magenprobleme.',
    dip: ' g unter der Kurve bei ca. ',
    hydOk: 'Die Flüssigkeitszufuhr deckt den Verlust. Gleichmäßig trinken.',
    hydLow: 'Plane eine Nachfüllung oder eine zusätzliche Flasche.',
    gpx: 'GPX-Profil',
    gpxFile: 'track.gpx (demo)',
    gpxOn: 'An',
    gpxPick: 'Laden',
    gpxBad: 'Die GPX-Datei konnte nicht gelesen werden.',
    shot: 'Shot',
    sipped: 'schluckweise',
    water: 'Wasser',
    izo: 'Izo',
    gel: 'Gel',
    fill: 'Füllung',
    refills: 'Nachfüllungen',
    addFill: '+ auffüllen, wenn leer',
    noRoom: 'keine freie Lücke',
    foodLane: 'Nahrung / Extras',
    foodLaneSub: 'können sich überschneiden',
    addFoodHint: 'aus der Liste unter dem Diagramm wählen',
    portions: 'Portionen',
    malto: 'Maltodextrin',
    fructose: 'Fruktose',
    salt: 'Salz',
    citric: 'Zitronensäure',
    waterFill: 'Wasser',
    carbsIn: 'Kohlenhydrate',
    perPortion: 'Pro Portion',
    refillAt: 'Nachfüllung bei ',
    langName: 'Deutsch',
    langShort: 'DE',
    itemsSuffix: 'Elemente',
    newVessel: 'Neue Flasche',
    viewLabel: 'Anzeigemodus',
    viewAuto: 'Auto',
    autoDetected: 'automatisch erkannt: ',
    themeToggleLabel: 'Design umschalten (auto/hell/dunkel)',
    themeLabel: 'Design',
    themeAuto: 'Auto',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    viewModeConfirmTitle: 'Diese Ansicht erzwingen?',
    viewModeConfirmBody:
      'Das Layout passt sich nicht mehr automatisch an dein Gerät an. Du kannst das jederzeit an derselben Stelle wieder ändern.',
    viewModeConfirmCancel: 'Abbrechen',
    viewModeConfirmConfirm: 'Erzwingen',
    mixSection: 'Getränkemischung',
    editInSettings: 'Mischungseinstellungen',
    ratioCustom: 'benutzerdefiniert',
    resetDefaults: 'Auf Standard zurücksetzen',
    foodSection: 'Nahrung & Extras',
    addFoodItem: 'Produkt hinzufügen',
    newFood: 'Neues Produkt',
    fName: 'Produkt',
    fCarbs: 'Kohlenhydrate (g)',
    fMl: 'Flüssigkeit (ml)',
    fCont: 'verteilt',
    fContHeader: 'Freisetzung',
    foodSectionHint:
      'Deine Produktliste — diese Buttons erscheinen unter dem Diagramm. Gib nur die Kohlenhydrate pro Portion an (nicht das Gewicht des Riegels) und eventuelle Flüssigkeit.',
    foodContHint:
      'Wenn du „verteilt“ aktivierst, erscheint das Produkt langsam im Diagramm, verteilt über mehrere Kilometer — eine Banane isst du sofort, Gummibärchen knabberst du dagegen unterwegs.',
    mixHintPre: 'Hier legst du fest, woraus dein Getränk und Gel bestehen — ',
    mixHintLink1: 'Zuckerverhältnis',
    mixHintMid1: ' (auch normaler ',
    mixHintLink2: 'Zucker oder Honig',
    mixHintMid2: ' funktioniert), ',
    mixHintLink3: 'Salz',
    mixHintMid3: ' und ein ',
    mixHintLink4: 'Geschmackszusatz',
    mixHintPost:
      '. Die Werte gibst du pro 100 ml an, daraus werden die Gramm für jede Füllung im Plan berechnet.',
    notes: [
      {
        title: 'Eine Spur pro Flasche',
        body: 'Große Flasche, kleine Flasche, Flask — jede hat ihre eigene Spur, Gel kann also nicht in der Izo-Flasche landen.',
      },
      {
        title: 'Nachfüllen, sobald leer',
        body: 'Füllungen überlappen sich nie: Ein Balken endet an seinem Nachbarn, und + fügt eine Nachfüllung in eine freie Lücke ein.',
      },
      {
        title: 'Essen getrennt',
        body: 'Banane und Gummibärchen dürfen sich überlappen, ein alkoholfreies Bier nimmst du einmalig an der Station — deshalb haben sie ihre eigene Spur.',
      },
      {
        title: 'Rezept pro Flasche',
        body: 'Die Karte „Flaschenrezepte“ berechnet Gramm für Maltodextrin, Fruktose, Salz und Säure für jede einzelne Füllung.',
      },
    ],
    ftAboutBody:
      'Carb Fueling berechnet, wie viele Kohlenhydrate und wie viel Flüssigkeit du auf die Strecke mitnimmst — aus Distanz, Tempo, Gewicht, Intensität und Temperatur — und verteilt sie dann zeitlich auf Flaschen, Flasks und Essen. Dein Plan, deine Ausrüstung und deine Produktliste bleiben in diesem Browser gespeichert.',
    ftSources2: 'Schweißverlust: eine Schätzung aus Gewicht, Intensität und Temperatur.',
    ftPrivacy:
      'Kein Konto, kein Server, keine Cookies. Anonyme, cookiefreie Besucherzählung (GoatCounter) — kein seitenübergreifendes Tracking.',
    ftLegal: 'Haftungsausschluss',
    ftLegalBody:
      'Dies ist ein Hilfsmittel für Aufklärung und Planung — keine medizinische, ernährungswissenschaftliche oder trainingsbezogene Beratung und kein Ersatz für eine Fachperson. Alle Werte sind Schätzungen auf Basis gemittelter Modelle; dein tatsächlicher Bedarf, deine Magen-Darm-Toleranz, dein Hydratationsstatus und deine Reaktion auf Belastung können davon erheblich abweichen. Du nutzt die App in eigener Verantwortung und ausschließlich auf eigenes Risiko. Der Autor übernimmt keine Haftung für gesundheitliche Folgen, Verletzungen, Schäden, Verluste oder Entscheidungen, die auf Grundlage dieser Ergebnisse getroffen werden — insbesondere übernimmt er keine Verantwortung für deine Gesundheit oder dein Leben. Wenn du eine Erkrankung hast (u. a. Diabetes, Nieren-, Herz- oder Magen-Darm-Erkrankungen), Medikamente einnimmst, schwanger bist oder dich auf einen langen oder sehr intensiven Wettkampf vorbereitest, besprich deinen Ernährungsplan mit ärztlichem Fachpersonal oder einer Sporternährungsberatung. Ignoriere keine Symptome: Bei Schwindel, Übelkeit, Verwirrtheit, Krämpfen oder Verdacht auf Hyponatriämie brich die Belastung ab und hol dir Hilfe. Die App wird „wie besehen“ bereitgestellt, ohne jegliche Gewährleistung.',
    ftLinks: 'Mitwirken',
    ftFaq: 'FAQ',
    ftIssues: 'Ideen & Fehler → GitHub Issues',
    ftRepo: 'Quellcode auf GitHub',
    ftSupport: 'Spendier mir einen Kaffee',
    ftSponsor: 'Unterstützen',
    ftContact: 'Kontakt aufnehmen',
    ftCopyright: '© 2026 Carb Fueling · Open Source',
    tourWelcomeTitle: 'Willkommen bei Carb Fueling',
    tourWelcomeBody:
      'In ein paar Schritten zeigen wir dir, wie du Kohlenhydrate und Flüssigkeit für deine Strecke planst und wie du das Ergebnis liest. Dauert etwa eine Minute.',
    tourRouteTitle: 'Strecke & Ergebnis',
    tourRouteBody:
      'Hier beschreibst du deine Fahrt — Distanz und Tempo oder eine Dauer — sowie die Bedingungen (Intensität, Temperatur, Mahlzeit vor dem Start). Die Karten daneben zeigen, ob dein Plan deinen Kohlenhydrat- und Flüssigkeitsbedarf deckt. Du kannst auch eine eigene GPX-Datei laden — dann passen sich Tempo und Bedarf an das echte Profil deiner Strecke an (Anstiege und Abfahrten) statt an einen Durchschnittswert.',
    tourRouteBodyMobile:
      'Die Strecke bearbeitest du über den Button oben am Bildschirm — Distanz und Tempo oder eine Dauer, plus Bedingungen (Intensität, Temperatur, Mahlzeit vor dem Start) und das Laden einer GPX-Datei. Diese Karten zeigen, ob dein Plan deinen Kohlenhydrat- und Flüssigkeitsbedarf deckt.',
    tourChartTitle: 'Das Diagramm: Zufuhr gegen Bedarf',
    tourChartBody:
      'Die Zahlen links sind die Skala: Gramm Kohlenhydrate pro Stunde (g/h). Die durchgezogene Linie zeigt, wie viel du tatsächlich lieferst, die gestrichelte, wie viel du brauchst. Die gepunktete waagerechte Linie ist das Aufnahmelimit: So viel nimmt dein Darm pro Stunde maximal auf, egal wie viel du isst — der Rest wartet im Magen. Der Balken über dem Diagramm ist genau dieser Magen: Er zeigt, was gerade verdaut wird. Wir haben eine Beispielflasche hinzugefügt, damit du siehst, wie das in der Praxis aussieht.',
    tourChartBodyMobile:
      'Die durchgezogene Linie zeigt, wie viele Kohlenhydrate pro Stunde du tatsächlich lieferst, die gestrichelte, wie viel du brauchst. Die gepunktete waagerechte Linie ist das Aufnahmelimit: So viel nimmt dein Darm pro Stunde maximal auf, egal wie viel du isst — der Rest wartet im Magen. Der obere Teil des Diagramms ist genau dieser Magen: Er zeigt, was gerade verdaut wird. Fahre mit dem Finger über das Diagramm, um genaue Werte an jeder Stelle der Strecke abzulesen. Wir haben eine Beispielflasche hinzugefügt, damit du siehst, wie das in der Praxis aussieht.',
    tourFillTitle: 'Eine Flasche: verschieben, anpassen, Inhalt ändern',
    tourFillBody:
      'Dieser Balken ist die Flasche, die wir gerade hinzugefügt haben. Du kannst die Mitte greifen und entlang der Strecke verschieben, oder den linken oder rechten Rand, um den Abschnitt, auf dem du daraus trinkst, zu verkürzen oder zu verlängern. Beim Darüberfahren mit der Maus erscheinen Buttons zum Wechseln des Inhalts (Wasser / Izo / Gel), falls die Flasche mehr als eine Sorte zulässt. Probier das nach dem Schließen der Tour aus.',
    tourFillBodyMobile:
      'Das ist die Flasche, die wir gerade hinzugefügt haben. Tippe darauf, um die Bearbeitung zu öffnen — mit den Buttons „von“ und „bis“ verschiebst du sie entlang der Strecke oder änderst die Länge des Abschnitts, und die Buttons daneben wechseln den Inhalt (Wasser / Izo / Gel), falls die Flasche mehr als eine Sorte zulässt.',
    tourAddFillTitle: 'Weitere Füllung hinzufügen',
    tourAddFillBody:
      'Dieser „+“-Button fügt eine weitere Füllung in die erste freie Lücke auf der Strecke ein — praktisch, wenn eine Flasche leer wird und mit etwas anderem befüllt werden muss. Dasselbe gilt für Essen: Die Produkt-Buttons unter dem Diagramm fügen mit einem Klick eine weitere Position hinzu.',
    tourAddFillBodyMobile:
      'Dieser Button fügt eine weitere Füllung in die erste freie Lücke auf der Strecke ein — praktisch, wenn eine Flasche leer wird und mit etwas anderem befüllt werden muss. Dasselbe gilt für Essen: Die Produkt-Buttons weiter unten fügen mit einem Tipp eine weitere Position hinzu.',
    tourAddShopTitle: 'Versorgungspunkte',
    tourAddShopBody:
      'Dieser „+“ fügt im Diagramm eine Markierung für einen Versorgungspunkt hinzu (z. B. einen Laden) — du kannst sie an eine beliebige Stelle der Strecke ziehen, um zu markieren, bei welchem Kilometer du zusätzliches Essen oder Trinken einplanst.',
    tourAddShopBodyMobile:
      'Dieser Button öffnet ein kleines Formular für einen Versorgungspunkt — du gibst den Kilometer und einen Namen ein (z. B. einen Laden), um zu markieren, wo du zusätzliches Essen oder Trinken einplanst.',
    tourClosingTitle: 'Das ist erstmal alles',
    tourClosingBody:
      'Rezepte zum Nachfüllen deiner Flaschen und Füllungen findest du unter dem Diagramm. Ausrüstung, Mischung, Produkte und Einstellungen (Gewicht, Anzeigemodus) findest du im Header. Diese Tour kannst du jederzeit über den Button in der Fußzeile erneut starten. Willst du mehr wissen? Die FAQ findest du auch dort.',
    tourClosingBodyMobile:
      'Rezepte zum Nachfüllen von Flaschen findest du hinter dem Button „Flaschenrezepte“ in der Planliste. Einstellungen und Sprache änderst du im Tab „Ich“, Mischungsverhältnisse und verfügbare Flaschen in den Tabs „Mischung“ und „Ausrüstung“. Diese Tour kannst du jederzeit über den Button im Tab „Ich“ erneut starten. Willst du mehr wissen? Die FAQ findest du auch im Tab „Ich“.',
    tourNext: 'Weiter',
    tourBack: 'Zurück',
    tourSkip: 'Überspringen',
    tourFinish: 'Fertig',
    tourStepLabel: 'Schritt',
    tourReplayButton: 'Tour erneut zeigen',
    tourConfirmTitle: 'Tour erneut starten?',
    tourConfirmBody:
      'Die Tour lädt Beispieldaten (eine Strecke und eine Flasche) anstelle deines aktuellen Plans. Das kann nicht rückgängig gemacht werden.',
    tourConfirmCancel: 'Abbrechen',
    tourConfirmStart: 'Tour starten',
    tabMix: 'Mix',
    editRoutePrefix: 'Strecke bearbeiten:',
    narrationRate:
      'Wie viele Kohlenhydrate du pro Stunde tatsächlich aufnimmst (Linie) im Vergleich zum Bedarf (gestrichelt). Gepunktet ist die Aufnahmeobergrenze.',
    narrationFluid:
      'Wie viel Flüssigkeit du pro Stunde trinkst (Linie) im Vergleich zum Schweißverlust (gestrichelt).',
    narrationProfile: 'Streckenprofil — Höhe über dem Meeresspiegel. Anstiege erhöhen den Bedarf.',
    scrubHint: 'Ziehen zum Ablesen',
    legendGpx: 'Ziel',
    chartHelpBtnLabel: 'Diagramm erklären',
    chartHelpTitle: 'So liest du dieses Diagramm',
    chartHelpFullTour: 'Zeig mir die ganze Tour',
    chartHelpScrubNote:
      'Ziehe mit dem Finger über das Diagramm, um genaue Werte an jedem Punkt der Strecke zu sehen.',
    chartHelpAxisNote: 'Genaue Werte zeigen die Zahlen an der linken und unteren Achse.',
    chartHelpAbsorbedBody:
      'Das erhöht langsam die Menge an Kohlenhydraten, die deinem Körper zur Verfügung steht. Beim Planen der Strecke versuchst du, diese Linie so nah wie möglich am Bedarf zu halten. Die Farbe der Linie ändert sich je nachdem, was du gegessen hast.',
    chartHelpNeedBody:
      'So viele Kohlenhydrate verlangt die Strecke in dieser Stunde von dir — während der Belastung solltest du genau diese Menge aufnehmen.',
    chartHelpCapBody:
      'Das Maximum, das dein Darm pro Stunde aufnehmen kann, egal wie viel du isst oder trinkst.',
    chartHelpGutBody:
      'Was du isst oder trinkst, gelangt in deinen Magen und wird dort langsam verdaut.',
    chartHelpDeficitLabel: 'Defizit',
    chartHelpDeficitBody: 'Hier nimmst du weniger auf, als du brauchst — Risiko eines Einbruchs.',
    chartHelpFluidAbsorbedBody: 'Wie viel du in dieser Stunde tatsächlich trinkst.',
    chartHelpFluidCapBody:
      'Ungefähr, wie schnell der Magen Flüssigkeit an den Darm weitergibt. Darüber wechselt die Linie von Gelb über Orange zu Rot — steigendes Risiko eines Rückstaus, keine harte Grenze.',
    chartHelpSweatBody: 'Wie viel du über Schweiß verlierst — dein Flüssigkeitsbedarf.',
    foodSection2: 'Essen',
    gearHintMobile:
      'Was an deinem Rad montiert ist. Volumen und erlaubter Inhalt bestimmen, wie viele Kohlenhydrate in eine Füllung passen.',
    mixHintMobile:
      'Zusammensetzung von Izo und Gel. Änderungen berechnen die Gramm pro Füllung und die Aufnahmeobergrenze neu.',
    absCapNoteMobile:
      'Bei diesem Verhältnis liegt die Grenze bei {cap} g/h — die gepunktete Linie im Diagramm.',
    gelPartsStepper: 'Gel-Portionen pro Füllung',
    foodStepwise: 'über Zeit',
    foodAddProduct: '+ Produkt hinzufügen',
    meWeight: 'Gewicht',
    meApp: 'App',
    meLanguage: 'Sprache',
    meView: 'Anzeigemodus',
    mixSheetTitle: 'Flaschenrezepte',
    mixSheetSubtitle: 'Gramm zum Abmessen für jede Füllung',
    mixSheetEmpty: 'Keine Füllungen · —',
    mixRowSugar: 'Kohlenhydrate',
    mixRowMalto: 'Maltodextrin',
    mixRowFructose: 'Fruktose',
    mixRowSalt: 'Salz',
    mixRowCitric: 'Zitronensäure',
    mixRowWater: 'Wasser',
    routeSheetTitleCycling: 'RADSTRECKE & BEDINGUNGEN',
    routeSheetTitleRunning: 'LAUFSTRECKE & BEDINGUNGEN',
    routeSheetPreStart: 'VOR DEM START',
    routeSheetIntensity: 'Intensität',
    routeSheetTemp: 'Temperatur',
    routeSheetGpxSection: 'GPX-PROFIL',
    routeSheetGpxNote:
      'Ein aktiviertes Profil verändert den Bedarf an Anstiegen. Das Augensymbol über dem Diagramm zeigt das Profil selbst.',
    routeSheetLoadFile: 'Datei laden',
    routeSheetDone: 'Fertig',
    shopSheetTitle: 'ORIENTIERUNGSPUNKT',
    shopSheetKm: 'Kilometer',
    shopSheetName: 'Name',
    shopSheetAdd: 'Hinzufügen',
    shopDefaultName: 'Laden',
    combineFillCheckbox: 'Zusammen vorbereiten',
    combineSectionTitle: 'Gemeinsame Portion',
    combineSectionHint:
      'Wähle die Füllungen aus, die du zusammen vorbereitest (beliebige Flasche, beliebiger Zeitpunkt), um eine gemeinsame Portion statt einzelner Rezepte zu sehen.',
    combineBottles: 'Flaschen',
    combineNote: 'In der gemeinsamen Portion oben enthalten.',
    combineMixedLabel: 'Izo + Gel',
    combinePourLabel: 'Wie viel kommt in welche Flasche',
    combineCrossTypeConfirmTitle: 'Izo und Gel zu einer Portion zusammenfassen?',
    combineCrossTypeConfirmBody:
      'Diese gemeinsame Portion übernimmt das Malto:Fruktose-Verhältnis, das Salz und den Zitronensäure-Anteil (Menge und Quelle) aus deinen Izo-Einstellungen. Die eigenen Gel-Werte bleiben gespeichert, gelten aber nicht, solange kombiniert ist — bearbeite sie stattdessen unter Izo. Die Gel-Konzentration (g/100 ml) wird weiterhin separat eingestellt.',
    combineCrossTypeConfirmCancel: 'Abbrechen',
    gelLockedNote:
      'Du hast eine gemeinsame Portion — Verhältnis, Salz und Zitronensäure des Gels werden von Izo übernommen, bearbeite sie dort.',
    unlockGelButton: 'Entsperren',
    combineCrossTypeConfirmConfirm: 'Zusammenfassen',
    bidonComposition: 'FLASCHENREZEPTE',
    perFillGrams: 'Gramm pro Füllung ›',
    addLandmark: 'Orientierungspunkt hinzufügen',
    noGap: 'keine freie Lücke',
    noRoomHint: 'Kein Platz',
    rateInSegmentSuffix: ' g/h in diesem Abschnitt',
    eatenOnceLabel: 'einmalig gegessen',
    carbCardTitle: 'Kohlenhydrate',
    inPlanSuffix: '× im Plan',
    planDataSection: 'Plandaten',
    planDataHint:
      'Speichere deinen gesamten Plan (Strecke, Ausrüstung, Mix, Produkte, Läden) in einer Datei oder lade eine Sicherung auf einem anderen Gerät.',
    exportPlanButton: 'Plan herunterladen',
    importPlanButton: 'Plan laden',
    importPlanConfirmTitle: 'Aktuellen Plan ersetzen?',
    importPlanConfirmBody:
      'Der Import überschreibt deine aktuelle Strecke, Ausrüstung, Mix, Produkte und Läden mit den Daten aus der Datei. Das kann nicht rückgängig gemacht werden.',
    importPlanConfirmCancel: 'Abbrechen',
    importPlanConfirmConfirm: 'Importieren',
    importPlanError:
      'Datei konnte nicht gelesen werden — prüfe, ob es sich um einen gültigen Carb-Fueling-Planexport handelt.',
    importPlanSuccess: 'Plan importiert.',
    exportPlanError: 'Datei konnte nicht gespeichert werden. Bitte versuche es erneut.',
    clearPlanButton: 'Neu starten',
    printPlanButton: 'Drucken',
    printStripBottles: 'Flaschen',
    printStripFood: 'Essen',
    printStripStops: 'Stopps',
    printCutHint: 'Ausschneiden und ans Oberrohr kleben',
    clearPlanConfirmTitle: 'Neu starten?',
    clearPlanConfirmBody:
      'Das entfernt Füllungen, Essen und Stopps von deiner Strecke. Strecke, Ausrüstung und Mix bleiben unverändert. Das kann nicht rückgängig gemacht werden.',
    clearPlanConfirmCancel: 'Abbrechen',
    clearPlanConfirmConfirm: 'Neu starten',
    recoveryLabel: 'Regeneration',
    recoveryHint:
      'Die Menge an Kohlenhydraten, die du nach der Fahrt essen solltest, um die Glykogenspeicher der Muskeln aufzufüllen.',
    carbRateHint:
      'Die Farbe des Balkens zeigt deine tatsächliche Zufuhrrate (g/h) im Vergleich zu dem, was diese Strecke wirklich braucht — nicht den Prozentsatz darüber. Er wird grün, sobald du lieferst, was die Strecke braucht; liegt der Bedarf über etwa 40 g/h, reicht es, 40 g/h zu erreichen, da mehr Kohlenhydrate darüber hinaus kaum noch helfen. Unter 1h Fahr- oder Laufzeit wird der Balken grau, weil Kohlenhydrate über so kurze Zeit ohnehin kaum eine Rolle spielen. Dunkelrot bedeutet, dass die geplante Rate über dem liegt, was dein Darm tatsächlich aufnehmen kann — der Überschuss bleibt im Magen und zieht Wasser, was bei Überessen zu Übelkeit oder Blähungen führt.',
    waterBalanceHint:
      'Ein Minus ist ein Defizit gegenüber deinem Schweißverlust, ein Plus bedeutet, dass du mehr trinkst, als du verlierst. Das tolerierbare Defizit sinkt mit steigender Temperatur; ein Überschuss birgt das Risiko einer Hyponatriämie.',
    waterBalanceHintLink: 'So liest du das →',
    waterBalanceAria: 'Was die Flüssigkeitsbilanz bedeutet',
    waterBalanceLabel: 'Flüssigkeitsbilanz in % der Körpermasse',
  },
  it: {
    tagline: 'pianificatore di carboidrati e idratazione',
    desktop: 'Computer',
    mobile: 'Telefono',
    routeCycling: 'Percorso in bici',
    routeRunning: 'Percorso di corsa',
    byRoute: 'Distanza + ritmo',
    byTime: 'Tempo',
    distance: 'Distanza',
    speed: 'Velocità media',
    sportCycling: 'Bici',
    sportRunning: 'Corsa',
    pace: 'Ritmo (min/km)',
    hours: 'Ore',
    minutes: 'Minuti',
    duration: 'Durata',
    weight: 'Peso',
    preMealCarbs: 'Carboidrati prima della partenza',
    preMealMinutes: 'Tempo prima della partenza',
    intensity: 'Intensità',
    intensityHint:
      "Bassa = riesci a parlare comodamente con frasi complete. Media = parli ancora, ma con frasi brevi. Alta = riesci a malapena a parlare, concentrato sul respiro. Da questo dipende quanti carboidrati all'ora pianifica l'app — e ad Alta, riduce anche quanto il tuo intestino riesce davvero ad assorbire.",
    intensityInfoBtnLabel: 'Spiega intensità',
    low: 'Bassa',
    medium: 'Media',
    high: 'Alta',
    temp: 'Temperatura',
    carbsPerHour: 'Fabbisogno',
    gear: 'La mia attrezzatura',
    settings: 'Impostazioni',
    profile: 'Profilo',
    addGear: 'Aggiungi borraccia',
    savedLocally: 'Salvato localmente',
    canCarry: 'Può contenere:',
    gelPartsLabel: 'porzioni',
    gearHint:
      'Nome, capacità e cosa può contenere questa borraccia. Il gel si divide in tante porzioni quante ne imposti qui.',
    settingsHint:
      'Tutto viene salvato in questo browser (localStorage) — nessun account, nessun server.',
    curve: 'Pianificazione',
    gutHint:
      'Questo è il tuo stomaco: la fascia in alto mostra cosa contiene e quanto velocemente viene digerito, fino al limite di capacità.',
    curveHint:
      'La linea continua e spessa è il ritmo a cui assorbi davvero i carboidrati — le aree color ruggine sono le ore in cui assorbi meno di quanto ti serve.',
    absorbed: 'Assorbito',
    gutLane: 'Nello stomaco',
    need: 'Fabbisogno',
    timeline: 'Programma',
    axisTime: 'ore',
    gutOver: 'Troppo in una volta — ',
    gutAt: ' g fermi nello stomaco verso ',
    dry: 'Buco nel rifornimento: ',
    dryAt: ' senza carboidrati, verso ',
    carbMode: 'Carboidrati (g/h)',
    fluidMode: 'Idratazione (ml/h)',
    tDry: 'Buco più lungo',
    legFluid: 'Liquidi',
    legSweat: 'Sudore',
    legCap: 'Soglia di assorbimento',
    capNote: 'Soglia di assorbimento: ',
    capNote2:
      " — è il massimo che il tuo intestino può assorbire in un'ora, qualunque cosa tu mangi; l'eccedenza non sparisce, resta ad aspettare nello stomaco. Sale se mescoli glucosio e fruttosio, perché vengono assorbiti da due vie separate (glucosio ca. 60 g/h, il fruttosio aggiunge ca. 30 g/h) — per questo è calcolata dal tuo rapporto maltodestrine:fruttosio (Jeukendrup, rassegne 2010–2014).",
    capNoteFluid:
      "Soglia di assorbimento: ca. 900 ml/h — è più o meno la velocità con cui lo stomaco passa liquido all'intestino sotto sforzo (linea tratteggiata); nella pratica varia di qualche centinaio di ml a seconda di intensità e allenamento intestinale. Sopra questo ritmo la linea passa dal giallo all'arancione al rosso — un segnale di rischio crescente, non un limite netto. Nel totale di idratazione conta comunque solo ciò che lo stomaco ha fatto in tempo a smaltire prima della fine del percorso.",
    tAbsorbed: 'Assorbito',
    tCap: 'Soglia di assorbimento',
    tGutPeak: 'Picco nello stomaco',
    timelineHint:
      'Solo visualizzazione — posizione, estensione e contenuto di ogni ricarica si impostano sul grafico sopra.',
    dragHint:
      'Le barre non si sovrappongono mai — una barra trascinata si accorcia per stare in uno spazio stretto. I trattini delle porzioni di gel si spostano separatamente.',
    addFuel: 'Aggiungi cibo:',
    removeItem: 'Rimuovi',
    addShopStop: 'Aggiungi tappa',
    addFillTo: 'Aggiungi una ricarica a ',
    emptyLaneHint: 'Clicca + per aggiungere una ricarica',
    coverage: 'Fabbisogno coperto',
    summary: 'Riepilogo',
    hydration: 'Idratazione',
    sweatLoss: 'Perdita',
    planned: 'Pianificato',
    needSum: 'Fabbisogno',
    recipes: 'Ricette per borraccia',
    recipesHint: 'Grammi da misurare per ogni ricarica — per borraccia, flask o barattolo.',
    ratio: 'Maltodestrine : Fruttosio',
    mixRatioHint:
      "Maltodestrine e fruttosio vengono assorbiti attraverso due vie intestinali separate — combinandoli il corpo assimila più carboidrati all'ora rispetto alla sola maltodestrina. Il rapporto predefinito è 2:1, ma lo zucchero comune (naturalmente circa 1:1 glucosio-fruttosio) o il miele (circa 0,8:1) danno un effetto simile — sono equivalenti naturali già pronti della stessa miscela. Con un intestino ben allenato funziona bene anche un rapporto 1,2:1.",
    mixSugarBlendHeader: 'Miscela di zuccheri — rapporto Maltodestrine su Fruttosio',
    mixSugarAmountIzo: 'Quanto zucchero (totale) deve avere la bevanda',
    mixSugarAmountGel: 'Quanto zucchero (totale) deve avere il gel',
    mixSaltAmount: 'Integrazione di sali minerali: sale',
    ratioLabelSugar: 'Zucchero',
    ratioLabelHoney: 'Miele',
    concLabel: 'carboidrati',
    saltLabel: 'sale',
    citricLabel: 'acido citrico',
    citricSourceLabel: 'Acido',
    mixFlavorHeader: 'Aggiunta di gusto per ridurre la dolcezza',
    mixCitricHint:
      "L'acido citrico è solo questione di gusto — non influisce sulla velocità di assorbimento dei carboidrati.",
    citricSourceCitric: 'Acido citrico',
    citricSourceLemon: 'Limone',
    citricSourceLime: 'Lime',
    citricSourceLemonJuice: 'Succo di limone',
    citricSourceLimeJuice: 'Succo di lime',
    citricFieldLemon: 'Limone fresco',
    citricFieldLime: 'Lime fresco',
    citricFieldLemonJuice: 'Succo di limone in bottiglia',
    citricFieldLimeJuice: 'Succo di lime in bottiglia',
    gelConcLabel: 'carboidrati',
    per100: 'g/100 ml',
    per100Ml: 'ml/100 ml',
    per100Fruit: '%/100 ml',
    mixIzo: 'Bevanda',
    mixGel: 'Gel',
    target: 'Obiettivo',
    mobileNotesTitle: 'Regole della versione mobile',
    tCarbs: 'Carboidrati totali',
    tTarget: 'Obiettivo',
    tGap: 'Differenza',
    tKcal: 'Energia',
    tDrink: 'Dai liquidi',
    tSolid: 'Dal cibo',
    tRefills: 'Ricariche',
    tPortions: 'Porzioni di gel',
    tabPlan: 'Piano',
    tabGear: 'Attrezzatura',
    tabFood: 'Prodotti',
    tabMe: 'Io',
    ok: "L'apporto segue il fabbisogno in modo regolare. Calo maggiore: ",
    low2: 'Pochi carboidrati — aggiungi un elemento nella seconda metà del percorso.',
    over: 'Sopra il fabbisogno — rischio di problemi di stomaco.',
    dip: ' g sotto la curva verso ',
    hydOk: 'I liquidi coprono la perdita. Bevi con regolarità.',
    hydLow: 'Pianifica una ricarica o una borraccia in più.',
    gpx: 'Profilo GPX',
    gpxFile: 'track.gpx (demo)',
    gpxOn: 'Attivo',
    gpxPick: 'Carica',
    gpxBad: 'Impossibile leggere questo file GPX.',
    shot: 'in un colpo',
    sipped: 'a sorsi',
    water: 'Acqua',
    izo: 'Izo',
    gel: 'Gel',
    fill: 'Riempimento',
    refills: 'ricariche',
    addFill: '+ ricarica quando è vuota',
    noRoom: 'nessuno spazio libero',
    foodLane: 'Cibo / extra',
    foodLaneSub: 'possono sovrapporsi',
    addFoodHint: 'scegli dalla lista sotto il grafico',
    portions: 'porzioni',
    malto: 'Maltodestrine',
    fructose: 'Fruttosio',
    salt: 'Sale',
    citric: 'Acido citrico',
    waterFill: 'Acqua',
    carbsIn: 'Carboidrati',
    perPortion: 'A porzione',
    refillAt: 'ricarica a ',
    langName: 'Italiano',
    langShort: 'IT',
    itemsSuffix: 'elementi',
    newVessel: 'Nuova borraccia',
    viewLabel: 'Modalità di visualizzazione',
    viewAuto: 'Auto',
    autoDetected: 'rilevato automaticamente: ',
    themeToggleLabel: 'Cambia tema (auto/chiaro/scuro)',
    themeLabel: 'Tema',
    themeAuto: 'Auto',
    themeLight: 'Chiaro',
    themeDark: 'Scuro',
    viewModeConfirmTitle: 'Forzare questa visualizzazione?',
    viewModeConfirmBody:
      'Lo schermo smetterà di adattarsi automaticamente al dispositivo. Puoi cambiarlo di nuovo in qualsiasi momento dallo stesso punto.',
    viewModeConfirmCancel: 'Annulla',
    viewModeConfirmConfirm: 'Forza',
    mixSection: 'Miscela',
    editInSettings: 'impostazioni della miscela',
    ratioCustom: 'personalizzato',
    resetDefaults: 'Ripristina i valori predefiniti',
    foodSection: 'Cibo ed extra',
    addFoodItem: 'Aggiungi prodotto',
    newFood: 'Nuovo prodotto',
    fName: 'prodotto',
    fCarbs: 'carboidrati (g)',
    fMl: 'liquido (ml)',
    fCont: 'nel tempo',
    fContHeader: 'rilascio',
    foodSectionHint:
      'La tua lista di prodotti — questi pulsanti compaiono sotto il grafico. Indica solo i carboidrati per porzione (non il peso della barretta) ed eventuale liquido.',
    foodContHint:
      'Attivando «nel tempo» il prodotto compare lentamente sul grafico, distribuito su più chilometri — una banana la mangi subito, le caramelle gommose invece le sgranocchi strada facendo.',
    mixHintPre: 'Qui imposti la composizione della tua bevanda e del gel — ',
    mixHintLink1: 'rapporto degli zuccheri',
    mixHintMid1: ' (funzionano anche ',
    mixHintLink2: 'zucchero comune o miele',
    mixHintMid2: '), ',
    mixHintLink3: 'sale',
    mixHintMid3: ' e un ',
    mixHintLink4: 'aggiunta di gusto',
    mixHintPost:
      '. I valori sono per 100 ml, da qui vengono calcolati i grammi per ogni ricarica del piano.',
    notes: [
      {
        title: 'Una corsia per ogni borraccia',
        body: "Borraccia grande, borraccia piccola, flask — ognuna ha la sua corsia, quindi il gel non può finire nella borraccia dell'izo.",
      },
      {
        title: 'Ricarica quando è vuota',
        body: 'Le ricariche non si sovrappongono mai: una barra si ferma accanto a quella vicina, e + inserisce una ricarica in uno spazio libero.',
      },
      {
        title: 'Cibo a parte',
        body: 'Banana e caramelle gommose possono sovrapporsi, una birra analcolica la prendi una volta sola al punto di ristoro — per questo hanno una corsia propria.',
      },
      {
        title: 'Ricetta per borraccia',
        body: 'La scheda «Ricette per borraccia» calcola i grammi di maltodestrine, fruttosio, sale e acido citrico per ogni singola ricarica.',
      },
    ],
    ftAboutBody:
      "Carb Fueling calcola quanti carboidrati e quanto liquido portare su un percorso — da distanza, ritmo, peso, intensità e temperatura — e poi li distribuisce nel tempo tra borracce, flask e cibo. Il tuo piano, l'attrezzatura e la lista prodotti restano salvati in questo browser.",
    ftPrivacy:
      'Nessun account, nessun server, nessun cookie. Conteggio visite anonimo e senza cookie (GoatCounter) — nessun tracciamento tra siti.',
    ftLegal: 'Note legali',
    ftLegalBody:
      "Questo è uno strumento educativo e di pianificazione — non è un consiglio medico, dietetico o di allenamento e non sostituisce un professionista. Tutti i valori sono stime basate su modelli medi; il tuo reale fabbisogno, la tolleranza intestinale, lo stato di idratazione e la risposta allo sforzo possono differire in modo significativo. Usi l'app sotto la tua responsabilità e a tuo esclusivo rischio. L'autore non si assume alcuna responsabilità per conseguenze sulla salute, infortuni, danni, perdite o decisioni prese sulla base di questi risultati — in particolare non risponde della tua salute o della tua vita. Se hai una condizione medica (tra cui diabete, malattie renali, cardiache o gastrointestinali), assumi farmaci, sei incinta o ti stai preparando per un evento lungo o molto intenso, discuti il tuo piano alimentare con un medico o un dietista sportivo. Non ignorare i sintomi: in caso di vertigini, nausea, disorientamento, crampi o sospetta iponatriemia, fermati e cerca aiuto. L'app viene fornita «così com'è», senza alcuna garanzia.",
    ftLinks: 'Contribuisci',
    ftFaq: 'FAQ',
    ftIssues: 'Idee e bug → GitHub Issues',
    ftRepo: 'Codice sorgente su GitHub',
    ftSupport: 'Offrimi un caffè',
    ftSponsor: 'Sostieni',
    ftContact: 'Scrivimi',
    ftSources2: 'Perdita di sudore: una stima da peso, intensità e temperatura.',
    ftCopyright: '© 2026 Carb Fueling · open source',
    tourWelcomeTitle: 'Benvenuto su Carb Fueling',
    tourWelcomeBody:
      'In pochi passaggi ti mostriamo come pianificare carboidrati e liquidi per il tuo percorso e come leggere il risultato. Richiede circa un minuto.',
    tourRouteTitle: 'Percorso e risultato',
    tourRouteBody:
      'Qui descrivi il tuo giro — distanza e ritmo, oppure una durata — insieme alle condizioni (intensità, temperatura, pasto prima della partenza). Le schede accanto mostrano se il tuo piano copre il fabbisogno di carboidrati e liquidi. Puoi anche caricare un tuo file GPX — ritmo e fabbisogno si adatteranno così al profilo reale del percorso (salite e discese) invece che a una media.',
    tourRouteBodyMobile:
      'Modifichi il percorso con il pulsante in alto sullo schermo — distanza e ritmo, oppure una durata, più le condizioni (intensità, temperatura, pasto prima della partenza) e il caricamento di un file GPX. Queste schede mostrano se il tuo piano copre il fabbisogno di carboidrati e liquidi.',
    tourChartTitle: 'Il grafico: apporto contro fabbisogno',
    tourChartBody:
      "I numeri a sinistra sono la scala: grammi di carboidrati all'ora (g/h). La linea continua è quanto stai davvero fornendo, quella tratteggiata è quanto ti serve. La linea orizzontale punteggiata è la soglia di assorbimento: il massimo che il tuo intestino assorbe in un'ora, qualunque cosa tu mangi — l'eccedenza aspetta nello stomaco. La barra sopra il grafico è proprio quello stomaco: mostra cosa sta digerendo in quel momento. Abbiamo aggiunto una borraccia di esempio per farti vedere come funziona in pratica.",
    tourChartBodyMobile:
      "La linea continua è quanti carboidrati all'ora stai davvero fornendo, quella tratteggiata è quanti te ne servono. La linea orizzontale punteggiata è la soglia di assorbimento: il massimo che il tuo intestino assorbe in un'ora, qualunque cosa tu mangi — l'eccedenza aspetta nello stomaco. La parte alta del grafico è proprio quello stomaco: mostra cosa sta digerendo in quel momento. Trascina il dito sul grafico per leggere i valori esatti in ogni punto del percorso. Abbiamo aggiunto una borraccia di esempio per farti vedere come funziona in pratica.",
    tourFillTitle: 'Una borraccia: spostarla, ridimensionarla, cambiarne il contenuto',
    tourFillBody:
      'Questa barra è la borraccia appena aggiunta. Puoi trascinare il centro per spostarla lungo il percorso, oppure il bordo sinistro o destro per accorciare o allungare il tratto in cui la bevi. Passandoci sopra con il cursore compaiono i pulsanti per cambiare il contenuto (acqua / izo / gel), se la borraccia ne ammette più di uno. Provalo dopo aver chiuso il tour.',
    tourFillBodyMobile:
      'Questa è la borraccia appena aggiunta. Toccala per aprire la modifica — i pulsanti «da» e «a» la spostano lungo il percorso o ne cambiano la lunghezza del tratto, e i pulsanti accanto cambiano il contenuto (acqua / izo / gel), se la borraccia ne ammette più di uno.',
    tourAddFillTitle: "Aggiungi un'altra ricarica",
    tourAddFillBody:
      "Questo pulsante «+» inserisce un'altra ricarica nel primo spazio libero del percorso — utile quando una borraccia si svuota e va riempita con qualcos'altro. Vale lo stesso per il cibo: i pulsanti dei prodotti sotto il grafico aggiungono un altro elemento con un clic.",
    tourAddFillBodyMobile:
      "Questo pulsante inserisce un'altra ricarica nel primo spazio libero del percorso — utile quando una borraccia si svuota e va riempita con qualcos'altro. Vale lo stesso per il cibo: i pulsanti dei prodotti più sotto aggiungono un altro elemento con un tocco.",
    tourAddShopTitle: 'Punti di rifornimento',
    tourAddShopBody:
      'Questo «+» aggiunge sul grafico un indicatore di rifornimento (ad es. un negozio) — trascinalo in qualsiasi punto del percorso per segnare a che chilometro prevedi di comprare altro cibo o da bere.',
    tourAddShopBodyMobile:
      'Questo pulsante apre un piccolo modulo per un punto di rifornimento — inserisci il chilometro e un nome (ad es. un negozio) per segnare dove prevedi di comprare altro cibo o da bere.',
    tourClosingTitle: "Questo è l'essenziale",
    tourClosingBody:
      "Le ricette per riempire borracce e ricariche sono sotto il grafico. Attrezzatura, Miscela, Prodotti e Impostazioni (peso, modalità di visualizzazione) sono nell'intestazione. Puoi rivedere questo tour in qualsiasi momento dal pulsante nel piè di pagina. Vuoi saperne di più? Trovi anche le FAQ nel piè di pagina.",
    tourClosingBodyMobile:
      'Le ricette per riempire le borracce sono dietro il pulsante «Ricette per borraccia» nella lista del piano. Impostazioni e lingua si cambiano nella scheda «Io», i rapporti della miscela e le borracce disponibili nelle schede «Mix» e «Attrezzatura». Puoi rivedere questo tour in qualsiasi momento dal pulsante nella scheda «Io». Vuoi saperne di più? Trovi le FAQ anche nella scheda «Io».',
    tourNext: 'Avanti',
    tourBack: 'Indietro',
    tourSkip: 'Salta',
    tourFinish: 'Fine',
    tourStepLabel: 'Passo',
    tourReplayButton: 'Rivedi il tour',
    tourConfirmTitle: 'Rivedere il tour?',
    tourConfirmBody:
      'Il tour caricherà dati di esempio (un percorso e una borraccia) al posto del tuo piano attuale. Non si può annullare.',
    tourConfirmCancel: 'Annulla',
    tourConfirmStart: 'Avvia il tour',
    tabMix: 'Mix',
    editRoutePrefix: 'Modifica percorso:',
    narrationRate:
      "Quanti carboidrati all'ora stai davvero assorbendo (linea) rispetto al fabbisogno (tratteggiata). Punteggiata è la soglia di assorbimento.",
    narrationFluid:
      "Quanto liquido bevi all'ora (linea) rispetto a quanto perdi con il sudore (tratteggiata).",
    narrationProfile:
      'Profilo del percorso — altitudine sul livello del mare. Le salite aumentano il fabbisogno.',
    scrubHint: 'trascina per leggere',
    legendGpx: 'obiettivo',
    chartHelpBtnLabel: 'Spiega il grafico',
    chartHelpTitle: 'Come leggere questo grafico',
    chartHelpFullTour: 'Mostrami tutto il tour',
    chartHelpScrubNote:
      'Trascina il dito sul grafico per vedere i numeri esatti in ogni punto del percorso.',
    chartHelpAxisNote: 'I valori esatti sono indicati dai numeri sugli assi a sinistra e in basso.',
    chartHelpAbsorbedBody:
      'Questo aumenta lentamente la quantità di carboidrati disponibili nel tuo corpo. Pianificando il percorso, cerchi di tenere questa linea il più vicino possibile al fabbisogno. Il colore della linea cambia in base a cosa hai mangiato.',
    chartHelpNeedBody:
      "Ecco quanti carboidrati richiede il percorso in quell'ora — durante lo sforzo dovresti assumerne altrettanti.",
    chartHelpCapBody:
      "Il massimo che il tuo intestino assorbe in un'ora, qualunque cosa tu mangi o beva.",
    chartHelpGutBody: 'Ciò che mangi o bevi finisce nello stomaco, dove viene digerito lentamente.',
    chartHelpDeficitLabel: 'Deficit',
    chartHelpDeficitBody:
      'Qui stai assorbendo meno di quanto ti serve — rischio di calo di energie.',
    chartHelpFluidAbsorbedBody: "Quanto stai davvero bevendo in quell'ora.",
    chartHelpFluidCapBody:
      "All'incirca la velocità con cui lo stomaco passa il liquido all'intestino. Sopra di essa la linea passa dal giallo all'arancione al rosso — rischio crescente di ristagno, non un limite netto.",
    chartHelpSweatBody: 'Quanto perdi con il sudore — il tuo fabbisogno di liquidi.',
    foodSection2: 'Cibo',
    gearHintMobile:
      'Cosa hai sulla bici. Volume e contenuto ammesso decidono quanti carboidrati entrano in una ricarica.',
    mixHintMobile:
      'Composizione di izo e gel. Cambiarla ricalcola i grammi per ricarica e la soglia di assorbimento.',
    absCapNoteMobile:
      'Con questo rapporto la soglia è {cap} g/h — la linea punteggiata sul grafico.',
    gelPartsStepper: 'Porzioni di gel per ricarica',
    foodStepwise: 'nel tempo',
    foodAddProduct: '+ Aggiungi prodotto',
    meWeight: 'Peso',
    meApp: 'App',
    meLanguage: 'Lingua',
    meView: 'Modalità di visualizzazione',
    mixSheetTitle: 'Ricette per borraccia',
    mixSheetSubtitle: 'Grammi da misurare per ogni ricarica',
    mixSheetEmpty: 'Nessuna ricarica · —',
    mixRowSugar: 'Carboidrati',
    mixRowMalto: 'Maltodestrine',
    mixRowFructose: 'Fruttosio',
    mixRowSalt: 'Sale',
    mixRowCitric: 'Acido citrico',
    mixRowWater: 'Acqua',
    routeSheetTitleCycling: 'PERCORSO IN BICI E CONDIZIONI',
    routeSheetTitleRunning: 'PERCORSO DI CORSA E CONDIZIONI',
    routeSheetPreStart: 'PRIMA DELLA PARTENZA',
    routeSheetIntensity: 'Intensità',
    routeSheetTemp: 'Temperatura',
    routeSheetGpxSection: 'PROFILO GPX',
    routeSheetGpxNote:
      "Un profilo attivo cambia il fabbisogno nelle salite. L'icona a occhio sopra il grafico mostra il profilo stesso.",
    routeSheetLoadFile: 'Carica file',
    routeSheetDone: 'Fatto',
    shopSheetTitle: 'PUNTO DI RIFERIMENTO',
    shopSheetKm: 'Chilometro',
    shopSheetName: 'Nome',
    shopSheetAdd: 'Aggiungi',
    shopDefaultName: 'Negozio',
    combineFillCheckbox: 'Prepara insieme',
    combineSectionTitle: 'Porzione combinata',
    combineSectionHint:
      'Seleziona le ricariche che prepari insieme (qualsiasi borraccia, in qualsiasi momento) per vedere una porzione combinata invece di ricette separate.',
    combineBottles: 'Borracce',
    combineNote: 'Incluso nella porzione combinata sopra.',
    combineMixedLabel: 'Izo + gel',
    combinePourLabel: 'Quanto va in ciascuna borraccia',
    combineCrossTypeConfirmTitle: "Combinare izo e gel in un'unica porzione?",
    combineCrossTypeConfirmBody:
      "Questa porzione combinata eredita dalle impostazioni dell'izo il rapporto malto:fruttosio, il sale e l'acido citrico (quantità e fonte). I valori propri del gel restano salvati ma non si applicano finché sono combinati — modificali invece nelle impostazioni dell'izo. La concentrazione del gel (g/100 ml) resta comunque impostata separatamente.",
    combineCrossTypeConfirmCancel: 'Annulla',
    combineCrossTypeConfirmConfirm: 'Combina',
    gelLockedNote:
      "Hai una porzione combinata — rapporto, sale e acido citrico del gel sono ereditati dall'izo, modificali lì.",
    unlockGelButton: 'Sblocca',
    bidonComposition: 'RICETTE PER BORRACCIA',
    perFillGrams: 'grammi per ricarica ›',
    addLandmark: 'Aggiungi punto di riferimento',
    noGap: 'nessuno spazio libero',
    noRoomHint: 'Nessuno spazio',
    rateInSegmentSuffix: ' g/h in questo tratto',
    eatenOnceLabel: 'mangiato una volta',
    carbCardTitle: 'Carboidrati',
    inPlanSuffix: '× nel piano',
    planDataSection: 'Dati del piano',
    planDataHint:
      "Salva l'intero piano (percorso, attrezzatura, miscela, prodotti, negozi) in un file, oppure carica una copia su un altro dispositivo.",
    exportPlanButton: 'Scarica il piano',
    importPlanButton: 'Carica il piano',
    importPlanConfirmTitle: 'Sostituire il piano attuale?',
    importPlanConfirmBody:
      "L'importazione sovrascriverà il percorso, l'attrezzatura, la miscela, i prodotti e i negozi attuali con i dati del file. Non si può annullare.",
    importPlanConfirmCancel: 'Annulla',
    importPlanConfirmConfirm: 'Importa',
    importPlanError:
      "Impossibile leggere il file — controlla che sia un'esportazione valida di un piano Carb Fueling.",
    importPlanSuccess: 'Piano importato.',
    exportPlanError: 'Impossibile salvare il file. Riprova.',
    clearPlanButton: 'Ricomincia',
    printPlanButton: 'Stampa',
    printStripBottles: 'Borracce',
    printStripFood: 'Cibo',
    printStripStops: 'Tappe',
    printCutHint: 'Ritaglia e attacca al tubo orizzontale',
    clearPlanConfirmTitle: 'Ricominciare?',
    clearPlanConfirmBody:
      'Questo rimuove ricariche, cibo e tappe dal percorso. Percorso, attrezzatura e miscela restano invariati. Non si può annullare.',
    clearPlanConfirmCancel: 'Annulla',
    clearPlanConfirmConfirm: 'Ricomincia',
    recoveryLabel: 'Recupero',
    recoveryHint:
      'La quantità di carboidrati da mangiare dopo il giro per ricostituire il glicogeno muscolare.',
    carbRateHint:
      "Il colore della barra segue il tuo ritmo di apporto reale (g/h) rispetto a quanto serve davvero per questo percorso — non la percentuale sopra. Diventa verde quando fornisci quanto richiesto dal percorso; se il fabbisogno supera circa 40 g/h, basta arrivare a 40 g/h, perché oltre quella soglia altri carboidrati aiutano molto poco. Sotto 1h di bici o corsa la barra è grigia, perché su un tempo così breve i carboidrati contano comunque poco. Bordeaux significa che il ritmo pianificato supera quanto il tuo intestino può davvero assorbire — l'eccesso resta nello stomaco e richiama acqua, da cui nausea o gonfiore per aver esagerato.",
    waterBalanceHint:
      "Un meno è un deficit rispetto alla perdita di sudore, un più significa bere oltre quella perdita. Il deficit tollerabile si riduce con l'aumentare della temperatura; un surplus comporta il rischio di iponatriemia.",
    waterBalanceHintLink: 'Come si legge →',
    waterBalanceAria: 'Cosa significa il bilancio dei liquidi',
    waterBalanceLabel: 'Bilancio dei liquidi in % della massa corporea',
  },
};

export function t(lang: Lang): StringTable {
  return { ...STR.en, ...STR[lang] };
}

type FruitSpecies = 'lemon' | 'lime';

// Word forms for "N lemons/limes" next to a fraction like "3/4 cytryny". Polish noun counting
// has three buckets (1 / 2-4 / 5+, plus fractions taking the genitive-singular "few" form);
// English and German just need singular vs. plural. This is a personal project, not a grammar
// textbook — close enough for a recipe card, not aiming to nail every edge case (e.g. "1 1/2").
const FRUIT_NOUNS: Record<
  Lang,
  Record<FruitSpecies, { one: string; few: string; many: string }>
> = {
  pl: {
    lemon: { one: 'cytryna', few: 'cytryny', many: 'cytryn' },
    lime: { one: 'limonka', few: 'limonki', many: 'limonek' },
  },
  en: {
    lemon: { one: 'lemon', few: 'lemons', many: 'lemons' },
    lime: { one: 'lime', few: 'limes', many: 'limes' },
  },
  de: {
    lemon: { one: 'Zitrone', few: 'Zitronen', many: 'Zitronen' },
    lime: { one: 'Limette', few: 'Limetten', many: 'Limetten' },
  },
  it: {
    lemon: { one: 'limone', few: 'limoni', many: 'limoni' },
    lime: { one: 'lime', few: 'lime', many: 'lime' },
  },
};

/** Declines the fruit noun for a whole-fruit citric amount, e.g. pl: 3/4 → "cytryny", 1 → "cytryna".
 *  Grouped by declension family, not by language, so a new language joins whichever `case` matches
 *  its grammar (two-bucket like en/de, or Polish's three-bucket system) instead of a new branch. */
export function fruitNoun(species: FruitSpecies, amount: number, lang: Lang): string {
  const forms = FRUIT_NOUNS[lang][species];
  switch (lang) {
    case 'en':
    case 'de':
    case 'it':
      return amount <= 1 ? forms.one : forms.few;
    default:
      if (amount === 1) return forms.one;
      if (!Number.isInteger(amount)) return forms.few;
      if (amount >= 2 && amount <= 4) return forms.few;
      return forms.many;
  }
}
