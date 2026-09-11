import { faqHref, calculatorHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function RunningVsCyclingCarbsIt() {
  return (
    <FaqLayout lang="it" slug="running-vs-cycling-carbs">
      <h1 style={articleH1Style}>
        Corsa vs bici: come cambiano davvero il fabbisogno e l'assorbimento dei carboidrati
      </h1>
      <p style={articleTextStyle}>
        I runner spesso pensano che il loro intestino gestisca i carboidrati peggio di quello di un
        ciclista. La ricerca dice qualcosa di più specifico: il tuo meccanismo di assorbimento non
        cambia davvero tra i due sport. Ciò che cambia è quanto carico meccanico subisce il runner
        allo stesso tempo — ed è per questo che gli stessi numeri sulla carta possono giocare in
        modo molto diverso nella pratica.
      </p>
      <p style={articleTextStyle}>
        Parti dalla parte che resta uguale. Gli studi che confrontano direttamente l'ossidazione dei
        carboidrati esogeni tra corsa e bici a sforzo simile non hanno trovato differenze rilevanti
        in quanto carboidrato il corpo potesse davvero processare all'ora. La soglia di assorbimento
        dell'intestino — determinata dai trasportatori di zucchero nella parete intestinale,
        spiegata in{' '}
        <a href={faqHref('it', 'carb-transporter-mix')} style={articleLinkStyle}>
          perché non puoi assorbire più di circa 90 g di carboidrati all'ora
        </a>{' '}
        — è una proprietà del tuo intestino, non dello sport che stai praticando.
      </p>
      <p style={articleTextStyle}>
        Allora perché correre risulta così spesso peggio? Perché capacità di assorbimento e comfort
        non sono la stessa cosa. La corsa aggiunge uno stress meccanico che la bici non ha: ogni
        appoggio del piede fa rimbalzare lo stomaco e alza la pressione intra-addominale in un modo
        che pedalare non fa mai. Quello scuotimento extra — oltre al flusso sanguigno deviato
        dall'intestino che qualsiasi sforzo duro causa, trattato in{' '}
        <a href={faqHref('it', 'pace-power-absorption')} style={articleLinkStyle}>
          se ritmo o potenza influenzano quanto puoi assorbire
        </a>{' '}
        — basta a far scivolare in un problema reale, a piedi, uno stomaco che in bici sarebbe stato
        a posto.
      </p>
      <p style={articleTextStyle}>
        I numeri lo confermano. Gli studi su eventi ultra-distanza mettono i disturbi
        gastrointestinali al 70-85% dei runner nelle gare multi-tappa o di 24 ore. Studi comparabili
        sui ciclisti non hanno trovato alcun legame tra cosa mangiavano o bevevano gli atleti e se
        avevano sintomi gastrointestinali. Stesso carburante, intensità grossomodo simile, esito
        molto diverso — perché lo sport stesso fa parte dello stress, non solo lo sforzo.
      </p>
      <p style={articleTextStyle}>
        La conclusione pratica non è "mangia meno perché il tuo intestino è più debole". È "mangia
        con meno margine d'errore, perché lo stesso piano grammo per grammo ha meno spazio per
        andare storto". Gli intervalli di carboidrati all'ora per intensità e durata in{' '}
        <a href={faqHref('it', 'carbs-per-hour-by-intensity')} style={articleLinkStyle}>
          quanti carboidrati all'ora servono davvero
        </a>{' '}
        sono stati costruiti intorno al ciclismo; correndo alla stessa durata e intensità, è sensato
        puntare all'estremità bassa di quell'intervallo, o un gradino sotto, invece che alla cima.
      </p>
      <p style={articleTextStyle}>
        Questo è anche il motivo per cui l'allenamento intestinale non si trasferisce perfettamente
        tra sport. Uno stomaco che gestisce comodamente 80 g/h in bici non è mai stato testato
        contro l'impatto dell'appoggio del piede — lo stressor meccanico è semplicemente assente da
        quell'allenamento. Vedi{' '}
        <a href={faqHref('it', 'gut-training-carb-tolerance')} style={articleLinkStyle}>
          allenare l'intestino
        </a>
        . In pratica, questo significa che se vuoi alzare la tua tolleranza ai carboidrati per la
        corsa, devi fare la progressione e allenare l'intestino correndo, non solo in bici.
      </p>
      <p style={articleSourcesStyle}>
        Fonti:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/21049089/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Pfeiffer et al., Med Sci Sports Exerc 2011
        </a>{' '}
        (ossidazione dei carboidrati, corsa vs. bici);{' '}
        <a
          href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4701764/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Costa et al., Sports Med Open 2016
        </a>{' '}
        (sintomi gastrointestinali negli ultramaratoneti);{' '}
        <a
          href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11753326/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Eur J Appl Physiol 2024
        </a>{' '}
        (sintomi gastrointestinali e nutrizione in un evento ciclistico non professionistico).
      </p>
      <p>
        <a href={calculatorHref('it')} style={articleLinkStyle}>
          Pianifica il tuo apporto di carboidrati →
        </a>
      </p>
    </FaqLayout>
  );
}
