import { calculatorHref, assetHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function BottleRefillPlanningIt() {
  return (
    <FaqLayout lang="it" slug="bottle-refill-planning">
      <h1 style={articleH1Style}>Pianificare le ricariche delle borracce su un giro lungo</h1>
      <p style={articleTextStyle}>
        Quando un giro supera il contenuto di un paio di borracce di mix, non puoi portare tutto il
        piano dalla partenza. Ti servono punti di rifornimento — e un piano su cosa mettere in ogni
        borraccia quando ci arrivi.
      </p>
      <p style={articleTextStyle}>
        Parti dal tuo fabbisogno totale di carboidrati e liquidi per l'intera distanza (Carb Fueling
        calcola entrambi dal percorso e dalle condizioni). Confrontalo con quanto possono contenere
        davvero le tue borracce e flask. Qualsiasi differenza deve arrivare da qualche parte lungo
        la strada — un negozio, una tappa di supporto, una fontanella.
      </p>
      <img
        src={assetHref('/faq/bottle-refill-planning/shop-stops.png')}
        alt="Linea temporale del percorso in Carb Fueling con i segnalini delle tappe posizionati tra una ricarica e l'altra delle borracce."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Posiziona una "tappa" a ogni punto di rifornimento sul tuo percorso. Carb Fueling divide poi
        il tuo mix totale di carboidrati tra i tratti fra le tappe, così sai esattamente quanta
        polvere (il tuo mix), acqua e prodotti (gel, banane) portare — o comprare — lungo il
        percorso.
      </p>
      <p style={articleTextStyle}>
        Metti le tappe prima che un divario diventi troppo grande, non dopo: ricaricare quando resta
        il 15-20% di scorta è un piano, ricaricare allo 0% è una crisi.
      </p>
      <p style={articleTextStyle}>
        Per percorsi brevi e ben riforniti, una sola ricarica verso metà strada spesso basta. Per
        giri più lunghi o isolati, distanzia le tappe in modo che nessun tratto singolo porti le tue
        borracce oltre quanto possono contenere.
      </p>
      <p>
        <a href={calculatorHref('it')} style={articleLinkStyle}>
          Aggiungi tappe al tuo percorso →
        </a>
      </p>
    </FaqLayout>
  );
}
