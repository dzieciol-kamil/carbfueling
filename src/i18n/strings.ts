export const LANGS = ['pl', 'en'] as const;
export type Lang = (typeof LANGS)[number];

export interface StringTable {
  tagline: string;
  desktop: string;
  mobile: string;
  route: string;
  byRoute: string;
  byTime: string;
  distance: string;
  speed: string;
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
  curveHintSum: string;
  intake: string;
  absorbed: string;
  gutLane: string;
  need: string;
  timeline: string;
  axisTime: string;
  gutOver: string;
  gutAt: string;
  dry: string;
  dryAt: string;
  sumMode: string;
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
  ratioLabelSugar: string;
  ratioLabelHoney: string;
  concLabel: string;
  saltLabel: string;
  citricLabel: string;
  citricSourceLabel: string;
  citricSourceCitric: string;
  citricSourceLemon: string;
  citricSourceLime: string;
  citricSourceLemonJuice: string;
  citricSourceLimeJuice: string;
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
  viewModeConfirmTitle: string;
  viewModeConfirmBody: string;
  viewModeConfirmCancel: string;
  viewModeConfirmConfirm: string;
  mixSection: string;
  editInSettings: string;
  ratioCustom: string;
  resetDefaults: string;
  gearMix: string;
  foodSection: string;
  addFoodItem: string;
  newFood: string;
  fName: string;
  fCarbs: string;
  fMl: string;
  fCont: string;
  foodSectionHint: string;
  mixHint: string;
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
  narrationSum: string;
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
  chartHelpSweatBody: string;
  chartHelpSumAbsorbedBody: string;
  chartHelpSumNeedBody: string;
  chartHelpSumIntakeBody: string;
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
  routeSheetTitle: string;
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
  recoveryLabel: string;
  recoveryHint: string;
}

export const STR: Record<Lang, StringTable> = {
  pl: {
    tagline: 'planer węglowodanów i nawodnienia',
    desktop: 'Komputer',
    mobile: 'Telefon',
    route: 'Trasa',
    byRoute: 'Dystans + tempo',
    byTime: 'Czas',
    distance: 'Dystans',
    speed: 'Śr. prędkość',
    hours: 'Godziny',
    minutes: 'Minuty',
    duration: 'Czas trwania',
    weight: 'Waga',
    preMealCarbs: 'Węgle przed startem',
    preMealMinutes: 'Czas przed startem',
    intensity: 'Intensywność',
    intensityHint:
      'Niska = swobodnie rozmawiasz pełnymi zdaniami. Średnia = rozmawiasz, ale pojedynczymi zdaniami. Wysoka = ledwo mówisz, skupiony na oddechu. Od tego zależy, ile węglowodanów na godzinę zaplanuje Carb Fueling.',
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
    curveHintSum:
      'Gruba ciągła linia to suma węglowodanów, które realnie wchłonąłeś do danej godziny.',
    intake: 'Zjedzone',
    absorbed: 'Wchłonięte',
    gutLane: 'W żołądku',
    need: 'Zapotrzebowanie',
    timeline: 'Rozkład',
    axisTime: 'godziny',
    gutOver: 'Za dużo naraz — ',
    gutAt: ' g zalega w żołądku ok. ',
    dry: 'Dziura w tankowaniu: ',
    dryAt: ' bez cukru, ok. ',
    sumMode: 'Suma',
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
      'Limit wchłaniania: 750 ml/h — tyle płynu żołądek oddaje do jelita w wysiłku (przerywana linia). Nadwyżka nie wchłania się, tylko zalega. Przy zwiększonej potliwości podczas wysiłku da się deficyt ograniczyć, ale nie wyzerować.',
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
    ratioLabelSugar: 'Cukier',
    ratioLabelHoney: 'Miód',
    concLabel: 'cukry',
    saltLabel: 'sól',
    citricLabel: 'kwasek',
    citricSourceLabel: 'Kwasek',
    citricSourceCitric: 'Kwasek cytrynowy',
    citricSourceLemon: 'Cytryna',
    citricSourceLime: 'Limonka',
    citricSourceLemonJuice: 'Sok z cytryny',
    citricSourceLimeJuice: 'Sok z limonki',
    gelConcLabel: 'cukry',
    per100: 'g/100 ml',
    per100Ml: 'ml/100 ml',
    per100Fruit: '%/100 ml',
    mixIzo: 'Izotonik',
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
    viewModeConfirmTitle: 'Wymusić ten widok?',
    viewModeConfirmBody:
      'Ekran przestanie się automatycznie dopasowywać do rozmiaru urządzenia. Możesz to zmienić w dowolnej chwili w tym samym miejscu.',
    viewModeConfirmCancel: 'Anuluj',
    viewModeConfirmConfirm: 'Wymuś',
    mixSection: 'Mieszanka',
    editInSettings: 'ustawienia mieszanki',
    ratioCustom: 'własna',
    resetDefaults: 'Przywróć domyślne',
    gearMix: 'Mieszanka i bidony',
    foodSection: 'Jedzenie i dodatki',
    addFoodItem: 'Dodaj produkt',
    newFood: 'Nowy produkt',
    fName: 'produkt',
    fCarbs: 'cukry (g)',
    fMl: 'płyn (ml)',
    fCont: 'stopniowo',
    foodSectionHint:
      'Twoja lista produktów — te przyciski pojawiają się pod wykresem. Podaj same węglowodany w porcji (nie wagę batona) i ewentualny płyn.',
    mixHint: 'Wartości na 100 ml — stąd liczą się gramy dla każdego napełnienia.',
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
      'Ten pasek to właśnie dodany bidon. Środek można chwycić i przesunąć po trasie, a lewą lub prawą krawędź — żeby skrócić lub wydłużyć odcinek, na którym z niego pijesz. Po najechaniu kursorem pojawiają się przyciski zmiany zawartości (woda / izotonik / żel), jeśli bidon obsługuje więcej niż jeden rodzaj. Spróbuj tego po zamknięciu touru.',
    tourFillBodyMobile:
      'To dodany bidon. Stuknij w niego, żeby rozwinąć edycję — przyciskami „od” i „do” przesuniesz go po trasie albo zmienisz długość odcinka, a przyciski obok pozwolą zmienić zawartość (woda / izotonik / żel), jeśli bidon obsługuje więcej niż jeden rodzaj.',
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
      'Przepisy na uzupełnianie dodanych bidonów i dolewek znajdziesz pod wykresem. Ustawienia (waga, ustawienia dostępnych produktów) oraz Mieszanka i bidony (pozwala ustalić proporcje i dostępne bidony) znajdziesz w nagłówku. Ten tour możesz odpalić ponownie w każdej chwili przyciskiem w stopce. Jeśli zechcesz dowiedzieć się więcej, zawsze możesz zajrzeć do FAQ — znajdziesz je też w stopce.',
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
    narrationSum:
      'Węgle zsumowane od startu: co wchłoniesz (linia) wobec zapotrzebowania (przerywana).',
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
    chartHelpSweatBody: 'Ile tracisz z potem — Twoje zapotrzebowanie na płyny.',
    chartHelpSumAbsorbedBody: 'Łącznie wchłonięte węglowodany od startu trasy.',
    chartHelpSumNeedBody: 'Łącznie ile było Ci potrzeba od startu trasy.',
    chartHelpSumIntakeBody: 'Ile faktycznie zjadłeś — różnica czeka w żołądku.',
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
    routeSheetTitle: 'TRASA I WARUNKI',
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
    recoveryLabel: 'Regeneracja',
    recoveryHint:
      'Ilość węglowodanów, którą należy spożyć po jeździe, aby uzupełnić glikogen mięśniowy.',
  },
  en: {
    tagline: 'carbohydrate & hydration planner',
    desktop: 'Desktop',
    mobile: 'Phone',
    route: 'Route',
    byRoute: 'Distance + pace',
    byTime: 'Time',
    distance: 'Distance',
    speed: 'Avg speed',
    hours: 'Hours',
    minutes: 'Minutes',
    duration: 'Duration',
    weight: 'Weight',
    preMealCarbs: 'Carbs before start',
    preMealMinutes: 'Time before start',
    intensity: 'Intensity',
    intensityHint:
      'Low = you can chat comfortably in full sentences. Medium = you talk, but in short sentences. High = you can barely speak, focused on breathing. This drives how many carbs per hour the app plans for.',
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
    curveHintSum:
      "The thick solid line is the cumulative carbs you've actually absorbed by a given hour.",
    intake: 'Eaten',
    absorbed: 'Absorbed',
    gutLane: 'In the gut',
    need: 'Requirement',
    timeline: 'Schedule',
    axisTime: 'hours',
    gutOver: 'Too much at once — ',
    gutAt: ' g sitting in the stomach around ',
    dry: 'Fuelling gap: ',
    dryAt: ' with no carbs, around ',
    sumMode: 'Total',
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
      'Absorption limit: 750 ml/h — that is how fast the stomach passes fluid on to the gut under load (dashed line). Anything above it is not absorbed, it just sits there. With a higher sweat rate you can limit the deficit, not erase it.',
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
    emptyLaneHint: 'Tap + to add a fill',
    coverage: 'Requirement covered',
    summary: 'Summary',
    hydration: 'Hydration',
    sweatLoss: 'Loss',
    planned: 'Planned',
    needSum: 'Requirement',
    recipes: 'Bottle recipes',
    recipesHint: 'Grams to measure out for each fill — per bottle, flask or jar.',
    ratio: 'Maltodextrin : Fructose',
    ratioLabelSugar: 'Sugar',
    ratioLabelHoney: 'Honey',
    concLabel: 'carbs',
    saltLabel: 'salt',
    citricLabel: 'citric',
    citricSourceLabel: 'Acid',
    citricSourceCitric: 'Citric acid',
    citricSourceLemon: 'Lemon',
    citricSourceLime: 'Lime',
    citricSourceLemonJuice: 'Lemon juice',
    citricSourceLimeJuice: 'Lime juice',
    gelConcLabel: 'carbs',
    per100: 'g/100 ml',
    per100Ml: 'ml/100 ml',
    per100Fruit: '%/100 ml',
    mixIzo: 'Isotonic',
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
    viewModeConfirmTitle: 'Force this view?',
    viewModeConfirmBody:
      'The layout will stop adapting automatically to your device. You can change this again anytime from the same place.',
    viewModeConfirmCancel: 'Cancel',
    viewModeConfirmConfirm: 'Force',
    mixSection: 'Drink mix',
    editInSettings: 'mix settings',
    ratioCustom: 'custom',
    resetDefaults: 'Reset to defaults',
    gearMix: 'Mix & bottles',
    foodSection: 'Food & extras',
    addFoodItem: 'Add product',
    newFood: 'New product',
    fName: 'product',
    fCarbs: 'carbs (g)',
    fMl: 'fluid (ml)',
    fCont: 'over time',
    foodSectionHint:
      'Your product list — these buttons show up under the chart. Enter carbs per serving (not the bar weight) and any fluid.',
    mixHint: 'Values per 100 ml — per-fill grams are derived from this.',
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
      'This bar is the bottle we just added. You can drag the middle to move it along the route, or either edge to shorten or lengthen the stretch you drink it over. Hovering it reveals buttons to switch its contents (water / isotonic / gel) if the bottle allows more than one. Try it once you close the tour.',
    tourFillBodyMobile:
      'This is the bottle we just added. Tap it to expand its editor — the "from" and "to" buttons move it along the route or change how long the segment is, and the buttons next to them switch its contents (water / isotonic / gel) if the bottle allows more than one.',
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
      "Recipes for topping up the bottles and fills you've added are under the chart. Settings (weight, available-product settings) and Mix & bottles (set ratios and available bottles) are in the header. Replay this tour any time from the button in the footer. Want to know more? The FAQ is in the footer too.",
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
    narrationSum:
      "Carbs summed from the start: what you'll absorb (line) vs. requirement (dashed).",
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
    chartHelpSweatBody: 'How much you lose through sweat — your fluid requirement.',
    chartHelpSumAbsorbedBody: 'Total carbs absorbed since the start of the route.',
    chartHelpSumNeedBody: "Total amount you've needed since the start of the route.",
    chartHelpSumIntakeBody:
      "How much you've actually eaten — the difference is waiting in your stomach.",
    foodSection2: 'Food',
    gearHintMobile:
      "What's on your bike. Volume and allowed contents decide how many carbs fit in one fill.",
    mixHintMobile:
      'Isotonic and gel composition. Changing it recalculates grams per fill and the absorption limit.',
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
    routeSheetTitle: 'ROUTE & CONDITIONS',
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
    recoveryLabel: 'Recovery',
    recoveryHint:
      'The amount of carbohydrates to eat after your ride to replenish muscle glycogen.',
  },
};

export function t(lang: Lang): StringTable {
  return { ...STR.en, ...STR[lang] };
}

type FruitSpecies = 'lemon' | 'lime';

// Word forms for "N lemons/limes" next to a fraction like "3/4 cytryny". Polish noun counting
// has three buckets (1 / 2-4 / 5+, plus fractions taking the genitive-singular "few" form);
// English just needs singular vs. plural. This is a personal project, not a grammar textbook —
// close enough for a recipe card, not aiming to nail every edge case (e.g. "1 1/2").
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
};

/** Declines the fruit noun for a whole-fruit citric amount, e.g. pl: 3/4 → "cytryny", 1 → "cytryna". */
export function fruitNoun(species: FruitSpecies, amount: number, lang: Lang): string {
  const forms = FRUIT_NOUNS[lang][species];
  if (lang === 'en') return amount <= 1 ? forms.one : forms.few;
  if (amount === 1) return forms.one;
  if (!Number.isInteger(amount)) return forms.few;
  if (amount >= 2 && amount <= 4) return forms.few;
  return forms.many;
}
