import { faqHref, calculatorHref } from '../../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../../FaqLayout';

export default function BottleVsGelDe() {
  return (
    <FaqLayout lang="de" slug="bottle-vs-gel">
      <h1 style={articleH1Style}>Flasche oder Gel? Wann was wählen</h1>
      <p style={articleTextStyle}>
        Kohlenhydrate können auf verschiedene Arten zu dir kommen: gelöst in der Flasche,
        konzentriert im Gel oder gegessen als normale Nahrung. Jede Form hat einen echten Trade-off.
        Ein guter Fueling-Plan besteht nicht darin, eine Form für das ganze Rennen zu wählen,
        sondern die Form an den jeweiligen Moment anzupassen.
      </p>
      <p style={articleTextStyle}>
        Die Flasche lässt sich am einfachsten fortlaufend trinken. Du nippst in deinem eigenen
        Tempo, und jeder Schluck liefert gleichzeitig Kohlenhydrate und Flüssigkeit — sehr praktisch
        bei Hitze, wenn du ohnehin beides brauchst. Das Problem: eine Flasche hat eine
        Konzentration. Einmal gemischt, kannst du sie unterwegs nicht mehr ändern, und ist sie leer,
        braucht das Nachfüllen einen Plan — einen Laden oder einen Versorgungspunkt. Die Logistik
        dazu beschreiben wir separat im Artikel über{' '}
        <a href={faqHref('de', 'bottle-refill-planning')} style={articleLinkStyle}>
          das Planen von Flaschen-Nachfüllungen
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        Gels lösen das Platzproblem. Ein einzelnes Sachet ist klein und energetisch dicht, sodass du
        mehrere Stunden Kohlenhydrate in der Trikottasche unterbringst, fast ohne Gewicht und
        Volumen. Die Dosierung ist präzise — jedes Sachet hat eine bekannte, feste Menge
        Kohlenhydrate, du musst also nicht raten, wie viel du gerade zu dir genommen hast. Der
        Nachteil: ein Gel ist konzentriert. Pur gegessen, ohne Wasser hinterher, kann es schwer im
        Magen liegen oder schneller durch den Darm gehen, als dir lieb ist. Die meisten Gels
        funktionieren am besten mit Wasser danach. Und nach jedem Sachet bleibt eine Verpackung
        übrig, die du irgendwo verstauen musst, bis du sie entsorgen kannst.
      </p>
      <p style={articleTextStyle}>
        Feste Nahrung wird bei der Planung oft vergessen, dabei funktioniert sie hervorragend auf
        längeren, ruhigeren Abschnitten. Kauen und langsamere Verdauung stören nicht, wenn die
        Intensität niedrig genug ist — und richtiges Essen bringt Geschmack und Textur, die reine
        süße Gels und Iso-Getränk nicht bieten können. Auf sehr langen Distanzen ist diese
        Abwechslung sehr wichtig, weil sie den süßen Geschmack im Mund "zurücksetzt" und dir
        erlaubt, weiter Kohlenhydrate aufzunehmen, selbst wenn du keine Lust mehr auf Süßes hast.
        Das Problem können Intensität und Gelände sein — es ist schwer zu kauen und zu schlucken,
        wenn du hart fährst, und auf technischem, holprigem Terrain, wo beide Hände am Lenker
        gebraucht werden, wird jedes Essen unbequem.
      </p>
      <p style={articleTextStyle}>
        In der Praxis wählen die meisten Radfahrer nicht eine Form für das ganze Rennen, sondern
        kombinieren sie. Die Flasche ist die Basis, das stetige Fundament, die ganze Zeit über
        getrunken. Das Gel ist der schnelle Nachschub vor einem harten Moment — einem langen Anstieg
        oder einem Antritt —, wenn du schnell Kohlenhydrate liefern willst, ohne zum Trinken aus der
        Flasche aus dem Rhythmus zu kommen. Feste Nahrung füllt die ruhigen, gleichmäßigen
        Abschnitte, wo Kauen nichts kostet und ein Geschmackswechsel hilft, das nächste Gel wieder
        runterzubekommen.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling lässt dich alle drei Formen gleichzeitig planen. Füge deinem Plan eine
        Kohlenhydrat-Flasche, ein Gel oder eine Banane hinzu, und die App zeigt dir, ob diese
        Kombination deinen stündlichen Kohlenhydratbedarf tatsächlich deckt — Stunde für Stunde,
        nicht nur als Summe für die ganze Strecke.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Baue einen Plan, der Flasche, Gel und Essen kombiniert →
        </a>
      </p>
    </FaqLayout>
  );
}
