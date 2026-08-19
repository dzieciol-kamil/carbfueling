import { faqHref, calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function MaltoFructoseBlendPl() {
  return (
    <FaqLayout lang="pl">
      <h1 style={articleH1Style}>
        Malto + fruktoza: dlaczego mieszanka transportowa działa lepiej niż sama glukoza
      </h1>
      <p style={articleTextStyle}>
        Maltodekstryna brzmi jak coś wyjątkowego, ale to po prostu łańcuch cząsteczek glukozy
        połączonych ze sobą. Jelito rozkłada ten łańcuch niemal od razu, więc do ściany jelita
        dociera już zwykła glukoza. Określenie "węglowodan złożony" jest jak najbardziej trafne, ale
        nie zmienia to, którym transporterem ta glukoza wchodzi do krwi.
      </p>
      <p style={articleTextStyle}>
        Tym transporterem jest SGLT1, a jego wydajność jest z góry ograniczona — ok. 60 g na
        godzinę, niezależnie od tego, w jakiej postaci glukozę wypijesz. Mechanizm tego ograniczenia
        i to, jak drugi transporter potrafi je podnieść, opisaliśmy dokładniej w{' '}
        <a href={faqHref('pl', 'carb-transporter-mix')} style={articleLinkStyle}>
          artykule o mieszance transporterów glukoza/fruktoza
        </a>
        . W skrócie: czysta maltodekstryna, obojętnie jak ją zadozujesz, i tak zatrzyma się na
        poziomie ok. 60 g/h.
      </p>
      <p style={articleTextStyle}>
        Dlatego większość dzisiejszych żeli i napojów węglowodanowych to już nie sama
        maltodekstryna. Producenci dodają do niej fruktozę wprost albo sięgają po składniki, które
        mają ją naturalnie w sobie — sacharozę (w połowie złożoną z fruktozy) czy miód. Fruktoza
        korzysta z osobnego transportera, GLUT5, więc jej dodatek otwiera drugą bramkę, którą
        węglowodany mogą jednocześnie wchodzić do krwi.
      </p>
      <p style={articleTextStyle}>
        Proporcja między nimi ma znaczenie. Dobry punkt wyjścia to ok. 2 części węglowodanu
        glukozowego na 1 część fruktozy wagowo — ten sam domyślny miks "Izo", który znajdziesz w tej
        aplikacji. Taka proporcja wykorzystuje niemal całą przepustowość SGLT1, a jednocześnie
        dodaje na tyle dużo fruktozy, żeby w pełni zapracował też GLUT5.
      </p>
      <p style={articleTextStyle}>
        Przesada w drugą stronę też ma swoją cenę. GLUT5 ma niższy sufit niż SGLT1, więc jeśli
        fruktozy w mieszance jest za dużo, część z niej nie zdąży się wchłonąć na czas. Ta
        nadmiarowa fruktoza zostaje w jelicie i zaczyna fermentować — to częsta przyczyna wzdęć,
        gazów i skurczów żołądka na długich trasach.
      </p>
      <p style={articleTextStyle}>
        Dlatego warto zaglądać do składu żelu czy proszku, a nie tylko na hasła na opakowaniu.
        "Węglowodany złożone" albo "energia o powolnym uwalnianiu" na froncie nic nie mówią o tym,
        czy w środku jest sama maltodekstryna, czy mieszanka maltodekstryny z fruktozą — a to
        właśnie ta różnica decyduje, ile faktycznie wchłoniesz w ciągu godziny.
      </p>
      <p>
        <a href={calculatorHref('pl')} style={articleLinkStyle}>
          Ułóż miks glukozowo-fruktozowy pod swój cel godzinowy →
        </a>
      </p>
    </FaqLayout>
  );
}
