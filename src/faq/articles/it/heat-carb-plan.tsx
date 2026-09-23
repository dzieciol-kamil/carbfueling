import { faqHref, calculatorHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function HeatCarbPlanIt() {
  return (
    <FaqLayout lang="it" slug="heat-carb-plan">
      <h1 style={articleH1Style}>
        Come il caldo cambia il tuo piano di carboidrati (non basta «bevi di più»)
      </h1>
      <p style={articleTextStyle}>
        Il caldo alza il tasso di sudorazione, e mette anche uno stress extra sulla temperatura
        corporea centrale. Per raffreddarsi, il corpo manda più sangue alla pelle. Quel sangue deve
        arrivare da qualche altra parte, e uno dei posti da cui viene tolto è l'intestino. È una
        risposta normale e sana, ma che conta per il fueling.
      </p>
      <p style={articleTextStyle}>
        Con meno flusso sanguigno all'intestino, la digestione rallenta. Gli studi sull'esercizio al
        caldo mostrano che lo svuotamento gastrico e l'assorbimento dei carboidrati possono calare
        in modo misurabile quando la temperatura centrale sale e il corpo dà priorità al
        raffreddamento. Quindi il caldo non ti fa solo sudare di più — può anche rendere il tuo
        intestino un po' meno capace di digerire ciò che gli dai.
      </p>
      <p style={articleTextStyle}>
        Ecco perché «bevi di più» è un consiglio incompleto. Se la capacità di assorbimento del tuo
        intestino è già sotto pressione per lo stress da caldo, aggiungere più liquido va bene, ma
        spingere la stessa concentrazione forte di carboidrati oltre a quel liquido extra può
        ritorcersi contro. Il risultato è spesso gonfiore, nausea o crampi.
      </p>
      <p style={articleTextStyle}>
        Un approccio migliore per i giri caldi è diluire leggermente le borracce. Il tuo fabbisogno
        di liquidi sale molto con il caldo, quindi se mantieni la stessa concentrazione di
        carboidrati per borraccia, finisci per forzare più zucchero totale attraverso un intestino
        che lavora con meno flusso sanguigno. Diluire mantiene la concentrazione più vicina a quanto
        il tuo intestino può gestire comodamente, pur soddisfacendo il tuo fabbisogno di liquidi più
        alto.
      </p>
      <p style={articleTextStyle}>
        Aiuta anche affidarsi a fonti di carboidrati liquide e a bassa osmolalità piuttosto che a
        gel densi quando fa caldo. Un gel è una dose concentrata che l'intestino deve diluire usando
        le proprie riserve di liquido (a meno che tu non lo segua con molta acqua semplice); una
        borraccia ben mescolata è già a una concentrazione più delicata. E non dimenticare il sodio
        — tasso di sudorazione e perdita di sodio salgono entrambi con il caldo, quindi il tuo
        fabbisogno di elettroliti sale insieme a quello di liquidi (ne parliamo di più nel nostro{' '}
        <a href={faqHref('it', 'sodium-electrolytes-cycling')} style={articleLinkStyle}>
          articolo su sodio ed elettroliti
        </a>
        ).
      </p>
      <p style={articleTextStyle}>
        Conta anche l'acclimatazione al caldo. Gli atleti che si allenano in condizioni calde per
        una o due settimane si adattano: sudano in modo più efficiente, e il loro intestino tende a
        tollerare meglio lo stress da caldo durante l'esercizio. Un atleta che ha pedalato al caldo
        per tutta l'estate può gestire una giornata calda in modo molto diverso da chi affronta la
        prima ondata di caldo della stagione — quindi il tuo piano dovrebbe tenere conto di quanto
        sei davvero acclimatato, non solo della temperatura prevista.
      </p>
      <p style={articleTextStyle}>
        Niente di tutto questo significa che devi stravolgere il tuo fueling per una normale
        giornata tiepida. Questo conta soprattutto per sforzi genuinamente caldi e lunghi, dove i
        compromessi tra liquidi e tolleranza intestinale iniziano davvero a farsi sentire. Carb
        Fueling prende in input la temperatura del percorso e regola di conseguenza la stima dei
        liquidi, così quando pianifichi un giro caldo vedi insieme il tuo fabbisogno di liquidi e
        carboidrati e puoi regolare l'apporto invece di indovinare.
      </p>
      <p style={articleSourcesStyle}>
        Fonti:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/41138215/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Mougin et al., J Appl Physiol 2025
        </a>{' '}
        (il caldo riduce l'ossidazione dei carboidrati esogeni di circa il 20% anche mantenendo
        un'idratazione piena, soprattutto tramite un assorbimento intestinale ridotto).
      </p>
      <p>
        <a href={calculatorHref('it')} style={articleLinkStyle}>
          Pianifica il tuo prossimo giro caldo →
        </a>
      </p>
    </FaqLayout>
  );
}
