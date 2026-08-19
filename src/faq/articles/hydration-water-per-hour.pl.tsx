import { calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function HydrationWaterPerHourPl() {
  return (
    <FaqLayout lang="pl">
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
        Carb Fueling bierze temperaturę ustawioną dla Twojej trasy oraz intensywność jazdy i na tej
        podstawie szacuje zapotrzebowanie na płyny w ml na godzinę razem z planem węglowodanowym —
        więc nie musisz zgadywać ani robić własnego testu z wagą w trakcie jazdy.
      </p>
      <p>
        <a href={calculatorHref('pl')} style={articleLinkStyle}>
          Zaplanuj płyny i węglowodany razem →
        </a>
      </p>
    </FaqLayout>
  );
}
