import { faqHref, calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function Fueling100kmVs300kmPl() {
  return (
    <FaqLayout lang="pl" slug="fueling-100km-vs-300km">
      <h1 style={articleH1Style}>Fueling na 100 km vs. 300 km: co się zmienia w strategii</h1>
      <p style={articleTextStyle}>
        Trasa 300 km to nie jest po prostu "100 km razy trzy". Wraz z liczbą godzin na siodełku
        zmienia się to, co faktycznie ogranicza Twoje tempo — a plan fuelingu dobry na jeden dystans
        potrafi zupełnie zawieść na drugim. Zobaczmy, co konkretnie się zmienia.
      </p>
      <p style={articleTextStyle}>
        Na krótszym wyjeździe — 2-4 godziny, czyli mniej więcej tyle, ile zajmuje 100 km w
        umiarkowanym tempie — głównym ograniczeniem jest{' '}
        <a href={faqHref('pl', 'carb-transporter-mix')} style={articleLinkStyle}>
          sufit wchłaniania
        </a>{' '}
        jelita. Niezależnie od tego, ile zjesz, jelito przepuści tylko określoną liczbę gramów
        węglowodanów na godzinę. Dobra wiadomość jest taka, że przy kilku godzinach zmęczenie układu
        pokarmowego jeszcze się nie kumuluje, więc większość rowerzystów może utrzymać podaż blisko
        górnej granicy swojego wytrenowanego zakresu przez cały wyjazd. Główne ryzyko jest proste:
        zabraknie węglowodanów za wcześnie i nogi odczują to na ostatnich kilometrach.
      </p>
      <p style={articleTextStyle}>
        Jazda ultra — 8 godzin i więcej, czyli to, w co potrafi się zamienić dzień na 300 km — to
        już inna historia. Całkowity wydatek energetyczny w ciągu dnia jest ogromny, ale średnia
        intensywność naturalnie spada, im dłużej jesteś w trasie. Niższa intensywność oznacza, że
        organizm potrzebuje trochę mniej węglowodanów na godzinę niż wcześniej, co nieco odciąża
        problem samego sufitu wchłaniania. Większym wyzwaniem stają się za to inne rzeczy: godziny
        ciągłego jedzenia i picia męczą żołądek, a ten sam żel czy napój, który smakował dobrze w
        drugiej godzinie, w ósmej potrafi być nie do przełknięcia. To zjawisko czasem nazywa się
        zmęczeniem smakowym. Prawdziwe jedzenie i słone przekąski — ciastka ryżowe, kanapki, słone
        smakołyki — zaczynają mieć dużo większe znaczenie, po prostu dlatego, że dają podniebieniu
        odpocząć.
      </p>
      <p style={articleTextStyle}>
        Logistyka też skaluje się inaczej. Wyjazd na 100 km często da się zrobić w pełni z własnych
        zapasów — wszystko wozisz w bidonach i kieszeniach od startu i nigdzie nie musisz się
        zatrzymywać. Przy 300 km to zwykle się nie uda: nikt nie zabiera ze sobą jedzenia i picia na
        8 i więcej godzin już na pierwszym obrocie pedałów. Jazdy ultra opierają się na zaplanowanym
        zaopatrzeniu, więc warto{' '}
        <a href={faqHref('pl', 'bottle-refill-planning')} style={articleLinkStyle}>
          rozpisać sobie punkty uzupełniania
        </a>{' '}
        z wyprzedzeniem, zamiast liczyć na przypadkowy sklep po drodze.
      </p>
      <p style={articleTextStyle}>
        Tempo i zmęczenie działają na Ciebie razem, dlatego jedna stała liczba gramów węglowodanów
        na godzinę tego nie odda. Kiedy w końcówce długiej trasy zwalniasz, zapotrzebowanie na
        węglowodany spada wraz z intensywnością — ale zmęczenie potrafi w tym samym czasie zabić
        apetyt i spowolnić trawienie. Dobry plan musi reagować w obie strony: obniżać cel, gdy
        jedziesz wolniej, ale też rozpoznać moment, w którym organizm po prostu nie ma ochoty jeść,
        i dostosować się do tego, zamiast trzymać się sztywnej liczby.
      </p>
      <p style={articleTextStyle}>
        Przy naprawdę długich wyzwaniach — zawodach ultra, bikepackingach ciągnących się po nocach —
        dochodzi jeszcze sen i ciemność. Dyscyplina jedzenia i picia łatwo się rozjeżdża, gdy jesteś
        zmęczony, a zaplanowaną przekąskę łatwo przegapić, gdy na rowerze jedziesz w połowie śpiąc.
        Warto rozpisać fueling na nocne godziny z wyprzedzeniem, zamiast liczyć na to, że sam sobie
        o nim przypomnisz.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling pozwala zaplanować trasę zarówno na podstawie czasu jazdy, jak i trasy z
        tempem, więc to samo narzędzie sprawdzi się i przy 3-godzinnej przejażdżce, i przy
        całodniowej jeździe ultra — wystarczy opisać swój wysiłek i odpowiednio przygotować się do
        zaplanowanego wysiłku.
      </p>
      <p>
        <a href={calculatorHref('pl')} style={articleLinkStyle}>
          Zaplanuj swoją trasę, krótką czy długą →
        </a>
      </p>
    </FaqLayout>
  );
}
