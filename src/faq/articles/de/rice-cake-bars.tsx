import { faqHref, calculatorHref } from '../../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../../FaqLayout';

export default function RiceCakeBarsDe() {
  return (
    <FaqLayout lang="de" slug="rice-cake-bars">
      <h1 style={articleH1Style}>
        Rice Cake selbst gemacht: Verpflegung für den Moment, wenn Gele nicht mehr gehen
      </h1>
      <p style={articleTextStyle}>
        Im Artikel über{' '}
        <a href={faqHref('de', 'fueling-100km-vs-300km')} style={articleLinkStyle}>
          die Unterschiede zwischen Fueling auf 100 km und auf 300 km
        </a>{' '}
        schreiben wir, dass nach ein paar Stunden dasselbe Gel oder Getränk, das am Start noch gut
        geschmeckt hat, kaum noch runtergehen will — das ist Geschmacksermüdung. Rice Cake ist eine
        der klassischen Antworten auf dieses Problem: ein dichter, kompakter Reisriegel, beliebt bei
        Langstrecken- und Ultrafahrern gerade weil er ganz anders schmeckt als ein süßes Gel oder
        Iso-Getränk.
      </p>
      <p style={articleTextStyle}>Rezept für 8 Portionen:</p>
      <ul style={{ ...articleTextStyle, paddingLeft: 20 }}>
        <li>200 g Sushi-Reis</li>
        <li>200 ml Kokosmilch — nur der dicke, feste Teil</li>
        <li>
          80 g frische Datteln (getrocknete gehen auch), alternativ auch getrocknete Cranberrys
        </li>
        <li>350 ml Wasser zum Kochen (plus separates Wasser zum Waschen des Reises)</li>
        <li>4 Esslöffel Zucker</li>
        <li>3 Prisen Salz</li>
      </ul>
      <p style={articleTextStyle}>
        Den Reis wäschst du zweimal und kochst ihn etwa 20 Minuten in der 2,5-fachen Menge Wasser,
        dann rührst du den festen Teil der Kokosmilch, die Datteln, Zucker und Salz unter. Die Masse
        formst du auf Backpapier zu einem gleichmäßigen, rechteckigen Block — Schneidebretter
        seitlich angedrückt helfen, gerade Kanten hinzubekommen (du kannst auch einen Gefrierbeutel
        benutzen, den du mit einem Brett flach drückst, sodass ein flacher Fladen entsteht, der den
        ganzen Beutel ausfüllt) — und stellst ihn für ein paar Stunden in den Kühl- oder
        Gefrierschrank, bis er fest wird. Danach schneidest du ihn in 8 gleiche Stücke und wickelst
        sie einzeln ein. Im Kühlschrank hält er sich bis zu 3 Tage, im Gefrierschrank praktisch
        unbegrenzt.
      </p>
      <p style={articleTextStyle}>
        Eine Portion hat etwa 140 kcal, 30 g Kohlenhydrate, 2 g Eiweiß und 2 g Fett. Bei einem
        typischen Ziel von{' '}
        <a href={faqHref('de', 'carbs-per-hour-by-intensity')} style={articleLinkStyle}>
          60-90 g Kohlenhydraten pro Stunde
        </a>{' '}
        deckt ein Stück etwa eine halbe Stunde ab, sodass du leicht ausrechnen kannst, wie viele
        Stücke du für einen bestimmten Streckenabschnitt brauchst — genau wie bei jedem anderen
        Produkt, das du in einen Carb-Fueling-Plan einträgst.
      </p>
      <p style={articleTextStyle}>
        Der Vorteil dieser Form ist die Textur: Sie hält ihre Form gut in der Trikottasche. Das Fett
        aus der Kokosmilch sorgt außerdem für ein länger anhaltendes Sättigungsgefühl als reiner
        Zucker, was in der ruhigeren Phase einer langen Strecke hilfreich sein kann, wenn es dir
        nicht mehr nur um einen schnellen Energieschub geht.
      </p>
      <p style={articleTextStyle}>
        Eine Einschränkung: Dieses Rezept ist immer noch süß — Datteln und Zucker sorgen dafür. Wenn
        dein Problem tatsächlich die Süße ist und nicht nur die Konsistenz von Gel, lohnt es sich,
        den Zucker zu reduzieren oder die Datteln gegen etwas weniger Süßes zu tauschen. Der Sinn
        des Rice Cake als Abwechslung funktioniert am besten, wenn der Geschmack wirklich mit dem
        kontrastiert, was in deiner Flasche ist (manche geben gut ausgebratenen, gehackten Speck
        dazu).
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Füge Rice Cake zu deinem Plan hinzu →
        </a>
      </p>
    </FaqLayout>
  );
}
