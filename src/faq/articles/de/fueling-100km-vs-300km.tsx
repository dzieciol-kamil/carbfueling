import { faqHref, calculatorHref } from '../../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../../FaqLayout';

export default function Fueling100kmVs300kmDe() {
  return (
    <FaqLayout lang="de" slug="fueling-100km-vs-300km">
      <h1 style={articleH1Style}>
        Fueling bei 100 km vs. 300 km: was sich an der Strategie ändert
      </h1>
      <p style={articleTextStyle}>
        Eine 300-km-Strecke ist nicht einfach "100 km mal drei". Mit der Anzahl der Stunden im
        Sattel ändert sich, was dein Tempo tatsächlich limitiert — und ein Fueling-Plan, der für
        eine Distanz gut funktioniert, kann bei der anderen komplett versagen. Schauen wir, was sich
        konkret ändert.
      </p>
      <p style={articleTextStyle}>
        Bei einer kürzeren Ausfahrt — 2 bis 4 Stunden, also ungefähr das, was 100 km in moderatem
        Tempo dauern — ist die Hauptgrenze die{' '}
        <a href={faqHref('de', 'carb-transporter-mix')} style={articleLinkStyle}>
          Aufnahmeobergrenze
        </a>{' '}
        deines Darms. Egal wie viel du isst, dein Darm lässt nur eine bestimmte Menge Kohlenhydrate
        pro Stunde durch. Die gute Nachricht: Bei ein paar Stunden hat sich die Ermüdung des
        Verdauungssystems noch nicht aufgebaut, sodass die meisten Radfahrer die Zufuhr für die
        ganze Ausfahrt nahe der oberen Grenze ihres trainierten Bereichs halten können. Das
        Hauptrisiko ist simpel: zu früh die Kohlenhydrate ausgehen lassen, und die Beine spüren es
        auf den letzten Kilometern.
      </p>
      <p style={articleTextStyle}>
        Eine Ultra-Fahrt — 8 Stunden und mehr, das, wozu ein Tag mit 300-km-Strecke werden kann —
        ist eine andere Geschichte. Der Gesamtenergieverbrauch über den Tag ist enorm, aber die
        durchschnittliche Intensität sinkt natürlich, je länger du unterwegs bist. Niedrigere
        Intensität bedeutet, dass der Körper etwas weniger Kohlenhydrate pro Stunde braucht als
        vorher, was das reine Problem der Aufnahmeobergrenze etwas entschärft. Größer werden
        stattdessen andere Herausforderungen: Stunden ununterbrochenen Essens und Trinkens ermüden
        den Magen, und dasselbe Gel oder Getränk, das in der zweiten Stunde noch gut geschmeckt hat,
        kann in der achten Stunde kaum noch runtergehen. Dieses Phänomen wird manchmal
        Geschmacksermüdung genannt. Richtiges Essen und salzige Snacks —{' '}
        <a href={faqHref('de', 'rice-cake-bars')} style={articleLinkStyle}>
          Rice Cakes
        </a>
        , Sandwiches, salzige Leckereien — gewinnen deutlich an Bedeutung, einfach weil sie dem
        Gaumen eine Pause geben.
      </p>
      <p style={articleTextStyle}>
        Auch die Logistik skaliert anders. Eine 100-km-Ausfahrt lässt sich oft komplett aus eigenen
        Vorräten bestreiten — alles wird von Start an in Flaschen und Taschen mitgeführt, ohne
        irgendwo anhalten zu müssen. Bei 300 km klappt das meist nicht: niemand nimmt schon vom
        Start weg Essen und Trinken für 8 Stunden und mehr mit. Ultra-Fahrten basieren auf geplanter
        Versorgung, es lohnt sich also,{' '}
        <a href={faqHref('de', 'bottle-refill-planning')} style={articleLinkStyle}>
          Nachfüllpunkte im Voraus einzuplanen
        </a>{' '}
        statt auf einen zufälligen Laden unterwegs zu hoffen.
      </p>
      <p style={articleTextStyle}>
        Tempo und Ermüdung wirken zusammen auf dich, deshalb bildet eine einzige feste
        Kohlenhydratzahl pro Stunde das nicht ab. Wenn du gegen Ende einer langen Strecke langsamer
        wirst, sinkt der Kohlenhydratbedarf mit der Intensität — aber Ermüdung kann gleichzeitig den
        Appetit killen und die Verdauung verlangsamen.
      </p>
      <p style={articleTextStyle}>
        Bei wirklich langen Herausforderungen — Ultra-Rennen, Bikepacking-Etappen, die sich in die
        Nacht ziehen — kommen Schlaf und Dunkelheit als weitere Faktoren hinzu. Die Disziplin beim
        Essen und Trinken gerät leicht durcheinander, wenn du müde bist, und einen geplanten Snack
        übersieht man leicht, wenn man halb schlafend auf dem Rad sitzt. Es hilft, die
        Kohlenhydratdosierung für die Nachtstunden im Voraus festzulegen, statt darauf zu vertrauen,
        dass du selbst daran denkst, wenn du nur noch an Bett und Kissen denkst.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling lässt dich eine Strecke sowohl anhand der Fahrzeit als auch anhand von Strecke
        und Tempo planen, sodass dasselbe Tool sowohl für eine 3-Stunden-Ausfahrt als auch für eine
        ganztägige Ultra-Fahrt funktioniert — beschreibe einfach deine Belastung und bereite dich
        entsprechend auf das geplante Vorhaben vor.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Plane deine Strecke, kurz oder lang →
        </a>
      </p>
    </FaqLayout>
  );
}
