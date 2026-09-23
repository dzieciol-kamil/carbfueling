import { faqHref, calculatorHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function CarbsPerHourByIntensityDe() {
  return (
    <FaqLayout lang="de" slug="carbs-per-hour-by-intensity">
      <h1 style={articleH1Style}>Wie viele Kohlenhydrate pro Stunde brauchst du wirklich?</h1>
      <p style={articleTextStyle}>
        Es gibt keine einzige richtige Zahl an Gramm pro Stunde. Die passende Menge hängt vor allem
        davon ab, wie lange und wie intensiv du fährst. Im Folgenden findest du einen praktischen
        Bereich für die meisten Radfahrer. Denk daran: Das ist nur ein Ausgangspunkt, den du an dein
        eigenes Gefühl anpasst.
      </p>
      <p style={articleTextStyle}>
        Bei einer lockeren Ausfahrt unter einer Stunde spielen Kohlenhydrate praktisch keine Rolle.
        Die Glykogenspeicher — der in Muskeln und Leber gespeicherte Zucker — reichen für diese
        Belastung völlig aus, deshalb ist Flüssigkeitszufuhr hier wichtiger als Kohlenhydratzufuhr.
      </p>
      <p style={articleTextStyle}>
        Wenn die Fahrt auf 1–2,5 Stunden anwächst, fangen Kohlenhydrate an, wirklich Sinn zu
        ergeben. Ein nützlicher Bereich ist meist 30–60 g pro Stunde. Es geht hier vor allem darum,
        die Glykogenspeicher zu schonen und die Leistungsqualität im späteren Teil der Fahrt zu
        erhalten, nicht darum, jede verbrannte Kalorie zu ersetzen.
      </p>
      <p style={articleTextStyle}>
        Über ca. 2,5–3 Stunden, besonders bei mittlerem bis hohem Tempo, lohnt es sich, die Zufuhr
        auf 60–90 g pro Stunde zu erhöhen. Ein so hohes Niveau lässt sich sinnvoll nur mit einer
        Glukose-Fruktose-Mischung erreichen — eine einzelne Zuckerart, z. B. Glukose oder
        Maltodextrin, sättigt normalerweise bei ca. 60 g pro Stunde, egal wie viel du davon trinkst.
        Siehe{' '}
        <a href={faqHref('de', 'carb-transporter-mix')} style={articleLinkStyle}>
          warum diese Obergrenze existiert und wie eine Glukose-Fruktose-Mischung sie anhebt
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        Die Intensität bestimmt, wie dringend du dich der oberen Grenze des Aufnahmebereichs nähern
        musst. Eine ruhige, lange Ausfahrt erlaubt es oft, auch nach vielen Stunden näher an der
        unteren Grenze zu bleiben, weil Glykogen langsamer verbraucht wird. Eine harte Belastung
        oder Renntempo verbrennt Glykogen deutlich schneller und verlangt bei gleicher Zeit eine
        höhere Kohlenhydratzufuhr.
      </p>
      <p style={articleTextStyle}>
        Eine einfache Methode, die Intensität ohne Leistungsmesser oder Pulsgurt einzuschätzen, ist
        die Frage: Kannst du noch reden? Niedrig bedeutet, du unterhältst dich locker in ganzen
        Sätzen. Mittel bedeutet, du redest, aber nur in kurzen Sätzen. Hoch bedeutet, du kannst kaum
        sprechen, konzentriert auf deine Atmung. Diese Skala verwendet auch die
        Intensitätseinstellung in Carb Fueling.
      </p>
      <p style={articleTextStyle}>
        Körpergewicht und Trainingszustand verschieben die genaue Zahl ebenfalls — größere Fahrer
        oder Fahrer mit trainiertem Darm können oft mehr Kohlenhydrate pro Stunde aufnehmen und
        nutzen, als diese Spanne nahelegt. Betrachte 30–90 g/h als Ausgangspunkt zum Feinabstimmen
        im Training, nicht als für alle gleiches Ziel. Das von Carb Fueling berechnete Ziel hängt
        nur von Fahrzeit und Intensität ab, nicht von deinem Gewicht — bist du ein größerer Fahrer,
        ziel eher auf die obere Grenze des angegebenen Bereichs.
      </p>
      <p style={articleTextStyle}>
        Statt sich auf eine starre Regel zu verlassen, berechnet Carb Fueling das für deine konkrete
        Route — anhand von Fahrzeit und Intensität ermittelt es deinen tatsächlichen
        Kohlenhydratbedarf pro Stunde.
      </p>
      <p style={articleSourcesStyle}>
        Quellen:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/24791914/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Jeukendrup, Sports Med 2014
        </a>{' '}
        (die 30/60/90-g/h-Richtwerte nach Belastungsdauer).
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Berechne dein Stundenziel →
        </a>
      </p>
    </FaqLayout>
  );
}
