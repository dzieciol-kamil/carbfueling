import { faqHref, calculatorHref, assetHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function BonkCrisisDe() {
  return (
    <FaqLayout lang="de" slug="bonk-crisis">
      <h1 style={articleH1Style}>
        Was beim Hungerast wirklich passiert — und wie du ihn kommen siehst
      </h1>
      <p style={articleTextStyle}>
        Ein Hungerast kommt nicht plötzlich. Er ist der Endpunkt einer Lücke, die sich über die
        ganze Fahrt vergrößert — zwischen den Kohlenhydraten, die dein Körper verbrennt, und denen,
        die du tatsächlich zuführst.
      </p>
      <p style={articleTextStyle}>
        Deine Muskeln verbrennen Kohlenhydrate in einem Tempo, das von deiner Belastung abhängt:
        härteres Tempo, schnellerer Verbrauch. Dein Darm kann Kohlenhydrate nur in seinem eigenen
        Tempo liefern, begrenzt durch die Aufnahmeobergrenze (siehe{' '}
        <a href={faqHref('de', 'carb-transporter-mix')} style={articleLinkStyle}>
          warum du nicht mehr als ca. 90 g/h aufnehmen kannst
        </a>
        ). Bleibt der Verbrauch lange genug über der Zufuhr, gehen deine Glykogenspeicher — die
        Kohlenhydratreserve in Muskeln und Leber — zur Neige. Sind diese Reserven fast leer, kann
        dein Körper die Leistung nicht mehr halten: Das Tempo bricht schnell ein, zusammen mit
        Konzentration und Koordination. Das ist der Hungerast.
      </p>
      <img
        src={assetHref('/faq/bonk-crisis/supply-demand-gap.png')}
        alt="Carb-Fueling-Diagramm, das zeigt, wie die Kohlenhydratzufuhr unter den Bedarf fällt, mit einer sichtbaren Lücke zwischen den beiden Linien."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Das Warnsignal ist sichtbar, bevor es passiert: eine wachsende Lücke zwischen „verbrannt"
        und „zugeführt" auf der Zeitachse. Carb Fueling zeichnet beide Linien, während du deine
        Route planst, sodass du die sich öffnende Lücke siehst und reagieren kannst — frühere
        Mahlzeiten, ein konzentrierterer Kohlenhydratmix oder ein etwas leichteres Tempo — bevor
        daraus eine Krise wird.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Sieh dir dein eigenes Zufuhr-Bedarf-Diagramm an →
        </a>
      </p>
    </FaqLayout>
  );
}
