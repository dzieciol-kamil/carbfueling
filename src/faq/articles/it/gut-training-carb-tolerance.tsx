import { calculatorHref, faqHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function GutTrainingCarbToleranceIt() {
  return (
    <FaqLayout lang="it" slug="gut-training-carb-tolerance">
      <h1 style={articleH1Style}>
        Allenare l'intestino: come alzare in sicurezza la tolleranza ai carboidrati
      </h1>
      <p style={articleTextStyle}>
        La capacità del tuo intestino di assorbire carboidrati durante l'esercizio non è fissa.
        Funziona un po' come un muscolo: l'esposizione ripetuta ai carboidrati mentre vai in bici
        allena l'intestino a spostare lo zucchero più velocemente, con meno gonfiore e meno crampi.
        Questo adattamento richiede settimane di pratica costante. Non è qualcosa che puoi attivare
        la mattina di una gara semplicemente bevendo di più.
      </p>
      <p style={articleTextStyle}>
        Il modo più sicuro per costruire questa tolleranza è graduale. Parti ben sotto il tuo
        obiettivo finale — circa 30 g di carboidrati all'ora è un buon punto di partenza per la
        maggior parte degli atleti. Poi aumenta la quantità lentamente, di circa 5-10 g all'ora ogni
        settimana o due. Dai al tuo intestino il tempo di adattarsi a ogni passo prima di spingere
        oltre. Gli atleti che saltano direttamente a{' '}
        <a href={faqHref('it', 'carb-transporter-mix')} style={articleLinkStyle}>
          ~90 g/h
        </a>{' '}
        senza questa gradualità spesso finiscono con dolori di stomaco, gonfiore o diarrea invece
        che con energia in più.
      </p>
      <p style={articleTextStyle}>
        Allenati all'intensità e alla durata a cui prevedi di gareggiare, non solo nei giri facili.
        Il comfort intestinale a ritmo rilassato non predice il comfort intestinale sotto sforzo
        duro. Con l'aumentare dello sforzo, il corpo manda più sangue ai muscoli in lavoro e meno
        all'apparato digerente, quindi la stessa quantità di carboidrati può risultare molto più
        difficile da assorbire nel finale di una gara dura rispetto a un'uscita facile in
        allenamento.
      </p>
      <p style={articleTextStyle}>
        Allenati anche con gli stessi prodotti e lo stesso mix (il rapporto maltodestrine-fruttosio)
        che prevedi di usare il giorno della gara. Un gel o una bevanda che va bene in allenamento
        potrebbe non essere quella che usi davvero in gara, e cambiare prodotti o mix all'ultimo
        minuto vanifica il beneficio di tutto il tuo allenamento.
      </p>
      <p style={articleTextStyle}>
        Anche la stanchezza di gusto è reale — un sapore che va bene per un'ora può diventare
        difficile da digerire dopo tre o quattro, quindi conviene testarlo anche durante le uscite
        lunghe. Puoi provare a variare, ad esempio{' '}
        <a href={faqHref('it', 'diy-flavor-additives')} style={articleLinkStyle}>
          con diverse aggiunte di gusto
        </a>
        , oppure portare qualcosa dal sapore più neutro, come{' '}
        <a href={faqHref('it', 'rice-cake-bars')} style={articleLinkStyle}>
          i rice cake
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        Vale la pena escludere alcune cause comuni di problemi di stomaco prima di dare la colpa ai
        carboidrati in sé. Borracce mescolate troppo concentrate alzano l'osmolalità della bevanda,
        il che richiama acqua nell'intestino e può causare crampi. Mangiare molti grassi, fibre o
        proteine subito prima o durante l'esercizio duro rallenta la digestione e compete per lo
        stesso flusso sanguigno limitato. Essere disidratati peggiora ulteriormente l'assorbimento
        dei carboidrati. E semplicemente assumere più carboidrati all'ora di quanto il tuo intestino
        sia attualmente allenato a gestire causerà problemi indipendentemente da quanto sia ben
        formulato il prodotto.
      </p>
      <p style={articleTextStyle}>
        Una volta che conosci la tua soglia allenata attuale, pianifica in base a quella invece di
        indovinare. Carb Fueling mostra la tua soglia di assorbimento in tempo reale mentre imposti
        il rapporto del mix di borraccia e gel, così puoi farla combaciare con ciò che il tuo
        intestino ha davvero allenato, e costruire un programma di fueling che resta sotto quella
        soglia invece di superarla il giorno della gara. Un'avvertenza: qualunque sia il rapporto
        che imposti per borraccia e gel, la soglia di assorbimento di Carb Fueling arriva al massimo
        a circa 92 g/h. È un valore predefinito prudente e deliberato, non un muro fisiologico
        rigido — un piccolo numero di intestini molto ben allenati può superarlo — ma è una soglia
        sensata per la grande maggioranza degli atleti.
      </p>
      <p style={articleSourcesStyle}>
        Fonti:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/20466803/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Cox et al., J Appl Physiol 2010
        </a>{' '}
        (28 giorni di allenamento con alta disponibilità di carboidrati hanno aumentato
        l'ossidazione dei carboidrati esogeni e la prestazione a cronometro di circa il 6%).
      </p>
      <p>
        <a href={calculatorHref('it')} style={articleLinkStyle}>
          Controlla la tua soglia di assorbimento →
        </a>
      </p>
    </FaqLayout>
  );
}
