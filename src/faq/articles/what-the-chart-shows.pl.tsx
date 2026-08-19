import { faqHref, calculatorHref, assetHref } from '../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../FaqLayout';

export default function WhatTheChartShowsPl() {
  return (
    <FaqLayout lang="pl">
      <h1 style={articleH1Style}>Co właściwie pokazuje wykres: od bidonu do krwiobiegu</h1>
      <p style={articleTextStyle}>
        Każdy punkt na wykresie zaczyna się od jednego prostego faktu: co faktycznie zjadłeś albo
        wypiłeś w danym miejscu trasy. To jest spożycie — surowy wsad do całej reszty. Żel, łyk z
        bidonu, banan na przystanku. Wykres zapisuje to dokładnie tam, gdzie się wydarzyło na
        trasie, a nie jako jedną sumę dla całej jazdy.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/intake-vessels.jpg')}
        alt="Wpisy bidonu i żelu na liście planu w Carb Fueling, każdy z opisaną zawartością i ilością."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Jedzenie i picie nie zamieniają się w paliwo w chwili, gdy trafiają do ust. Najpierw lądują
        w żołądku i jelicie, gdzie trawią się stopniowo. Między zjedzeniem czegoś a możliwością
        wykorzystania tego przez organizm mija realny czas. Wykres pokazuje to uczciwie —
        węglowodany chwilę czekają w żołądku, zamiast stawać się dostępne od razu po przełknięciu.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/gut-strip.jpg')}
        alt="Pasek zawartości żołądka na górze wykresu, który wypełnia się i opróżnia w miarę trawienia."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Bez względu na to, ile zjesz, Twoje jelito wpuści do krwiobiegu tylko ograniczoną ilość
        węglowodanów na godzinę. To jest sufit wchłaniania i na wykresie widać go jako poziomą linię
        ograniczenia. Przy dobrej mieszance glukozowo-fruktozowej ten sufit dla większości
        rowerzystów wynosi ok. 90 g na godzinę — zobacz,{' '}
        <a href={faqHref('pl', 'carb-transporter-mix')}>
          dlaczego ten sufit istnieje i jak mieszanie cukrów go podnosi
        </a>
        . Zjedzenie więcej niż wynosi sufit nic nie daje — nadmiar po prostu dłużej zalega w
        żołądku.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/absorption-cap.jpg')}
        alt="Płaska, przerywana linia limitu wchłaniania nad rosnącymi liniami zapotrzebowania i wchłoniętych."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Przerywana linia "zapotrzebowanie" to strona popytu. Pokazuje, ile węglowodanów wymaga od
        Ciebie trasa w danej godzinie, zależnie od intensywności wysiłku — wjedź na stromy podjazd,
        a linia rośnie, zjedź z drugiej strony, a spada.
      </p>
      <p style={articleTextStyle}>
        Naprzeciw niej stoi "wchłonięte": ile węglowodanów organizm faktycznie przyjął i może
        wykorzystać, ograniczone jednocześnie dwiema rzeczami — tym, ile zjadłeś, i sufitem w
        chłaniania. Nawet dobrze odżywiony rowerzysta nie przesunie linii wchłoniętych ponad sufit.
        Obserwowanie obu tych linii obok siebie, godzina po godzinie, to sedno czytania tego
        wykresu.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/need-absorbed.jpg')}
        alt="Linie zapotrzebowania i wchłoniętych razem, z zacieniowaną luką między nimi pokazującą niedobór."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Gdy wchłonięte spadają poniżej zapotrzebowania na jakimś odcinku trasy, ta luka zaznaczana
        jest jako niedobór. Właśnie tu po cichu narasta ryzyko złapania bomby — nie w jednym
        dramatycznym momencie, tylko minuta po minucie, kilometr po kilometrze. Zobacz,{' '}
        <a href={faqHref('pl', 'bonk-crisis')}>co się dzieje, gdy taka luka trwa zbyt długo</a> —
        tak mały, zignorowany niedobór zamienia się w realny kryzys na rowerze.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/deficit.jpg')}
        alt="Zbliżenie na zacieniowaną lukę niedoboru między liniami zapotrzebowania i wchłoniętych na początku trasy."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Płyny działają dokładnie tak samo, na swojej własnej parze linii: wypite płyny kontra utrata
        z potem — śledzisz to dokładnie tak samo, tylko dla nawodnienia zamiast węglowodanów. A
        jeśli wolisz sprawdzać sumy zamiast tempa na godzinę, wykres ma też skumulowane wersje tych
        linii — "od startu trasy" — dzięki czemu widzisz, czy trzymasz tempo na całej trasie, a nie
        tylko w jednym jej punkcie.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/fluid-lines.png')}
        alt="Linie wypitych płynów i utraty z potem w widoku nawodnienia na wykresie."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Pokazanie tego całego procesu wprost, zamiast jednej liczby, to właściwy sens tego wykresu.
        Zamienia pytanie "Czy dziś zjadłem wystarczająco?", na które odpowiadasz dopiero po jeździe,
        w coś, co widzisz z wyprzedzeniem — godziny naprzód — i możesz jeszcze naprawić.
      </p>
      <p>
        <a href={calculatorHref('pl')} style={articleLinkStyle}>
          Zobacz swoją linię odżywiania →
        </a>
      </p>
    </FaqLayout>
  );
}
