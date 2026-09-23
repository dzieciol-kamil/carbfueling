import { calculatorHref, faqHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function HydrationWaterPerHourDe() {
  return (
    <FaqLayout lang="de" slug="hydration-water-per-hour">
      <h1 style={articleH1Style}>Wie viel Wasser pro Stunde? Flüssigkeit, Hitze und Schweißrate</h1>
      <p style={articleTextStyle}>
        Es gibt keine einzige "trink X ml pro Stunde"-Zahl, die für jeden Radfahrer passt. Die
        Schweißrate unterscheidet sich zwischen Menschen enorm — grob 0,5 bis 2,5 Liter pro Stunde,
        manchmal mehr. Sie hängt von deiner Körpergröße, deiner Fitness und Hitzeakklimatisierung,
        von Lufttemperatur und Luftfeuchtigkeit sowie davon ab, wie hart du fährst. Zwei Fahrer auf
        derselben Strecke, im selben Tempo, können völlig unterschiedliche Flüssigkeitsmengen
        verlieren.
      </p>
      <p style={articleTextStyle}>
        Der klassische Weg, deine eigene Zahl zu finden, ist ein einfacher Wiegetest. Wiege dich
        direkt vor einer Stunde im gleichmäßigen Tempo und direkt danach, ohne in dieser Zeit etwas
        zu trinken (trinkst du doch, ziehe die getrunkene Menge vom Ergebnis ab). Der
        Gewichtsverlust entspricht ungefähr deinem Schweißverlust in dieser Stunde, da 1 kg
        Körpergewicht in etwa 1 Liter Flüssigkeit entspricht. Mach diesen Test an einem warmen und
        an einem kühlen Tag, und du wirst sehen, wie stark sich die Zahl verschiebt.
      </p>
      <p style={articleTextStyle}>
        Temperatur und Luftfeuchtigkeit treiben deine Schweißrate beide nach oben, aber auf
        unterschiedliche Weise. Höhere Temperatur zwingt den Körper einfach dazu, mehr Schweiß zur
        Kühlung zu produzieren. Luftfeuchtigkeit macht diesen Schweiß weniger nützlich: Kühlung
        hängt davon ab, dass Schweiß von der Haut verdunstet, und in feuchter Luft verdunstet er
        langsamer. Deshalb kann ein heißer, feuchter Tag schwerer zu bewältigen sein als ein heißer,
        trockener Tag bei derselben Thermometeranzeige — dein Körper schwitzt stark, bekommt davon
        aber deutlich weniger Kühleffekt.
      </p>
      <p style={articleTextStyle}>
        Das erzeugt einen echten Zielkonflikt mit deinem Kohlenhydratmix. Wenn du deine Flasche
        stark mischst, um ein hohes Kohlenhydratziel zu treffen, kann dieselbe Flasche weniger reine
        Flüssigkeit fassen. An einem heißen Tag liefert so ein konzentrierter Mix möglicherweise
        nicht genug Wasser, um mit den Schweißverlusten mitzuhalten. Viele Radfahrer lösen das,
        indem sie an heißen Tagen zusätzlich zur Kohlenhydrat-Flasche eine reine Wasserflasche
        mitnehmen, statt zu erwarten, dass eine Flasche sowohl Flüssigkeit als auch Energie abdeckt.
      </p>
      <p style={articleTextStyle}>
        Du musst nicht jedes Gramm Schweißverlust in Echtzeit ausgleichen — ein kleines
        Flüssigkeitsdefizit über ein paar Stunden ist normal und wird gut toleriert. Das Problem
        entsteht, wenn dieses Defizit zu groß wird. Deutliche Dehydration schadet der Leistung
        direkt, und sie verlangsamt zusätzlich die Magenentleerung, wodurch die Kohlenhydrate, die
        du gerade trinkst oder isst, langsamer aufgenommen werden — genau dann, wenn du sie am
        dringendsten brauchst.
      </p>
      <p style={articleTextStyle}>
        Die natürliche Einheit für dieses Defizit ist Prozent der Körpermasse, weil in dieser
        Einheit jede Studie ihre Ergebnisse angibt — und weil derselbe Liter für eine 55 kg schwere
        Läuferin etwas ganz anderes bedeutet als für einen 95 kg schweren Radfahrer. Für einen
        75-kg-Radfahrer entspricht ein Liter Defizit etwa 1,3% der Körpermasse. Bis etwa 2% ist die
        Evidenz für einen verlässlichen Leistungsverlust schwach, und die 2%-Schwelle selbst ist
        tatsächlich umstritten: einige verblindete Studien finden bei 2–3% keinen Effekt, andere
        finden bei derselben Zahl einen klaren Abfall. Behandle das als weiche Warnzone, nicht als
        Klippe.
      </p>
      <p style={articleTextStyle}>
        Wichtiger als die Zahl selbst sind die Bedingungen, unter denen du sie misst. Sawka,
        Cheuvront und Kenefick (2015) fanden, dass die Kosten eines Defizits vernachlässigbar sind,
        solange die Hauttemperatur nicht etwa 27 °C übersteigt — in ihrer Literaturübersicht zeigte
        keine Studie in der Kälte (2–10 °C) eine Beeinträchtigung, während es oberhalb von 25 °C 8
        von 9 taten. Dasselbe 2%-Defizit kostet dich an einem kalten Tag fast nichts und bei echter
        Hitze mehrere Prozent Leistung. Deshalb bewertet Carb Fueling denselben Fehlbetrag je nach
        eingestellter Temperatur unterschiedlich: bei 20 °C und darunter bleibt der Balken bis 2,5%
        der Körpermasse grün, bei 30 °C und darüber nur noch bis 1,2%.
      </p>
      <p style={articleTextStyle}>
        Das andere Ende der Skala ist seltener, aber gefährlicher. Mehr trinken als du schwitzt
        verdünnt das{' '}
        <a href={faqHref('de', 'sodium-electrolytes-cycling')} style={articleLinkStyle}>
          Natrium im Blut
        </a>{' '}
        und führt zu belastungsbedingter Hyponatriämie — dem einen akuten Notfall in diesem ganzen
        Themenfeld mit dokumentiertem Weg ins Krankenhaus, der typischerweise langsamere Finisher
        bei langen Events erwischt, die an jedem Verpflegungspunkt "auf Nummer sicher" trinken.
        Deshalb wird der Hydrations-Balken auch bei Überschuss dunkelrot: für mehr trinken, als du
        verlierst, gibt es keine Belohnung.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling nimmt die für deine Strecke eingestellte Temperatur und deine Fahrintensität
        und schätzt darauf basierend deinen Flüssigkeitsbedarf in ml pro Stunde, zusammen mit deinem
        Kohlenhydratplan — du musst also weder raten noch unterwegs deinen eigenen Wiegetest machen.
        Die Zahl über dem Hydrations-Balken ist genau diese Bilanz: ein Minus bedeutet ein Defizit,
        ein Plus bedeutet, dass der Plan dich mehr trinken lässt, als du schwitzt.
      </p>
      <p style={articleSourcesStyle}>
        Quellen:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/26553489/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Sawka, Cheuvront, Kenefick, Sports Med 2015
        </a>{' '}
        (die 27°C-Hauttemperaturschwelle, oberhalb derer Dehydration beginnt, die Leistung zu
        beeinflussen).
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Plane Flüssigkeit und Kohlenhydrate gemeinsam →
        </a>
      </p>
    </FaqLayout>
  );
}
