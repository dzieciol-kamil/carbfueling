import { faqHref, calculatorHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function PacePowerAbsorptionDe() {
  return (
    <FaqLayout lang="de" slug="pace-power-absorption">
      <h1 style={articleH1Style}>
        Beeinflussen Tempo oder Leistung, wie viel du aufnehmen kannst?
      </h1>
      <p style={articleTextStyle}>
        Man verwechselt leicht zwei verschiedene Dinge: wie viele Kohlenhydrate deine Anstrengung
        verbrennt und wie viele Kohlenhydrate dein Darm aufnehmen kann. Das ist nicht dasselbe, und
        diese beiden Werte steigen nicht gemeinsam. Der Bedarf — wie viele Kohlenhydrate pro Stunde
        dein Körper braucht — steigt direkt proportional zur Fahrintensität. Die Aufnahme — wie
        viele Kohlenhydrate pro Stunde dein Darm tatsächlich verarbeitet — hängt hauptsächlich von
        einem ganz anderen Mechanismus ab und skaliert nicht auf die gleiche Weise.
      </p>
      <p style={articleTextStyle}>
        Die Intensitätseinstellung in Carb Fueling (niedrig, mittel, hoch) verändert genau die
        Bedarfsseite — sie schätzt, wie viele Kohlenhydrate pro Stunde du bei einem bestimmten Tempo
        auf einer bestimmten Strecke verbrennst. Das ist aber nur die halbe Wahrheit. Die andere
        Hälfte ist die Aufnahmeobergrenze deines Darms — ein eigenständiges Limit, das von den
        Zuckertransportern in der Darmwand bestimmt wird, beschrieben im Artikel darüber,{' '}
        <a href={faqHref('de', 'carb-transporter-mix')} style={articleLinkStyle}>
          warum du nicht mehr als ca. 90 g Kohlenhydrate pro Stunde aufnehmen kannst
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        Und hier kommt die Überraschung: In der Praxis bleibt diese Aufnahmeobergrenze über den
        größten Teil des Intensitätsbereichs, in dem du tatsächlich fährst, ungefähr konstant. Egal
        ob du locker rollst oder ein solides Tempo fährst — dein Darm lässt weiterhin ca. 60 g/h aus
        einer einzelnen Kohlenhydratquelle durch, oder bis zu ca. 90 g/h bei einer guten
        Glukose-Fruktose-Mischung. Härteres Fahren erhöht deinen Bedarf. Es erhöht nicht
        automatisch, wie viel du aufnehmen kannst.
      </p>
      <p style={articleTextStyle}>
        Das ändert sich erst am äußersten Rand der Belastungsskala. Oberhalb von etwa 80-90% der
        maximalen Anstrengung — harte Sprints oder ein Rennen an der Schwelle oder darüber — leitet
        der Körper Blut vom Darm weg, hin zu den arbeitenden Muskeln und der Haut. Weniger Blut im
        Darm bedeutet langsamere Magenentleerung und langsamere Aufnahme. Bei wirklich maximaler
        Anstrengung kann deine Obergrenze genau dann sinken, wenn der Bedarf am höchsten ist. Diese
        Diskrepanz ist ein wesentlicher Grund dafür, dass sehr harte Belastungen so oft in
        Magenproblemen enden.
      </p>
      <p style={articleTextStyle}>
        Die meisten Ausdauerfahrten — locker, moderat bis stark intensiv, über mehrere Stunden —
        erreichen diese extreme Zone nie. Deshalb kannst du bei ihnen gefahrlos davon ausgehen, dass
        deine trainierte Aufnahmeobergrenze über die gesamte Strecke hält. Die eigentlichen
        Schwierigkeiten beginnen bei einem Rennen mit sehr hoher, lange gehaltener Intensität — und
        dabei geht es nicht nur um den höheren Bedarf. Deine Fähigkeit, Kohlenhydrate aufzunehmen,
        kann dann genau im ungünstigsten Moment schrumpfen.
      </p>
      <p style={articleTextStyle}>
        Das ist einer der Gründe, warum{' '}
        <a href={faqHref('de', 'gut-training-carb-tolerance')} style={articleLinkStyle}>
          Darmtraining
        </a>{' '}
        auch Einheiten bei renn-naher Intensität enthalten sollte, nicht nur lockere Ausfahrten. Wie
        gut du Kohlenhydrate bei lockerem Tempo verträgst, sagt wenig darüber aus, wie du sie in
        einem harten Rennen verträgst. Die Wahrheit zeigt erst ein Test bei der Intensität, mit der
        du tatsächlich an den Start gehst.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling zeigt beide Größen nebeneinander: Die Intensitätseinstellung bestimmt den
        Kohlenhydratbedarf, und das Mischungsverhältnis legt die Obergrenze fest, wie viel du
        aufnehmen kannst. Wenn du beide zusammen siehst, erkennst du sofort, wann ein Plan mehr von
        deinem Darm verlangt, als er liefern kann.
      </p>
      <p style={articleSourcesStyle}>
        Quellen:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/28589631/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Costa et al., Aliment Pharmacol Ther 2017
        </a>{' '}
        (systematische Übersichtsarbeit: bei hoher Belastungsintensität wird Blut vom Darm
        weggeleitet, was die Magenentleerung und die Aufnahme verlangsamt).
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Sieh dir Bedarf und Obergrenze gemeinsam an →
        </a>
      </p>
    </FaqLayout>
  );
}
