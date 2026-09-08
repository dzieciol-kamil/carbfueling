import { faqHref, calculatorHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function MaltoFructoseBlendDe() {
  return (
    <FaqLayout lang="de" slug="malto-fructose-blend">
      <h1 style={articleH1Style}>
        Malto + Fruktose: warum eine Transporter-Mischung besser wirkt als Glukose allein
      </h1>
      <p style={articleTextStyle}>
        Maltodextrin klingt nach etwas Besonderem, ist aber einfach eine Kette aneinandergereihter
        Glukosemoleküle. Dein Darm spaltet diese Kette fast sofort auf, sodass an der Darmwand schon
        ganz normale Glukose ankommt. Die Bezeichnung „komplexes Kohlenhydrat" ist durchaus
        zutreffend, ändert aber nichts daran, über welchen Transporter diese Glukose ins Blut
        gelangt.
      </p>
      <p style={articleTextStyle}>
        Dieser Transporter heißt SGLT1, und seine Kapazität ist von vornherein begrenzt — auf ca. 60
        g pro Stunde, egal in welcher Form du die Glukose trinkst. Den Mechanismus dieser Grenze —
        und wie ein zweiter Transporter sie anheben kann — beschreiben wir genauer im{' '}
        <a href={faqHref('de', 'carb-transporter-mix')} style={articleLinkStyle}>
          Artikel über die Glukose/Fruktose-Transporter-Mischung
        </a>
        . Kurz gesagt: reines Maltodextrin bleibt, egal wie du es dosierst, bei ca. 60 g/h stehen.
      </p>
      <p style={articleTextStyle}>
        Deshalb bestehen die meisten heutigen Gele und Getränkemischungen nicht mehr nur aus
        Maltodextrin. Hersteller fügen Fruktose direkt hinzu oder greifen auf Zutaten zurück, die
        sie von Natur aus enthalten — Saccharose (zur Hälfte aus Fruktose) oder Honig. Fruktose
        nutzt einen eigenen Transporter, GLUT5, ihre Zugabe öffnet also ein zweites Tor, durch das
        Kohlenhydrate gleichzeitig ins Blut gelangen können.
      </p>
      <p style={articleTextStyle}>
        Das Verhältnis zwischen beiden spielt eine Rolle. Ein guter Ausgangspunkt sind ca. 2 Teile
        glukosebasiertes Kohlenhydrat auf 1 Teil Fruktose nach Gewicht — derselbe
        Standard-„Izo"-Mix, den du in dieser App findest. Dieses Verhältnis nutzt fast die gesamte
        Kapazität von SGLT1 und fügt gleichzeitig genug Fruktose hinzu, damit auch GLUT5 voll
        ausgelastet wird.
      </p>
      <p style={articleTextStyle}>
        Auch die Übertreibung in die andere Richtung hat ihren Preis. GLUT5 hat eine niedrigere
        Obergrenze als SGLT1 — enthält der Mix also zu viel Fruktose, wird ein Teil davon nicht
        rechtzeitig aufgenommen. Diese überschüssige Fruktose bleibt im Darm und beginnt zu gären —
        eine häufige Ursache für Blähungen, Gase und Magenkrämpfe auf langen Fahrten.
      </p>
      <p style={articleTextStyle}>
        Deshalb lohnt es sich, die Zutatenliste eines Gels oder Pulvers zu lesen und nicht nur die
        Werbeaussagen auf der Verpackung. Begriffe wie „komplexe Kohlenhydrate" oder „langsam
        freigesetzte Energie" auf der Verpackung sagen nicht, ob drin reines Maltodextrin oder eine
        Maltodextrin-Fruktose-Mischung steckt — und genau dieser Unterschied entscheidet, wie viel
        du tatsächlich pro Stunde aufnimmst.
      </p>
      <p style={articleSourcesStyle}>
        Quellen:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/20574242/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Jeukendrup, Curr Opin Clin Nutr Metab Care 2010
        </a>{' '}
        (SGLT1-Obergrenze ca. 60 g/h, kombinierte Obergrenze bei Glukose-Fruktose-Mischung höher).
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Stell einen Glukose-Fruktose-Mix für dein Stundenziel zusammen →
        </a>
      </p>
    </FaqLayout>
  );
}
