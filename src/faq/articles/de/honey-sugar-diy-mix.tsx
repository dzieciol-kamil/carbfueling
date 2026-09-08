import { faqHref, calculatorHref } from '../../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../../FaqLayout';

export default function HoneySugarDiyMixDe() {
  return (
    <FaqLayout lang="de" slug="honey-sugar-diy-mix">
      <h1 style={articleH1Style}>
        Honig oder Haushaltszucker statt fertigem Pulver — funktioniert das genauso gut?
      </h1>
      <p style={articleTextStyle}>
        In den meisten Fällen ja — es funktioniert fast identisch. Normaler Zucker (Saccharose) und
        Honig liefern dem Darm beide eine Mischung aus Glukose und Fruktose, genau das, was ein
        fertiges Iso-Getränk erreichen will. Das ist derselbe Mechanismus, den wir im Artikel{' '}
        <a href={faqHref('de', 'carb-transporter-mix')} style={articleLinkStyle}>
          warum du nicht mehr als ca. 90 g Kohlenhydrate pro Stunde aufnehmen kannst
        </a>{' '}
        erklären: dein Darm hat zwei getrennte "Türen" für Zucker, und beide gleichzeitig zu nutzen
        hebt deine Aufnahmeobergrenze an.
      </p>
      <p style={articleTextStyle}>
        Haushaltszucker ist ein Molekül namens Saccharose, zusammengesetzt aus einer Glukose- und
        einer Fruktoseeinheit, die miteinander verbunden sind. Ein Enzym im Darm namens Saccharase
        spaltet diese Bindung fast sofort auf und setzt freie Glukose und freie Fruktose im
        Verhältnis von etwa 1:1 frei. Auch wenn Saccharose auf dem Etikett wie "einfach nur Zucker"
        aussieht, macht dein Körper daraus also dieselbe Glukose-Fruktose-Kombination, aus der ein
        Sportgetränk aufgebaut ist.
      </p>
      <p style={articleTextStyle}>
        Honig ist chemisch etwas anders. Er besteht größtenteils schon aus freier Glukose und
        Fruktose, nicht aneinandergebunden wie bei Saccharose. Das genaue Verhältnis variiert je
        nach Blütenquelle etwas, liegt aber meist nahe am effektiven 1:1-Verhältnis von Zucker, nur
        leicht zur Fruktose hin verschoben. Das ist nah genug, dass sich Honig bei der Aufnahme
        ähnlich wie Haushaltszucker verhält.
      </p>
      <p style={articleTextStyle}>
        Vergleiche das mit reinem Maltodextrin- oder Dextrose-(Glukose-)Pulver, das manche Radfahrer
        in Wasser rühren und für eine einfache, billige Energiequelle halten. Das öffnet nur die
        Glukose-Tür. Egal wie viel du davon trinkst, du bleibst bei rund 60 g pro Stunde gedeckelt,
        und der Rest an Zucker liegt einfach im Magen. Ein selbstgemachter Mix aus Zucker oder Honig
        hat hier sogar einen Vorteil: Er öffnet beide Türen gleichzeitig, genau wie ein fertiger
        Zwei-Kohlenhydrat-Mix.
      </p>
      <p style={articleTextStyle}>
        Was du bei einem selbstgemachten Mix aufgibst, sind Bequemlichkeit und Dosiergenauigkeit.
        Ein abgemessener Messlöffel aus einem Markenprodukt liefert jedes Mal die gleiche Menge;
        Zucker oder Honig von Hand abzuwiegen, verrutscht leichter mal ein wenig. Fertige Mixe sind
        außerdem meist auf Osmolalität getestet — also wie konzentriert die Lösung ist —, sodass
        keine zusätzliche Wassermenge in den Darm gezogen werden muss, um sie aufzunehmen. Ein zu
        stark konzentrierter selbstgemachter Mix kann genau die Blähungen und Krämpfe auslösen, die
        du vermeiden willst, also halte die Konzentration moderat und teste sie im Training, bevor
        du dich bei einem langen Rennen darauf verlässt.
      </p>
      <p style={articleTextStyle}>
        Nichts davon macht einen selbstgemachten Mix zu einer schlechteren Wahl. Für viele Radfahrer
        ist er eine echte, deutlich günstigere Alternative — eine andere Ausgangsbasis, kein
        schwächeres Ergebnis. Deshalb findest du im Mix-Tool von Carb Fueling auch fertige Presets
        für "Zucker" und "Honig" neben dem Standard-Glukose-Fruktose-Verhältnis, sodass du mit
        derselben Aufnahme-Mathematik um beide Optionen herum planen kannst.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Probiere die Zucker- und Honig-Presets aus →
        </a>
      </p>
    </FaqLayout>
  );
}
