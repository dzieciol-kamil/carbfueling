import { calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function HydrationWaterPerHourPl() {
  return (
    <FaqLayout lang="pl" slug="hydration-water-per-hour">
      <h1 style={articleH1Style}>Ile wody na godzinę? Nawodnienie, temperatura i tempo pocenia</h1>
      <p style={articleTextStyle}>
        Nie ma jednej uniwersalnej liczby "pij X ml na godzinę", która pasuje do każdego rowerzysty.
        Tempo pocenia różni się między ludźmi ogromnie — od ok. 0,5 do ponad 2,5 litra na godzinę.
        Zależy od budowy ciała, poziomu wytrenowania i aklimatyzacji do upałów, temperatury i
        wilgotności powietrza oraz intensywności jazdy. Dwie osoby na tej samej trasie, w tym samym
        tempie, mogą tracić zupełnie inne ilości płynów.
      </p>
      <p style={articleTextStyle}>
        Klasyczny sposób na poznanie własnej liczby to prosty test z ważeniem. Zważ się tuż przed
        godziną jazdy w stałym, umiarkowanym tempie i zaraz po niej, nie pijąc nic w tym czasie (a
        jeśli jednak pijesz, odejmij wypitą ilość od wyniku). Ubytek masy ciała odpowiada mniej
        więcej ilości potu straconej w tę godzinę, bo utrata 1 kg wagi to w przybliżeniu 1 litr
        płynu. Zrób ten test w ciepły dzień i w chłodny — zobaczysz, jak bardzo ten wynik się
        zmienia.
      </p>
      <p style={articleTextStyle}>
        Temperatura i wilgotność podnoszą tempo pocenia niezależnie od siebie i robią to na różne
        sposoby. Wyższa temperatura po prostu zmusza organizm do produkcji większej ilości potu,
        żeby się chłodzić. Wilgotność sprawia, że ten pot mniej pomaga: chłodzenie zależy od
        odparowywania potu ze skóry, a w wilgotnym powietrzu odparowuje ono wolniej. Dlatego upalny
        i wilgotny dzień bywa cięższy niż upalny, ale suchy dzień przy tej samej temperaturze na
        termometrze — pocisz się tak samo intensywnie, ale ten pot chłodzi Cię dużo słabiej.
      </p>
      <p style={articleTextStyle}>
        To rodzi realny kompromis między nawodnieniem a stężeniem węglowodanów w bidonie. Jeśli
        mieszasz napój mocno, żeby trafić w wysoki cel węglowodanowy, ten sam bidon może pomieścić
        mniej czystego płynu. W upalny dzień taki skoncentrowany miks może nie dostarczyć
        wystarczającej ilości wody, by nadążyć za stratami potu. Wielu rowerzystów rozwiązuje to,
        wożąc w upalne dni dodatkowy bidon z samą wodą obok bidonu z węglowodanami, zamiast liczyć,
        że jeden bidon załatwi i nawodnienie, i paliwo.
      </p>
      <p style={articleTextStyle}>
        Nie trzeba na bieżąco uzupełniać każdego grama utraconego potu — niewielki deficyt płynów
        rozłożony na kilka godzin jest normalny i dobrze tolerowany. Problem zaczyna się, gdy ten
        deficyt zbytnio urośnie. Znaczne odwodnienie bezpośrednio pogarsza wyniki, a dodatkowo
        spowalnia opróżnianie żołądka, przez co węglowodany, które właśnie pijesz albo jesz,
        wchłaniają się wolniej dokładnie wtedy, gdy najbardziej ich potrzebujesz.
      </p>
      <p style={articleTextStyle}>
        Naturalną jednostką tego deficytu jest procent masy ciała — bo w takiej jednostce podają
        wyniki wszystkie badania, i bo ten sam litr znaczy zupełnie co innego dla 55-kilogramowej
        biegaczki niż dla 95-kilogramowego kolarza. Dla kolarza o masie 75 kg litr niedoboru to
        około 1,3% masy ciała. Mniej więcej do 2% dowody na wiarygodne pogorszenie wyników są słabe,
        a sam próg 2% jest przedmiotem realnego sporu: część zaślepionych badań nie znajduje przy
        2–3% żadnego efektu, inne znajdują przy tej samej liczbie wyraźny spadek. Traktuj to jako
        strefę ostrzegawczą, a nie klif.
      </p>
      <p style={articleTextStyle}>
        Ważniejsze od samej liczby są warunki, w jakich ją zbierasz. Sawka, Cheuvront i Kenefick
        (2015) pokazali, że koszt odwodnienia jest zaniedbywalny, dopóki temperatura skóry nie
        przekroczy około 27 °C — w ich zestawieniu literatury żadne badanie w chłodzie (2–10 °C) nie
        wykazało pogorszenia, a powyżej 25 °C wykazało je 8 z 9. Ten sam deficyt 2% kosztuje Cię
        prawie nic w chłodny dzień i kilka procent wyniku w prawdziwym upale. Dlatego Carb Fueling
        ocenia ten sam niedobór inaczej w zależności od ustawionej temperatury: przy 20 °C i mniej
        pasek zostaje zielony aż do 2,5% masy ciała, a przy 30 °C i więcej już tylko do 1,2%.
      </p>
      <p style={articleTextStyle}>
        Drugi koniec skali jest rzadszy, ale groźniejszy. Picie ponad straty potu rozcieńcza sód we
        krwi i prowadzi do hiponatremii wysiłkowej — jedynego ostrego zagrożenia w całej tej
        dziedzinie z udokumentowaną drogą do szpitala, i takiego, które dopada zwykle wolniejszych
        uczestników długich imprez, pijących na każdym punkcie „na zapas". Dlatego pasek nawodnienia
        robi się bordowy również przy nadmiarze: za wypicie więcej, niż tracisz, nie ma nagrody.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling bierze temperaturę ustawioną dla Twojej trasy oraz intensywność jazdy i na tej
        podstawie szacuje zapotrzebowanie na płyny w ml na godzinę razem z planem węglowodanowym —
        więc nie musisz zgadywać ani robić własnego testu z wagą w trakcie jazdy. Liczba w nawiasie
        obok strat potu to właśnie ten bilans: minus oznacza niedobór, plus — picie ponad to, co
        wypocisz.
      </p>
      <p>
        <a href={calculatorHref('pl')} style={articleLinkStyle}>
          Zaplanuj płyny i węglowodany razem →
        </a>
      </p>
    </FaqLayout>
  );
}
