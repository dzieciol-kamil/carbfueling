import { faqHref, calculatorHref, assetHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function CarbTransporterMixDe() {
  return (
    <FaqLayout lang="de" slug="carb-transporter-mix">
      <h1 style={articleH1Style}>
        Warum kannst du nicht mehr als ca. 90 g Kohlenhydrate pro Stunde aufnehmen?
      </h1>
      <p style={articleTextStyle}>
        Dein Darm nimmt Zucker über zwei getrennte Kanäle auf — genauer über zwei unterschiedliche
        Transportproteine, die in die Darmwand eingebaut sind. Glukose nutzt eines davon, SGLT1
        genannt, Fruktose ein anderes, GLUT5. Das sind physisch getrennte Systeme, deshalb hat jedes
        sein eigenes, unabhängiges Tempolimit.
      </p>
      <p style={articleTextStyle}>
        Der SGLT1-Transporter lässt maximal ca. 60 g Glukose pro Stunde durch — egal wie viel du
        davon trinkst. Das ist ein aktiver, natriumgekoppelter Mechanismus, der bei diesem Tempo
        einfach sättigt. Trinkst du nur Maltodextrin oder reine Glukose-Gele, ist 60 g/h deine harte
        Obergrenze. Der Überschuss bleibt im Magen liegen und endet in Blähungen oder Krämpfen.
      </p>
      <p style={articleTextStyle}>
        Fruktose nutzt den GLUT5-Transporter, einen eigenen Kanal, der bei ca. 30 g pro Stunde
        sättigt (siehe{' '}
        <a href={faqHref('de', 'gut-training-carb-tolerance')} style={articleLinkStyle}>
          wie du deinen Darm trainierst, um deine Kohlenhydrattoleranz zu erhöhen
        </a>
        ). Gibst du Fruktose in den Mix, öffnest du beide Tore gleichzeitig — deshalb heben
        Glukose-Fruktose-Mischungen die reale Aufnahmeobergrenze auf ca. 90 g pro Stunde an.
      </p>
      <p style={articleTextStyle}>
        Das ist nicht nur Theorie — es wurde direkt gemessen. Sportphysiologen untersuchen das mit
        Doppelisotopen-Tracer-Tests und verfolgen, wie schnell aufgenommener Zucker tatsächlich zu
        Brennstoff wird (exogene Kohlenhydratoxidation). Studien zur kombinierten Gabe von Glukose
        und Fruktose (Jeukendrup, 2010) zeigten, dass die Kombination von Kohlenhydratquellen, die
        unterschiedliche Transporter nutzen — von ihm als „multiple transportable carbohydrates"
        bezeichnet — es erlaubt, Zucker etwa 50 % schneller zu oxidieren als reine Glukose — genau
        der oben beschriebene Unterschied zwischen ca. 60 g/h und ca. 90 g/h (in Laborstudien wurden
        sogar bis zu ca. 105 g/h gemessen).
      </p>
      <img
        src={assetHref('/faq/carb-transporter-mix/absorption-cap.png')}
        alt="Mix-Bereich mit den Glukose:Fruktose-Verhältnis-Presets und der daraus resultierenden Aufnahmeobergrenze in Carb Fueling."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Das Verhältnis spielt eine Rolle. Zu viel Fruktose, und du verschenkst Kapazität am
        Glukose-Tor; zu wenig, und du verschenkst Kapazität am Fruktose-Tor. Ein Verhältnis von 2:1
        (Glukose zu Fruktose nach Gewicht) ist für die meisten Radfahrer ein guter Ausgangspunkt —
        das ist der Standard-„Izo"-Mix in Carb Fueling.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling berechnet deine persönliche Aufnahmeobergrenze anhand des eingestellten
        Mischungsverhältnisses und zeigt sie live an, sobald du den Mix änderst.
      </p>
      <p style={articleSourcesStyle}>
        Quellen:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/20574242/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Jeukendrup, Curr Opin Clin Nutr Metab Care 2010
        </a>{' '}
        (mehrfach transportierbare Kohlenhydrate, Oxidation bis ca. 105 g/h).
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Finde deine eigene Aufnahmeobergrenze →
        </a>
      </p>
    </FaqLayout>
  );
}
