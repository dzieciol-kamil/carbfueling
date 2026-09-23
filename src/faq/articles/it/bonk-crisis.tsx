import { faqHref, calculatorHref, assetHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function BonkCrisisIt() {
  return (
    <FaqLayout lang="it" slug="bonk-crisis">
      <h1 style={articleH1Style}>
        Cosa succede davvero quando arriva la crisi di fame — e come vederla arrivare
      </h1>
      <p style={articleTextStyle}>
        La crisi di fame non arriva all'improvviso. È il punto finale di un divario che cresce per
        tutto il giro — tra i carboidrati che il tuo corpo brucia e quelli che stai davvero
        assumendo.
      </p>
      <p style={articleTextStyle}>
        I tuoi muscoli bruciano carboidrati a un ritmo dettato dallo sforzo: ritmo più duro, consumo
        più veloce. Il tuo intestino può fornire carboidrati solo al proprio ritmo, limitato dalla
        soglia di assorbimento (vedi{' '}
        <a href={faqHref('it', 'carb-transporter-mix')} style={articleLinkStyle}>
          perché non puoi assorbire più di ~90 g/h
        </a>
        ). Se il ritmo di consumo resta sopra quello di rifornimento abbastanza a lungo, le tue
        riserve di glicogeno — la scorta di carboidrati in muscoli e fegato — si esauriscono. Una
        volta che quella riserva è quasi vuota, il corpo non riesce più a mantenere la potenza: il
        ritmo crolla in fretta, insieme a concentrazione e coordinazione. Questa è la crisi di fame.
      </p>
      <img
        src={assetHref('/faq/bonk-crisis/supply-demand-gap.png')}
        alt="Grafico di Carb Fueling che mostra l'apporto di carboidrati scendere sotto il fabbisogno, con un divario visibile tra le due linee."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Il segnale d'allarme è visibile prima che accada: un divario crescente tra «carboidrati
        bruciati» e «carboidrati forniti» su una linea temporale. Carb Fueling traccia entrambi
        mentre costruisci un percorso, così puoi vedere il divario aprirsi e correggerlo — apporti
        anticipati, un mix più concentrato o un ritmo leggermente più facile — prima che diventi una
        crisi.
      </p>
      <p>
        <a href={calculatorHref('it')} style={articleLinkStyle}>
          Traccia il tuo apporto contro il fabbisogno →
        </a>
      </p>
    </FaqLayout>
  );
}
