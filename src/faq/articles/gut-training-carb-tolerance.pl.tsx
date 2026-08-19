import { calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function GutTrainingCarbTolerancePl() {
  return (
    <FaqLayout lang="pl">
      <h1 style={articleH1Style}>
        Trening jelita: jak bezpiecznie zwiększać tolerancję na węglowodany
      </h1>
      <p style={articleTextStyle}>
        Zdolność jelita do wchłaniania węglowodanów podczas wysiłku nie jest stała — można ją
        wytrenować, podobnie jak mięsień. Regularne przyjmowanie węglowodanów na treningach uczy
        jelito szybszego transportu cukru, przy mniejszym wzdęciu i mniejszym ryzyku skurczów. Ta
        adaptacja wymaga jednak tygodni systematycznej pracy — nie da się jej "włączyć" rano przed
        startem, po prostu pijąc więcej.
      </p>
      <p style={articleTextStyle}>
        Najbezpieczniej budować tolerancję stopniowo. Zacznij wyraźnie poniżej docelowego tempa —
        dla większości rowerzystów rozsądnym punktem startowym jest ok. 30 g węglowodanów na
        godzinę. Potem zwiększaj dawkę powoli, o mniej więcej 5-10 g na godzinę co tydzień lub dwa,
        dając jelitu czas na adaptację przy każdym kroku, zanim pójdziesz wyżej. Rowerzyści, którzy
        od razu przechodzą na 90 g/h bez takiego rozpędzania się, zamiast dodatkowej energii
        częściej dostają bóle brzucha, wzdęcia albo biegunkę.
      </p>
      <p style={articleTextStyle}>
        Ćwicz przy intensywności i na dystansie zbliżonym do tego, co czeka Cię na starcie, a nie
        tylko na spokojnych wyjazdach. Komfort jelita przy luźnym tempie nic nie mówi o tym, jak
        zniesie ono ciężki wysiłek. Wraz ze wzrostem intensywności organizm kieruje więcej krwi do
        pracujących mięśni, a mniej do układu trawiennego, więc ta sama dawka węglowodanów pod
        koniec ciężkiego wyścigu może być dużo trudniejsza do wchłonięcia niż podczas spokojnej
        jazdy treningowej.
      </p>
      <p style={articleTextStyle}>
        Trenuj też z dokładnie tymi produktami i tym miksem, których planujesz użyć na zawodach. Żel
        czy napój, który dobrze leży na treningu, niekoniecznie musi być tym, którego faktycznie
        użyjesz na starcie — a zmiana produktu w ostatniej chwili niweczy sens całego wcześniejszego
        przyzwyczajania jelita. Zmęczenie smakiem to też realny problem — smak, który po godzinie
        smakuje świetnie, po trzech czy czterech godzinach może być trudny do przełknięcia, więc
        warto to sprawdzić właśnie na długich treningach.
      </p>
      <p style={articleTextStyle}>
        Zanim obwinisz same węglowodany, warto wykluczyć kilka częstych przyczyn problemów
        żołądkowo-jelitowych. Zbyt stężone bidony podnoszą osmolalność napoju, co ściąga wodę do
        jelita i może wywołać skurcze. Duża ilość tłuszczu, błonnika czy białka tuż przed lub w
        trakcie intensywnego wysiłku spowalnia trawienie i konkuruje o ten sam, ograniczony przepływ
        krwi. Odwodnienie dodatkowo pogarsza wchłanianie węglowodanów. A samo przyjmowanie więcej
        węglowodanów na godzinę, niż aktualnie wytrenowało Twoje jelito, spowoduje problemy
        niezależnie od tego, jak dobrze skomponowany jest produkt.
      </p>
      <p style={articleTextStyle}>
        Kiedy znasz już swój aktualny, wytrenowany limit, planuj wokół niego zamiast zgadywać. Carb
        Fueling pokazuje Twój sufit wchłaniania na bieżąco, gdy ustawiasz proporcję miksu w bidonie
        i żelu — dopasuj ją do tego, co faktycznie przećwiczyło Twoje jelito, a potem zbuduj
        harmonogram fuelingu, który mieści się w tym limicie, zamiast przesadzać w dniu startu.
        Jedno zastrzeżenie: niezależnie od ustawionej proporcji, sufit wchłaniania w Carb Fueling
        nie przekroczy ok. 92 g/h. To świadomy, bezpieczny domyślny próg, a nie twardy fizjologiczny
        sufit — nieliczne, bardzo dobrze wytrenowane jelita mogą go przekroczyć — ale dla
        zdecydowanej większości rowerzystów jest to rozsądna granica.
      </p>
      <p>
        <a href={calculatorHref('pl')} style={articleLinkStyle}>
          Sprawdź swój sufit wchłaniania →
        </a>
      </p>
    </FaqLayout>
  );
}
