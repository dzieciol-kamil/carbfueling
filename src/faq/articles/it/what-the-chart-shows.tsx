import { faqHref, calculatorHref, assetHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function WhatTheChartShowsIt() {
  return (
    <FaqLayout lang="it" slug="what-the-chart-shows">
      <h1 style={articleH1Style}>
        Cosa mostra davvero il grafico: dalla borraccia al flusso sanguigno
      </h1>
      <p style={articleTextStyle}>
        Ogni punto del grafico corrisponde a ciò che prevedi di mangiare o bere in quel punto del
        percorso. Un gel, un sorso d'acqua o di mix dalla borraccia, una banana a una tappa. Il
        grafico lo registra esattamente dove è impostato per accadere sul percorso, non come un
        totale unico per tutto il giro.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/intake-vessels.jpg')}
        alt="Voci di borraccia e gel nella lista del piano di Carb Fueling, ciascuna etichettata con contenuto e quantità."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Cibo e bevande non diventano carburante utilizzabile nel momento in cui raggiungono la tua
        bocca. Arrivano prima nello stomaco e nell'intestino, e digeriscono gradualmente. C'è un
        vero ritardo tra mangiare qualcosa e il corpo che riesce a usarlo. Il grafico mostra tutto
        questo processo — i carboidrati restano nell'intestino per un po', in attesa, invece di
        diventare disponibili nell'istante in cui li deglutisci.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/gut-strip.jpg')}
        alt="La fascia del contenuto intestinale in cima al grafico, che si riempie e si svuota man mano che i carboidrati digeriscono."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Qualunque sia la quantità che mangi, il tuo intestino può spingere solo una quantità
        limitata di carboidrati nel sangue ogni ora. Questa è la soglia di assorbimento, e appare
        sul grafico come una linea orizzontale fissa. Con una buona miscela glucosio-fruttosio,
        quella soglia sta a circa 90 g all'ora per la maggior parte degli atleti — vedi{' '}
        <a href={faqHref('it', 'carb-transporter-mix')} style={articleLinkStyle}>
          perché esiste questa soglia e come mescolare zuccheri la alza
        </a>
        . Mangiare più della soglia non aiuta — l'eccesso resta semplicemente più a lungo nello
        stomaco.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/absorption-cap.jpg')}
        alt="La linea tratteggiata piatta del limite di assorbimento sopra le linee crescenti di fabbisogno e assorbito."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        La linea "fabbisogno" è il lato della domanda del quadro. Mostra quanti carboidrati richiede
        il tuo giro ogni ora, in base a quanto stai spingendo in quel punto — sali una salita ripida
        e sale, scendi dall'altra parte e cala. Contro di essa sta "assorbito": quanto carboidrato
        il tuo corpo ha davvero assunto e può usare, trattenuto da due cose insieme — quanto hai
        mangiato, e la soglia di assorbimento. Anche un atleta ben alimentato non può spingere
        l'assorbito oltre la soglia. Osservare queste due linee fianco a fianco, ora per ora, è
        l'abilità di base per leggere questo grafico.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/need-absorbed.jpg')}
        alt="Le linee di fabbisogno e assorbito insieme, con il divario tra loro ombreggiato per mostrare il deficit."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Quando l'assorbito scende sotto il fabbisogno per un tratto del percorso, quel divario viene
        segnato come deficit. È qui che il rischio di crisi di fame si accumula silenziosamente —
        non in un momento drammatico, ma minuto per minuto, ora per ora. Vedi{' '}
        <a href={faqHref('it', 'bonk-crisis')} style={articleLinkStyle}>
          cosa succede quando quel divario dura troppo a lungo
        </a>
        , e come un piccolo deficit ignorato si trasforma in una vera crisi in bici.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/deficit.jpg')}
        alt="Un primo piano del divario di deficit ombreggiato tra le linee di fabbisogno e assorbito all'inizio del giro."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        I liquidi funzionano allo stesso modo, su una loro coppia di linee: liquido assorbito contro
        perdita di sudore, tracciando l'idratazione invece dei carboidrati.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/fluid-lines.png')}
        alt="Le linee di liquido assorbito e perdita di sudore nella vista idratazione del grafico."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Vedere tutto questo processo dispiegato, invece di un solo numero, è il vero scopo del
        grafico. Trasforma "ho mangiato abbastanza oggi" da una domanda a cui rispondi dopo il giro
        in qualcosa che puoi vedere arrivare, ore prima, e correggere prima che diventi un problema.
      </p>
      <p>
        <a href={calculatorHref('it')} style={articleLinkStyle}>
          Osserva la tua linea di fueling →
        </a>
      </p>
    </FaqLayout>
  );
}
