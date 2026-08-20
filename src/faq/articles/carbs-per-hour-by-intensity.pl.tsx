import { faqHref, calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function CarbsPerHourByIntensityPl() {
  return (
    <FaqLayout lang="pl" slug="carbs-per-hour-by-intensity">
      <h1 style={articleH1Style}>Ile węglowodanów na godzinę naprawdę potrzebujesz?</h1>
      <p style={articleTextStyle}>
        Nie ma jednej słusznej liczby gramów na godzinę. Odpowiednia ilość zależy przede wszystkim
        od tego, jak długo jedziesz i z jaką intensywnością. Poniżej znajdziesz praktyczny przedział
        dla większości rowerzystów. Pamiętaj, to tylko punkt wyjścia, który dostosujesz do własnego
        samopoczucia.
      </p>
      <p style={articleTextStyle}>
        Przy spokojnym wyjeździe krótszym niż godzina węglowodany właściwie nie mają znaczenia.
        Zapasy glikogenu — cukru zmagazynowanego w mięśniach i wątrobie — w zupełności wystarczają
        na taki wysiłek same w sobie, więc ważniejsze jest wtedy nawodnienie niż dostarczanie
        węglowodanów. Jeśli jednak jedziesz ostro, a nie spokojnie — interwały, krótki wyścig,
        szybki wspólny przejazd — Carb Fueling i tak zasugeruje podaż zależną od intensywności, w
        tym samym zakresie co kolejny przedział niżej: nawet krótki, intensywny wysiłek może
        skorzystać na uzupełnieniu poziomu cukru we krwi, nie tylko na oszczędzaniu glikogenu
        mięśniowego.
      </p>
      <p style={articleTextStyle}>
        Gdy wyjazd wydłuża się do 1–2,5 godziny, węglowodany zaczynają mieć realny sens. Przydatny
        zakres to zwykle 30–60 g na godzinę. Chodzi tu głównie o oszczędzanie zapasów glikogenu i
        utrzymanie jakości wysiłku w dalszej części trasy, a nie o pokrycie każdej spalonej kalorii.
      </p>
      <p style={articleTextStyle}>
        Powyżej ok. 2,5–3 godzin, zwłaszcza przy tempie umiarkowanym do wysokiego, warto podnieść
        podaż do 60–90 g na godzinę. Tak wysoki poziom sensownie osiągnąć tylko przy mieszance
        glukozowo-fruktozowej — sam jeden rodzaj cukru, np. glukoza czy maltodekstryna, zwykle
        wysyca się przy ok. 60 g na godzinę, niezależnie od tego, ile go wypijesz. Zobacz{' '}
        <a href={faqHref('pl', 'carb-transporter-mix')} style={articleLinkStyle}>
          dlaczego istnieje ten sufit i jak podnosi go mieszanka glukozowo-fruktozowa
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        Intensywność decyduje o tym, jak pilnie musisz zbliżać się do górnej granicy tego zakresu.
        Spokojny, długi wyjazd często pozwala trzymać się bliżej dolnej granicy nawet po wielu
        godzinach, bo glikogen zużywa się wolniej. Ostry wysiłek albo tempo wyścigowe spala glikogen
        znacznie szybciej i przy tym samym czasie jazdy premiuje wyższą podaż węglowodanów.
      </p>
      <p style={articleTextStyle}>
        Prosty sposób na ocenę intensywności bez pomiaru mocy czy tętna: czy jeszcze rozmawiasz?
        Niska oznacza, że swobodnie rozmawiasz pełnymi zdaniami. Średnia — że rozmawiasz, ale
        pojedynczymi zdaniami. Wysoka — że ledwo mówisz, skupiony na oddechu. Tej samej skali używa
        ustawienie intensywności w Carb Fueling.
      </p>
      <p style={articleTextStyle}>
        Masa ciała i stopień wytrenowania też przesuwają dokładną liczbę — więksi rowerzyści albo
        osoby z wytrenowanym jelitem często są w stanie przyjąć i wykorzystać więcej węglowodanów na
        godzinę, niż sugerują te widełki. Traktuj 30–90 g/h jako punkt startowy do dopracowania na
        treningach, a nie cel jednakowy dla każdego. Cel wyliczany przez Carb Fueling zależy tylko
        od czasu jazdy i intensywności, nie od Twojej wagi — jeśli jesteś większym rowerzystą, celuj
        bliżej górnej granicy podanego zakresu.
      </p>
      <p style={articleTextStyle}>
        Zamiast opierać się na sztywnej regule, Carb Fueling liczy to dla Twojej konkretnej trasy —
        na podstawie czasu jazdy i intensywności wylicza Twoje rzeczywiste zapotrzebowanie na
        węglowodany w ciągu godziny.
      </p>
      <p>
        <a href={calculatorHref('pl')} style={articleLinkStyle}>
          Wylicz swój cel na godzinę →
        </a>
      </p>
    </FaqLayout>
  );
}
