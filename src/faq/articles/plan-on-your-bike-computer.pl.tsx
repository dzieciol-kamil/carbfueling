import { faqHref, calculatorHref } from '../../urls';
import {
  FaqLayout,
  articleCodeStyle,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../FaqLayout';

export default function PlanOnYourBikeComputerPl() {
  return (
    <FaqLayout lang="pl" slug="plan-on-your-bike-computer">
      <h1 style={articleH1Style}>Jak przenieść plan na licznik rowerowy</h1>
      <p style={articleTextStyle}>
        Rozpiska przyklejona na górnej rurze działa do pierwszego deszczu i wymaga, żebyś o niej
        pamiętał. Przycisk "Pobierz" przy profilu GPX zapisuje ten sam plan jako plik kursu: Twoja
        trasa, ale z komunikatami wpisanymi w miejsca, w których masz się napić albo coś zjeść.
        Licznik odzywa się sam.
      </p>
      <p style={articleTextStyle}>
        Wgrywasz go jak każdą inną trasę. Garmin Connect przyjmuje .fit, .gpx i .tcx jako kurs:
        wybierasz plik, podajesz typ aktywności i nazwę, zapisujesz, wysyłasz na licznik. Nazwę
        skróć — większość Edge'ów pokazuje tylko pierwszych 15 znaków, więc dwie podobnie nazwane
        trasy zlewają się na ekranie w jedno. Wahoo ELEMNT i Hammerhead Karoo też czytają TCX i
        trasę pokażą; co do samych powiadomień na tych markach nie mamy pewności.
      </p>
      <p style={articleTextStyle}>
        Licznik pokazuje na dole ekranu pasek z nazwą punktu i chowa go po dwóch sekundach. Dziesięć
        znaków, jeden rzut oka — stąd taki zapis:
      </p>
      <ul style={{ ...articleTextStyle, paddingLeft: 20 }}>
        <li>
          <code style={articleCodeStyle}>B1</code> — pierwszy bidon, w kolejności, w jakiej
          ustawiłeś sprzęt w aplikacji
        </li>
        <li>
          <code style={articleCodeStyle}>(W)</code> woda, <code style={articleCodeStyle}>(I)</code>{' '}
          izo, <code style={articleCodeStyle}>(Z)</code> żel
        </li>
        <li>
          <code style={articleCodeStyle}>25%</code> — tyle ma w bidonie <em>zostać</em>, a nie tyle
          masz wypić
        </li>
        <li>
          <code style={articleCodeStyle}>B3(Z)2/3</code> — żel liczy dawki, nie poziom: druga porcja
          z trzech
        </li>
        <li>
          <code style={articleCodeStyle}>Stop 1/3</code> — pierwszy postój z trzech
        </li>
      </ul>
      <p style={articleTextStyle}>
        Punkty nie leżą w równych odstępach. Bidon opróżnia się nie z kilometrami, tylko z wysiłkiem
        — na podjeździe pijesz szybciej, na zjeździe wolniej. Jeśli trudna część trasy jest na
        początku, "została ćwiartka" przypadnie przed trzema czwartymi odcinka. Bierze się to wprost
        z profilu wysokości Twojej trasy, tego samego, który{' '}
        <a href={faqHref('pl', 'what-the-chart-shows')}>napędza zapotrzebowanie na wykresie</a>.
      </p>
      <p style={articleTextStyle}>
        Poziomy idą co ćwiartkę: jadąc trzydzieści na godzinę i tak nie ocenisz bidonu dokładniej.
        Przy dwóch bidonach dostajesz w tym samym miejscu dwa osobne paski, bo pasek mieści jedną
        nazwę naraz. Na postoju, gdzie dolewasz oba i bierzesz żel, zapika kilka razy pod rząd.
      </p>
      <p style={articleTextStyle}>
        Plik zapisuje się w TCX, nie w GPX. Waypoint w GPX to pinezka na mapie — Garmin Connect
        kasuje takie punkty, gdy zamienia wgrany plik w kurs do nawigacji, i w trasie nic się nie
        odzywa. TCX ma do tego osobny typ punktu, course point, i to on wyzwala powiadomienie.
      </p>
      <p style={articleTextStyle}>
        Liczniki mają limit punktów kursu i wlicza się do niego każdy zakręt wygenerowany
        automatycznie. Edge mieści około dwustu, większość zegarków pięćdziesiąt. Eksport celuje w
        pięćdziesiąt: gdy plan wychodzi gęstszy, przerzedza pośrednie poziomy bidonów równomiernie
        po całej trasie, zamiast uciąć końcówkę. Jedzenia i postojów, które ustawiłeś sam, nie usuwa
        nigdy — jeśli tych jest więcej niż limit, plik wyjdzie ponad niego i resztę rozstrzygnie
        licznik.
      </p>
      <p style={articleSourcesStyle}>
        Źródła:{' '}
        <a
          href="https://support.garmin.com/en-US/?faq=aisqGZTLwH5LvbExSdO6L6"
          target="_blank"
          rel="noopener noreferrer"
        >
          Garmin
        </a>{' '}
        (course pointy i limity urządzeń);{' '}
        <a
          href="https://support.ridewithgps.com/hc/en-us/articles/4419007646235-Export-File-Formats"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ride with GPS
        </a>{' '}
        (obsługa formatów w licznikach).
      </p>
      <p>
        <a href={calculatorHref('pl')} style={articleLinkStyle}>
          Zbuduj plan i pobierz go na licznik →
        </a>
      </p>
    </FaqLayout>
  );
}
