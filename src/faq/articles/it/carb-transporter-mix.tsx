import { faqHref, calculatorHref, assetHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function CarbTransporterMixIt() {
  return (
    <FaqLayout lang="it" slug="carb-transporter-mix">
      <h1 style={articleH1Style}>Perché non puoi assorbire più di ~90 g di carboidrati all'ora?</h1>
      <p style={articleTextStyle}>
        Il tuo intestino assorbe lo zucchero attraverso due porte separate — due proteine di
        trasporto diverse incorporate nella parete intestinale. Il glucosio usa la prima, chiamata
        SGLT1; il fruttosio usa l'altra, chiamata GLUT5. Poiché sono sistemi fisicamente separati,
        ognuno ha il proprio limite di velocità indipendente.
      </p>
      <p style={articleTextStyle}>
        L'SGLT1 può trasportare circa 60 g di glucosio all'ora, qualunque sia la quantità che bevi —
        è un trasportatore attivo, legato al sodio, che semplicemente si satura a quel ritmo. Se
        bevi solo gel a base di glucosio o maltodestrine pure, 60 g/h è il tuo tetto invalicabile —
        lo zucchero in eccesso resta nello stomaco e causa gonfiore o crampi.
      </p>
      <p style={articleTextStyle}>
        Il GLUT5 gestisce il fruttosio su una via separata, buona per altri 30 g circa all'ora (vedi{' '}
        <a href={faqHref('it', 'gut-training-carb-tolerance')} style={articleLinkStyle}>
          come allenare l'intestino per alzare la tolleranza ai carboidrati
        </a>
        ). Aggiungendo fruttosio alla tua fonte di carboidrati, usi entrambe le porte
        contemporaneamente. Per questo le miscele glucosio-fruttosio spingono il tetto realistico a
        circa 90 g all'ora.
      </p>
      <p style={articleTextStyle}>
        Non è solo teoria — è stato misurato direttamente. I fisiologi dell'esercizio lo tracciano
        con prove di alimentazione a doppio tracciante, usando zuccheri marcati per vedere quanto
        rapidamente il carboidrato ingerito diventa davvero carburante bruciato (ossidazione dei
        carboidrati esogeni). Uno studio sull'alimentazione combinata glucosio-fruttosio
        (Jeukendrup, 2010) ha trovato che abbinare fonti di carboidrati che usano trasportatori
        diversi — quelli che lui chiamava "carboidrati multipli trasportabili" — permette agli
        atleti di ossidare i carboidrati circa il 50% più velocemente rispetto al solo glucosio — il
        divario tra ~60 g/h e ~90 g/h descritto sopra (in laboratorio si sono misurati anche fino a
        ~105 g/h).
      </p>
      <img
        src={assetHref('/faq/carb-transporter-mix/absorption-cap.png')}
        alt="Pannello Mix che mostra i preset del rapporto glucosio:fruttosio e la soglia di assorbimento risultante in Carb Fueling."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Il rapporto conta. Troppo fruttosio e sprechi la capacità della porta del glucosio; troppo
        poco e sprechi quella della porta del fruttosio. Un rapporto glucosio:fruttosio di 2:1 in
        peso è un buon punto di partenza per la maggior parte degli atleti — è il mix "Izo"
        predefinito in Carb Fueling.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling calcola la tua soglia personale dal rapporto della miscela che imposti, e la
        mostra in tempo reale mentre cambi il mix.
      </p>
      <p style={articleSourcesStyle}>
        Fonti:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/20574242/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Jeukendrup, Curr Opin Clin Nutr Metab Care 2010
        </a>{' '}
        (carboidrati multipli trasportabili, ossidazione fino a ~105 g/h).
      </p>
      <p>
        <a href={calculatorHref('it')} style={articleLinkStyle}>
          Scopri la tua soglia →
        </a>
      </p>
    </FaqLayout>
  );
}
