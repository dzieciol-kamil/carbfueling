import { faqHref, calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function HeatCarbPlanPl() {
  return (
    <FaqLayout lang="pl" slug="heat-carb-plan">
      <h1 style={articleH1Style}>
        Jak upał zmienia Twój plan węglowodanowy (to nie tylko "pij więcej")
      </h1>
      <p style={articleTextStyle}>
        Upał zwiększa tempo pocenia, ale to nie wszystko — dodatkowo obciąża organizm próbą
        utrzymania temperatury ciała. Żeby się schłodzić, organizm kieruje więcej krwi do skóry. Ta
        krew musi skądś pochodzić, a jednym z miejsc, z których jest "pożyczana", jest jelito. To
        normalna, zdrowa reakcja — ale ma efekt uboczny, który ma znaczenie przy planowaniu
        odżywiania.
      </p>
      <p style={articleTextStyle}>
        Przy mniejszym przepływie krwi przez jelito trawienie zwalnia. Badania nad wysiłkiem w upale
        pokazują, że opróżnianie żołądka i wchłanianie węglowodanów mogą wyraźnie spadać, gdy
        temperatura ciała rośnie, a organizm stawia chłodzenie na pierwszym miejscu. Upał nie
        sprawia więc tylko, że pocisz się bardziej — sprawia też, że jelito bywa nieco mniej wydajne
        w przetwarzaniu tego, co do niego trafia.
      </p>
      <p style={articleTextStyle}>
        Dlatego rada "po prostu pij więcej" jest niepełna. Jeśli zdolność jelita do wchłaniania jest
        już nieco ograniczona przez stres cieplny, dodatkowy płyn to dobry kierunek — ale
        utrzymywanie tego samego mocnego stężenia węglowodanów przy większej ilości płynu może się
        odbić czkawką. Efektem bywają wzdęcia, mdłości albo skurcze żołądka, a nie lepsze zasilanie.
      </p>
      <p style={articleTextStyle}>
        Lepszym podejściem na upalne wyjazdy jest lekkie rozcieńczenie bidonów. Zapotrzebowanie na
        płyny mocno rośnie w upale, więc jeśli zostawisz to samo stężenie węglowodanów w bidonie, w
        praktyce wciskasz do jelita więcej cukru, a jelito ma akurat mniej krwi do pracy.
        Rozcieńczenie utrzymuje stężenie bliżej tego, co jelito jest w stanie spokojnie obsłużyć, a
        jednocześnie pokrywa wyższe zapotrzebowanie na płyny.
      </p>
      <p style={articleTextStyle}>
        Warto też w upalne dni stawiać na płynne źródła węglowodanów o niższej osmolalności zamiast
        gęstych żeli. Żel to skoncentrowana dawka, którą jelito musi dopiero rozcieńczyć własnymi
        rezerwami płynów, a dobrze wymieszany bidon jest już na łagodniejszym stężeniu. Nie
        zapominaj też o sodzie — wraz z tempem pocenia w upale rośnie też utrata sodu, więc razem z
        zapotrzebowaniem na płyny rośnie zapotrzebowanie na elektrolity (więcej o tym w{' '}
        <a href={faqHref('pl', 'sodium-electrolytes-cycling')} style={articleLinkStyle}>
          naszym artykule o sodzie i elektrolitach
        </a>
        ).
      </p>
      <p style={articleTextStyle}>
        Znaczenie ma też aklimatyzacja do upału. Rowerzyści, którzy trenują w gorących warunkach
        przez jeden do dwóch tygodni, adaptują się: pocą się wydajniej, a ich jelito zwykle lepiej
        znosi stres cieplny podczas wysiłku. Ktoś, kto jeździ w upale od początku lata, poradzi
        sobie z gorącym dniem zupełnie inaczej niż ktoś, kto trafia na pierwszą falę upałów w
        sezonie — dlatego plan powinien uwzględniać Twoją realną aklimatyzację, a nie tylko
        temperaturę z prognozy.
      </p>
      <p style={articleTextStyle}>
        To nie oznacza, że przy zwykłym ciepłym dniu trzeba przebudowywać cały plan odżywiania. Ma
        to znaczenie głównie przy naprawdę upalnych, długich wyjazdach, gdzie kompromis między
        płynami a tolerancją jelita zaczyna realnie doskwierać. Carb Fueling przyjmuje temperaturę
        na trasie jako dane wejściowe i odpowiednio koryguje szacowane zapotrzebowanie na płyny,
        więc planując upalny wyjazd, widzisz kompromis płyny-węglowodany wprost, zamiast zgadywać.
      </p>
      <p>
        <a href={calculatorHref('pl')} style={articleLinkStyle}>
          Zaplanuj swój następny upalny wyjazd →
        </a>
      </p>
    </FaqLayout>
  );
}
