import { faqHref, calculatorHref } from '../../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../../FaqLayout';

export default function Fueling100kmVs300kmIt() {
  return (
    <FaqLayout lang="it" slug="fueling-100km-vs-300km">
      <h1 style={articleH1Style}>Fueling per 100 km vs. 300+ km: cosa cambia davvero</h1>
      <p style={articleTextStyle}>
        Un giro di 100 km e uno di 300 km non sono «la stessa cosa, tre volte più lunga». Il fattore
        limitante cambia man mano che le ore si accumulano, e un piano di fueling che funziona bene
        per una distanza può fallire clamorosamente sull'altra. Ecco cosa cambia davvero.
      </p>
      <p style={articleTextStyle}>
        Su un giro più breve — diciamo 2-4 ore, più o meno quanto richiede un giro di 100 km a ritmo
        moderato — il limite principale è la{' '}
        <a href={faqHref('it', 'carb-transporter-mix')} style={articleLinkStyle}>
          soglia di assorbimento
        </a>{' '}
        del tuo intestino. Il tuo intestino può assumere solo un certo numero di grammi di
        carboidrati all'ora, qualunque sia la quantità che mangi. La buona notizia è che nell'arco
        di poche ore la stanchezza intestinale non si è ancora accumulata, quindi la maggior parte
        degli atleti riesce a mantenere l'apporto vicino alla cima del proprio range allenato per
        tutto il giro. Il rischio principale da gestire è semplice: restare senza carboidrati troppo
        presto e le gambe se ne accorgeranno nel tratto finale.
      </p>
      <p style={articleTextStyle}>
        Un giro ultra-distanza — 8 ore o più, il tipo di giornata in cui può trasformarsi un
        percorso di 300 km — cambia il quadro. L'energia totale bruciata nella giornata è enorme, ma
        l'intensità media cala naturalmente più si sta fuori a lungo. Un'intensità più bassa
        significa che il corpo ha effettivamente bisogno di un po' meno carboidrati all'ora rispetto
        a prima, il che allevia un po' il puro problema della soglia di assorbimento. Le sfide
        maggiori diventano altre: ore di alimentazione e idratazione continue logorano l'intestino,
        e lo stesso gel o mix da bere che sapeva bene alla seconda ora può diventare difficile da
        digerire all'ottava. Questo si chiama a volte stanchezza di gusto. Il cibo vero e le opzioni
        salate —{' '}
        <a href={faqHref('it', 'rice-cake-bars')} style={articleLinkStyle}>
          rice cake
        </a>
        , panini, snack salati — iniziano a contare molto di più, semplicemente perché danno una
        pausa al palato.
      </p>
      <p style={articleTextStyle}>
        Anche la logistica cambia scala. Un giro di 100 km può spesso essere completamente
        autosufficiente — porti tutto in borracce e tasche fin dalla partenza e non hai mai bisogno
        di fermarti. Un giro di 300 km di solito non può funzionare così: nessuno porta 8 ore o più
        di cibo e da bere fin dalla prima pedalata. I giri ultra-distanza dipendono da rifornimenti
        pianificati, quindi vale la pena{' '}
        <a href={faqHref('it', 'bottle-refill-planning')} style={articleLinkStyle}>
          mappare in anticipo le tappe di ricarica
        </a>{' '}
        invece di sperare di improvvisare in un negozio a caso.
      </p>
      <p style={articleTextStyle}>
        Ritmo e affaticamento interagiscono anche in un modo che un obiettivo orario fisso non
        coglie. Mentre rallenti nelle ore finali di un giro lungo, il tuo fabbisogno di carboidrati
        scende insieme all'intensità — ma allo stesso tempo la stanchezza può smorzare l'appetito e
        rendere l'intestino meno disposto a digerire il cibo. Un buon piano deve flettersi in
        entrambe le direzioni: abbassare l'obiettivo quando vai più piano, ma anche accorgersi del
        punto in cui il corpo semplicemente non vuole più mangiare, e adattarsi invece di forzare un
        numero fisso.
      </p>
      <p style={articleTextStyle}>
        Per sforzi davvero lunghi — eventi di ultra-endurance, giornate di bikepacking che arrivano
        fino a notte — sonno e buio aggiungono un altro livello. La disciplina nel mangiare e bere
        tende a scivolare quando sei stanco, ed è facile dimenticare un pasto programmato quando sei
        mezzo addormentato in bici. Aiuta pianificare deliberatamente in anticipo il fueling
        notturno, invece di fidarsi di ricordarselo sul momento.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling può modellare un giro sia per durata sia per percorso e ritmo, quindi lo stesso
        strumento si adatta da un'uscita di 3 ore a un'ultra-distanza di un'intera giornata — tu
        descrivi lo sforzo e lui calcola i numeri.
      </p>
      <p>
        <a href={calculatorHref('it')} style={articleLinkStyle}>
          Pianifica il tuo giro, breve o lungo →
        </a>
      </p>
    </FaqLayout>
  );
}
