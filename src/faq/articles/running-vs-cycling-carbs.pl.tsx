import { faqHref, calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function RunningVsCyclingCarbsPl() {
  return (
    <FaqLayout lang="pl" slug="running-vs-cycling-carbs">
      <h1 style={articleH1Style}>
        Bieganie vs rower: czym naprawdę różni się zapotrzebowanie i wchłanianie węglowodanów
      </h1>
      <p style={articleTextStyle}>
        Biegacze często zakładają, że ich jelito gorzej radzi sobie z węglowodanami niż jelito
        rowerzysty. Badania mówią coś bardziej precyzyjnego: mechanizm wchłaniania faktycznie nie
        zmienia się między tymi dwoma sportami. Zmienia się to, ile obciążenia dostaje w tym samym
        czasie — i dlatego te same liczby na papierze mogą wyglądać zupełnie inaczej w praktyce, na
        nogach.
      </p>
      <p style={articleTextStyle}>
        Zacznijmy od tego, co się nie zmienia. Badania porównujące bezpośrednio utlenianie
        węglowodanów egzogennych podczas biegania i jazdy na rowerze przy podobnej intensywności nie
        wykazały istotnej różnicy w tym, ile węglowodanów na godzinę organizm faktycznie przetwarza.
        Sufit wchłaniania jelita — wyznaczany przez transportery cukru w ścianie jelita, opisany w
        artykule o tym,{' '}
        <a href={faqHref('pl', 'carb-transporter-mix')} style={articleLinkStyle}>
          dlaczego nie wchłoniesz więcej niż ok. 90 g węglowodanów na godzinę
        </a>{' '}
        — to cecha Twojego jelita, nie sportu, który akurat uprawiasz.
      </p>
      <p style={articleTextStyle}>
        Dlaczego więc bieganie tak często wypada gorzej? Bo zdolność wchłaniania i komfort to nie to
        samo. Bieganie dokłada obciążenie mechaniczne, którego nie ma na rowerze: każde uderzenie
        stopy o podłoże wstrząsa żołądkiem i podnosi ciśnienie w jamie brzusznej w sposób, jakiego
        pedałowanie nigdy nie wywoła. To dodatkowe wstrząsanie — w połączeniu z odpływem krwi od
        jelita, jaki wywołuje każdy ciężki wysiłek, opisanym w artykule o tym,{' '}
        <a href={faqHref('pl', 'pace-power-absorption')} style={articleLinkStyle}>
          czy tempo lub moc wpływają na to, ile możesz wchłonąć
        </a>{' '}
        — wystarczy, by żołądek, który na rowerze byłby w porządku, na biegu zaczął sprawiać realne
        problemy.
      </p>
      <p style={articleTextStyle}>
        Liczby to potwierdzają. Badania zawodów ultra pokazują dolegliwości żołądkowo-jelitowe u
        70-85% biegaczy podczas wieloetapowych lub 24-godzinnych startów. Porównywalne badania
        rowerzystów nie wykazały żadnego związku między tym, co jedli lub pili, a wystąpieniem
        objawów żołądkowych. Ten sam fueling, podobna intensywność, zupełnie inny wynik — bo sam
        sport jest częścią obciążenia, nie tylko wysiłek.
      </p>
      <p style={articleTextStyle}>
        Praktyczny wniosek nie brzmi "jedz mniej, bo Twoje jelito jest słabsze". Brzmi raczej "jedz
        z mniejszym marginesem błędu, bo ten sam plan gram w gram ma mniej miejsca, żeby coś poszło
        nie tak". Widełki węglowodanów na godzinę wg intensywności i czasu trwania z artykułu{' '}
        <a href={faqHref('pl', 'carbs-per-hour-by-intensity')} style={articleLinkStyle}>
          ile węglowodanów na godzinę naprawdę potrzebujesz
        </a>{' '}
        powstały z myślą o rowerze; przy tym samym czasie i intensywności na biegu sensowniej
        celować w dolną granicę tego zakresu albo nieco niżej, niż w górną.
      </p>
      <p style={articleTextStyle}>
        To też powód, dla którego trening jelita nie przenosi się idealnie między sportami. Żołądek,
        który spokojnie znosi 80 g/h na rowerze, w ogóle nie był testowany pod kątem wstrząsów przy
        bieganiu — bodziec mechaniczny po prostu nie występuje w takim treningu. Zobacz{' '}
        <a href={faqHref('pl', 'gut-training-carb-tolerance')} style={articleLinkStyle}>
          trening jelita
        </a>{' '}
        po ogólne podejście; w przypadku biegania progresja musi odbywać się na bieganiu, a nie
        tylko na rowerze, zanim zaufasz liczbie w dniu startu.
      </p>
      <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--muted)', marginBottom: 16 }}>
        Źródła:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/21049089/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Pfeiffer i wsp., Med Sci Sports Exerc 2011
        </a>{' '}
        (utlenianie węglowodanów, bieganie vs rower);{' '}
        <a
          href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4701764/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Costa i wsp., Sports Med Open 2016
        </a>{' '}
        (objawy żołądkowo-jelitowe u biegaczy ultra);{' '}
        <a
          href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11753326/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Eur J Appl Physiol 2024
        </a>{' '}
        (objawy żołądkowo-jelitowe i odżywianie na nieprofesjonalnym wyścigu kolarskim).
      </p>
      <p>
        <a href={calculatorHref('pl')} style={articleLinkStyle}>
          Zaplanuj swoje spożycie węglowodanów →
        </a>
      </p>
    </FaqLayout>
  );
}
