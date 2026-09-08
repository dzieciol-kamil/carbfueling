import { faqHref, calculatorHref, assetHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function WhatTheChartShowsDe() {
  return (
    <FaqLayout lang="de" slug="what-the-chart-shows">
      <h1 style={articleH1Style}>
        Was das Diagramm eigentlich zeigt: von der Flasche in den Blutkreislauf
      </h1>
      <p style={articleTextStyle}>
        Jeder Punkt im Diagramm entspricht dem, was du an einer bestimmten Stelle der Strecke essen
        oder trinken willst. Ein Gel, ein Schluck Wasser oder Iso-Getränk aus der Flasche, eine
        Banane an einem Stopp. Das Diagramm erfasst das genau dort, wo es auf der Strecke passieren
        soll, nicht als eine einzige Summe für die gesamte Fahrt.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/intake-vessels.jpg')}
        alt="Flaschen- und Gel-Einträge in der Planliste von Carb Fueling, jeweils mit Inhalt und Menge beschriftet."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Essen und Trinken werden nicht in dem Moment zu nutzbarem Treibstoff, in dem sie deinen Mund
        erreichen. Sie landen zuerst in Magen und Darm, wo sie allmählich verdaut werden. Zwischen
        dem Essen von etwas und der Fähigkeit deines Körpers, es zu nutzen, vergeht echte Zeit. Das
        Diagramm zeigt diesen gesamten Prozess — Kohlenhydrate warten eine Weile im Magen, statt
        sofort nach dem Schlucken verfügbar zu werden.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/gut-strip.jpg')}
        alt="Der Magenfüllstand-Streifen oben im Diagramm, der sich beim Verdauen füllt und leert."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Egal wie viel du isst, dein Darm lässt pro Stunde nur eine begrenzte Menge Kohlenhydrate in
        den Blutkreislauf. Das ist die Aufnahmeobergrenze, und im Diagramm erscheint sie als
        waagerechte Begrenzungslinie. Bei einer guten Glukose-Fruktose-Mischung liegt diese
        Obergrenze für die meisten Fahrer bei ca. 90 g pro Stunde — sieh dir an,{' '}
        <a href={faqHref('de', 'carb-transporter-mix')} style={articleLinkStyle}>
          warum diese Obergrenze existiert und wie das Mischen von Zuckerarten sie anhebt
        </a>
        . Mehr zu essen als die Obergrenze bringt nichts — der Überschuss bleibt einfach länger im
        Magen liegen.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/absorption-cap.jpg')}
        alt="Die flache, gestrichelte Linie der Aufnahmegrenze über den ansteigenden Linien für Bedarf und Aufgenommenes."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Die gestrichelte Linie „Bedarf" ist die Nachfrageseite. Sie zeigt, wie viele Kohlenhydrate
        die Strecke zu einer bestimmten Stunde von dir verlangt, abhängig von der
        Belastungsintensität — fährst du einen steilen Anstieg hoch, steigt die Linie, rollst du auf
        der anderen Seite hinunter, fällt sie.
      </p>
      <p style={articleTextStyle}>
        Ihr gegenüber steht „aufgenommen": wie viele Kohlenhydrate der Körper tatsächlich
        aufgenommen hat und nutzen kann, begrenzt gleichzeitig durch zwei Dinge — wie viel du
        gegessen hast, und die Aufnahmeobergrenze. Selbst ein gut versorgter Fahrer bringt die Linie
        der aufgenommenen Kohlenhydrate nicht über die Obergrenze hinaus. Beide Linien (Bedarf und
        Aufgenommenes) Stunde für Stunde nebeneinander zu beobachten, ist der Kern des Lesens dieses
        Diagramms.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/need-absorbed.jpg')}
        alt="Bedarfs- und Aufnahmelinien zusammen, mit der schattierten Lücke dazwischen, die das Defizit zeigt."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Wenn das Aufgenommene auf einem Streckenabschnitt unter den Bedarf fällt, wird diese Lücke
        als Defizit markiert. Genau hier baut sich still das Risiko eines Hungerasts auf — nicht in
        einem dramatischen Moment, sondern Minute für Minute, Kilometer für Kilometer. Sieh dir an,{' '}
        <a href={faqHref('de', 'bonk-crisis')} style={articleLinkStyle}>
          was passiert, wenn diese Lücke zu lange anhält
        </a>{' '}
        — wie so ein kleines, ignoriertes Defizit zu einer echten Krise auf dem Rad wird.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/deficit.jpg')}
        alt="Nahaufnahme der schattierten Defizitlücke zwischen den Bedarfs- und Aufnahmelinien am Anfang der Strecke."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Flüssigkeit funktioniert genau gleich, mit ihrem eigenen Linienpaar: getrunkene Flüssigkeit
        gegen Schweißverlust — du verfolgst es auf dieselbe Weise, nur für die Flüssigkeitszufuhr
        statt für Kohlenhydrate.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/fluid-lines.png')}
        alt="Linien für aufgenommene Flüssigkeit und Schweißverlust in der Flüssigkeitsansicht des Diagramms."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Diesen gesamten Prozess direkt sichtbar zu machen, statt einer einzigen Zahl, ist der
        eigentliche Sinn dieses Diagramms. Es verwandelt die Frage „Habe ich heute genug gegessen?",
        die du sonst erst nach der Fahrt beantwortest, in etwas, das du im Voraus siehst — Stunden
        im Voraus — und noch korrigieren kannst.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Sieh dir deine eigene Versorgungslinie an →
        </a>
      </p>
    </FaqLayout>
  );
}
