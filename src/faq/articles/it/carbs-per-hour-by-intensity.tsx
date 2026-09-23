import { faqHref, calculatorHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function CarbsPerHourByIntensityIt() {
  return (
    <FaqLayout lang="it" slug="carbs-per-hour-by-intensity">
      <h1 style={articleH1Style}>Quanti carboidrati all'ora servono davvero?</h1>
      <p style={articleTextStyle}>
        Non esiste un unico numero corretto di grammi all'ora. La quantità giusta dipende
        soprattutto da quanto dura il giro e quanto è duro. Quello che segue è un intervallo pratico
        per la maggior parte degli atleti, non una regola rigida — considerala un punto di partenza
        da correggere in base a come ti senti.
      </p>
      <p style={articleTextStyle}>
        Per un giro facile sotto l'ora, i carboidrati contano poco. Le riserve di glicogeno del tuo
        corpo — lo zucchero già immagazzinato in muscoli e fegato — bastano da sole a coprire quel
        tipo di sforzo, quindi l'acqua o una bevanda di idratazione contano più dell'apporto di
        carboidrati.
      </p>
      <p style={articleTextStyle}>
        Quando un giro si estende a 1-2,5 ore, i carboidrati iniziano a guadagnarsi il loro posto.
        Circa 30-60 g all'ora è l'intervallo utile qui. L'obiettivo è risparmiare le riserve di
        glicogeno e mantenere la qualità dello sforzo nella parte finale del giro, non alimentare
        ogni caloria bruciata.
      </p>
      <p style={articleTextStyle}>
        Oltre le 2,5-3 ore circa, specialmente con un ritmo da moderato a duro, puoi spingere
        l'apporto fino a 60-90 g all'ora. Arrivare a quel livello funziona bene solo con una miscela
        glucosio-fruttosio, perché una singola fonte di carboidrati — glucosio o maltodestrine da
        sole — tende a fermarsi intorno ai 60 g all'ora qualunque sia la quantità che bevi. Vedi{' '}
        <a href={faqHref('it', 'carb-transporter-mix')} style={articleLinkStyle}>
          perché esiste quella soglia e come un mix glucosio-fruttosio la alza
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        L'intensità cambia quanto è urgente arrivare in cima all'intervallo di assorbimento. Una
        giornata lunga e facile può spesso stare vicino al livello basso anche dopo diverse ore,
        perché stai bruciando glicogeno più lentamente. Uno sforzo duro o a ritmo gara consuma il
        glicogeno più in fretta e richiede un apporto di carboidrati più alto, anche a parità di
        durata.
      </p>
      <p style={articleTextStyle}>
        Un modo semplice per valutare l'intensità senza misuratore di potenza o
        cardiofrequenzimetro: riesci ancora a parlare? Bassa significa che riesci a chiacchierare
        comodamente con frasi complete. Media significa che riesci a parlare, ma solo con frasi
        brevi. Alta significa che riesci a malapena a parlare, concentrato sul respiro. È la stessa
        scala usata dall'impostazione di intensità di Carb Fueling.
      </p>
      <p style={articleTextStyle}>
        Corporatura e livello di allenamento spostano anche il numero esatto — un atleta più
        corpulento o con un intestino ben allenato può spesso gestire e usare più carboidrati
        all'ora di quanto suggeriscano questi intervalli. Considera 30-90 g/h come un intervallo di
        partenza da affinare con la pratica, non un obiettivo che va bene per ogni atleta allo
        stesso modo. L'obiettivo di Carb Fueling si basa solo sulla durata e sull'intensità del tuo
        giro, non sul tuo peso — se sei un atleta più corpulento, tendi verso l'estremità alta di
        qualsiasi intervallo ti venga dato.
      </p>
      <p style={articleTextStyle}>
        Invece di applicare una regola empirica fissa, Carb Fueling calcola i numeri per il tuo giro
        specifico — usando durata e intensità del percorso per ricavare il tuo reale fabbisogno
        orario di carboidrati.
      </p>
      <p style={articleSourcesStyle}>
        Fonti:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/24791914/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Jeukendrup, Sports Med 2014
        </a>{' '}
        (le linee guida 30/60/90 g/h in base alla durata dell'esercizio).
      </p>
      <p>
        <a href={calculatorHref('it')} style={articleLinkStyle}>
          Calcola il tuo obiettivo orario →
        </a>
      </p>
    </FaqLayout>
  );
}
