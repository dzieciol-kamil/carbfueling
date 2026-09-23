import { faqHref, calculatorHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function HeatCarbPlanDe() {
  return (
    <FaqLayout lang="de" slug="heat-carb-plan">
      <h1 style={articleH1Style}>
        Wie Hitze deinen Kohlenhydratplan verändert (es ist nicht nur "mehr trinken")
      </h1>
      <p style={articleTextStyle}>
        Hitze erhöht deine Schweißrate, aber das ist nicht alles — sie belastet den Körper
        zusätzlich beim Versuch, die Körpertemperatur zu halten. Um sich abzukühlen, leitet der
        Körper mehr Blut zur Haut. Dieses Blut muss irgendwoher kommen, und einer der Orte, von
        denen es "geliehen" wird, ist der Darm. Das ist eine normale, gesunde Reaktion, die für die
        Ernährungsplanung relevant ist.
      </p>
      <p style={articleTextStyle}>
        Bei geringerer Durchblutung des Darms verlangsamt sich die Verdauung. Studien zu Belastung
        in der Hitze zeigen, dass Magenentleerung und Kohlenhydrataufnahme messbar sinken können,
        wenn die Körperkerntemperatur steigt und der Körper der Kühlung Priorität gibt. Hitze sorgt
        also nicht nur dafür, dass du mehr schwitzt — sie kann auch deinen Darm etwas weniger
        leistungsfähig machen bei der Verarbeitung dessen, was du ihm zuführst.
      </p>
      <p style={articleTextStyle}>
        Deshalb ist der Rat "trink einfach mehr" unvollständig. Wenn die Aufnahmefähigkeit deines
        Darms durch den Hitzestress bereits etwas eingeschränkt ist, ist mehr Flüssigkeit zwar gut —
        aber dieselbe hohe Kohlenhydratkonzentration zusätzlich zu dieser zusätzlichen Flüssigkeit
        beizubehalten, kann nach hinten losgehen. Das Ergebnis sind oft Blähungen, Übelkeit oder
        Magenkrämpfe.
      </p>
      <p style={articleTextStyle}>
        Ein besserer Ansatz für heiße Fahrten ist es, die Flaschen leicht zu verdünnen. Dein
        Flüssigkeitsbedarf steigt in der Hitze stark, und wenn du dieselbe Kohlenhydratkonzentration
        pro Flasche beibehältst, drückst du in Summe mehr Zucker durch einen Darm, der mit weniger
        Durchblutung arbeitet. Verdünnen hält die Konzentration näher an dem, was dein Darm bequem
        verarbeiten kann, während gleichzeitig dein höherer Flüssigkeitsbedarf gedeckt wird.
      </p>
      <p style={articleTextStyle}>
        Es hilft auch, bei Hitze eher auf flüssige Kohlenhydratquellen mit niedrigerer Osmolalität
        statt auf dichte Gels zu setzen. Ein Gel ist eine konzentrierte Dosis, die dein Darm erst
        mit seinen eigenen Flüssigkeitsreserven verdünnen muss (sofern du nicht viel reines Wasser
        hinterhertrinkst); eine gut gemischte Flasche liegt bereits auf einer milderen
        Konzentration. Und vergiss Natrium nicht — Schweißrate und Natriumverlust steigen bei Hitze
        beide, dein Elektrolytbedarf wächst also parallel zum Flüssigkeitsbedarf (mehr dazu in{' '}
        <a href={faqHref('de', 'sodium-electrolytes-cycling')} style={articleLinkStyle}>
          unserem Artikel über Natrium und Elektrolyte
        </a>
        ).
      </p>
      <p style={articleTextStyle}>
        Auch die Hitzeakklimatisierung spielt eine Rolle. Radfahrer, die ein bis zwei Wochen unter
        heißen Bedingungen trainieren, passen sich an: Sie schwitzen effizienter, und ihr Darm
        verträgt Hitzestress unter Belastung meist besser. Jemand, der den ganzen Sommer bei Hitze
        gefahren ist, kommt mit einem heißen Tag ganz anders zurecht als jemand, der die erste
        Hitzewelle der Saison erwischt — dein Plan sollte also deine tatsächliche Akklimatisierung
        berücksichtigen, nicht nur die Vorhersagetemperatur.
      </p>
      <p style={articleTextStyle}>
        Das bedeutet nicht, dass du bei einem gewöhnlichen warmen Tag deine ganze Ernährung
        umkrempeln musst. Relevant wird das vor allem bei wirklich heißen, langen Ausfahrten, bei
        denen der Zielkonflikt zwischen Flüssigkeit und Darmtoleranz spürbar wird. Carb Fueling
        nimmt die Streckentemperatur als Eingabe und passt die geschätzte Flüssigkeitsmenge
        entsprechend an — planst du also eine heiße Fahrt, siehst du Flüssigkeits- und
        Kohlenhydratbedarf zusammen und kannst deine Zufuhr anpassen, statt zu raten.
      </p>
      <p style={articleSourcesStyle}>
        Quellen:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/41138215/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Mougin et al., J Appl Physiol 2025
        </a>{' '}
        (Hitze senkt die Oxidation exogener Kohlenhydrate um ca. 20%, selbst bei voll
        aufrechterhaltener Flüssigkeitszufuhr, hauptsächlich durch verringerte Darmaufnahme).
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Plane deine nächste heiße Ausfahrt →
        </a>
      </p>
    </FaqLayout>
  );
}
