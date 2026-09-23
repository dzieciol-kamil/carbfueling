import { calculatorHref, assetHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function BottleRefillPlanningDe() {
  return (
    <FaqLayout lang="de" slug="bottle-refill-planning">
      <h1 style={articleH1Style}>Flaschen auf einer langen Fahrt nachfüllen: so planst du es</h1>
      <p style={articleTextStyle}>
        Auf einer längeren Fahrt reicht der Inhalt von ein paar Flaschen nicht mehr aus — du
        bekommst nicht den ganzen Kohlenhydratvorrat schon am Start in die Flaschen. Du brauchst
        Punkte, an denen du nachfüllst, und einen Plan, was du dann in welche Flasche füllst.
      </p>
      <p style={articleTextStyle}>
        Starte mit deinem gesamten Kohlenhydrat- und Flüssigkeitsbedarf für die ganze Strecke — Carb
        Fueling berechnet beides aus deiner Route und den Bedingungen. Vergleiche das damit, was
        deine Flaschen und Behälter tatsächlich fassen. Die fehlende Menge musst du unterwegs
        auffüllen: im Laden, an einem Verpflegungspunkt oder an einer Wasserquelle.
      </p>
      <img
        src={assetHref('/faq/bottle-refill-planning/shop-stops.png')}
        alt="Zeitachse einer Route in Carb Fueling mit Verpflegungspunkten zwischen den Flaschen-Nachfüllungen."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        An jedem Ort, an dem du planst nachzufüllen, kannst du einen Verpflegungspunkt (Stop/Laden)
        hinzufügen. Carb Fueling teilt dann deinen gesamten Kohlenhydratvorrat auf die Abschnitte
        zwischen den Punkten auf, sodass du genau weißt, wie viel Pulver (deinen Kohlenhydratmix),
        Wasser und Produkte (Gele, Bananen) du mitnehmen — oder unterwegs kaufen — musst.
      </p>
      <p style={articleTextStyle}>
        Füge Punkte hinzu, bevor die Lücke zu groß wird, nicht wenn es schon zu spät ist. Denk
        daran: Nachfüllen bei 15-20 % Restvorrat ist ein Plan, Nachfüllen bei null Prozent ist eine
        Krise.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Füge Verpflegungspunkte zu deiner Route hinzu →
        </a>
      </p>
    </FaqLayout>
  );
}
