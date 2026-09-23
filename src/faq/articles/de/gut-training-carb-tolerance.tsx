import { calculatorHref, faqHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function GutTrainingCarbToleranceDe() {
  return (
    <FaqLayout lang="de" slug="gut-training-carb-tolerance">
      <h1 style={articleH1Style}>
        Darmtraining: wie du deine Kohlenhydrattoleranz sicher steigerst
      </h1>
      <p style={articleTextStyle}>
        Die Fähigkeit deines Darms, während der Belastung Kohlenhydrate aufzunehmen, ist nicht fest
        — man kann sie trainieren, ähnlich wie einen Muskel. Regelmäßige Kohlenhydratzufuhr im
        Training bringt deinem Darm bei, Zucker schneller zu transportieren, bei weniger Blähungen
        und geringerem Krampfrisiko. Diese Anpassung braucht allerdings Wochen systematischer Arbeit
        — man kann sie nicht am Morgen vor dem Start einfach „einschalten", indem man mehr trinkt.
      </p>
      <p style={articleTextStyle}>
        Am sichersten baust du Toleranz schrittweise auf. Starte deutlich unter deinem Zieltempo —
        für die meisten Radfahrer ist ca. 30 g Kohlenhydrate pro Stunde ein vernünftiger
        Ausgangspunkt. Steigere die Dosis dann langsam, um etwa 5-10 g pro Stunde alle ein bis zwei
        Wochen, und gib deinem Darm bei jedem Schritt Zeit zur Anpassung, bevor du weiter hochgehst.
        Radfahrer, die ohne diesen Anlauf direkt auf{' '}
        <a href={faqHref('de', 'carb-transporter-mix')} style={articleLinkStyle}>
          ca. 90 g/h
        </a>{' '}
        umsteigen, bekommen statt zusätzlicher Energie häufiger Bauchschmerzen, Blähungen oder
        Durchfall.
      </p>
      <p style={articleTextStyle}>
        Übe bei der Intensität und über die Distanz, die dich am Start erwarten, nicht nur bei
        lockeren Ausfahrten. Darmkomfort bei entspanntem Tempo sagt nichts darüber aus, wie er unter
        harter Belastung reagiert. Mit steigender Intensität lenkt der Körper mehr Blut zu den
        arbeitenden Muskeln und weniger zum Verdauungssystem, sodass dieselbe Kohlenhydratmenge
        gegen Ende eines harten Rennens viel schwerer aufzunehmen sein kann als bei einer ruhigen
        Trainingsfahrt.
      </p>
      <p style={articleTextStyle}>
        Trainiere auch mit genau den Produkten und dem Mix (dem Maltodextrin-Fruktose-Verhältnis),
        die du beim Wettkampf verwenden willst. Ein Gel oder Getränk, das im Training gut vertragen
        wird, muss nicht das sein, das du tatsächlich am Start benutzt — und ein Wechsel von Produkt
        oder Mischung in letzter Minute macht den Sinn der gesamten vorherigen Darmgewöhnung
        zunichte.
      </p>
      <p style={articleTextStyle}>
        Geschmacksermüdung ist ebenfalls ein reales Problem — ein Geschmack, der nach einer Stunde
        großartig schmeckt, kann nach drei oder vier Stunden schwer zu schlucken sein, deshalb lohnt
        es sich, das gerade bei langen Trainingsfahrten zu testen. Du kannst über Abwechslung im
        Geschmack nachdenken, z. B.{' '}
        <a href={faqHref('de', 'diy-flavor-additives')} style={articleLinkStyle}>
          durch den Wechsel der Geschmackszusätze
        </a>
        , oder etwas Neutrales mitnehmen, z. B.{' '}
        <a href={faqHref('de', 'rice-cake-bars')} style={articleLinkStyle}>
          Rice Cakes
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        Bevor du die Kohlenhydrate selbst dafür verantwortlich machst, lohnt es sich, ein paar
        häufige Ursachen für Magen-Darm-Probleme auszuschließen. Zu stark konzentrierte Flaschen
        erhöhen die Osmolalität des Getränks, was Wasser in den Darm zieht und Krämpfe auslösen
        kann. Viel Fett, Ballaststoffe oder Eiweiß kurz vor oder während intensiver Belastung
        verlangsamen die Verdauung und konkurrieren um denselben begrenzten Blutfluss. Dehydrierung
        verschlechtert die Kohlenhydrataufnahme zusätzlich. Und einfach mehr Kohlenhydrate pro
        Stunde aufzunehmen, als dein Darm aktuell trainiert hat, verursacht Probleme, egal wie gut
        das Produkt zusammengesetzt ist.
      </p>
      <p style={articleTextStyle}>
        Kennst du bereits dein aktuelles, trainiertes Limit, plane damit statt zu raten. Carb
        Fueling zeigt deine Aufnahmeobergrenze live an, während du das Mischungsverhältnis in
        Flasche und Gel einstellst — passe es an das an, was dein Darm tatsächlich trainiert hat,
        und baue dann einen Zeitplan, der innerhalb dieses Limits bleibt, statt am Renntag zu
        übertreiben. Eine Einschränkung: Unabhängig vom eingestellten Verhältnis überschreitet die
        Aufnahmeobergrenze in Carb Fueling nie ca. 92 g/h. Das ist eine bewusste, sichere
        Standardgrenze, keine harte physiologische Grenze — wenige, sehr gut trainierte Därme können
        sie überschreiten — aber für die überwiegende Mehrheit der Radfahrer ist das eine
        vernünftige Grenze.
      </p>
      <p style={articleSourcesStyle}>
        Quellen:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/20466803/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Cox et al., J Appl Physiol 2010
        </a>{' '}
        (28 Tage Training mit hoher Kohlenhydratverfügbarkeit steigerten die exogene
        Kohlenhydratoxidation und die Zeitfahrleistung um ca. 6 %).
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Prüfe deine Aufnahmeobergrenze →
        </a>
      </p>
    </FaqLayout>
  );
}
