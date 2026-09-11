import { faqHref, calculatorHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function PacePowerAbsorptionIt() {
  return (
    <FaqLayout lang="it" slug="pace-power-absorption">
      <h1 style={articleH1Style}>Ritmo o potenza influenzano quanto puoi assorbire?</h1>
      <p style={articleTextStyle}>
        È facile confondere due cose diverse: quanti carboidrati brucia il tuo sforzo, e quanti
        carboidrati il tuo intestino può assorbire. Non sono la stessa cosa, e non si muovono
        insieme. Il tasso di consumo — quanti carboidrati il corpo richiede all'ora — sale
        direttamente con quanto spingi. Il tasso di assorbimento — quanti carboidrati l'intestino
        può davvero assumere all'ora — è determinato soprattutto da un sistema separato
        nell'intestino, e non scala allo stesso modo.
      </p>
      <p style={articleTextStyle}>
        L'impostazione di intensità di Carb Fueling (bassa, media, alta) cambia il lato del
        fabbisogno dell'equazione: stima quanti carboidrati brucia un dato percorso all'ora in base
        a quanto stai spingendo. Ma quel numero è solo metà del quadro. L'altra metà è la soglia di
        assorbimento del tuo intestino — un limite in gran parte separato, fissato dalle proteine di
        trasporto nella parete intestinale, spiegato in{' '}
        <a href={faqHref('it', 'carb-transporter-mix')} style={articleLinkStyle}>
          perché non puoi assorbire più di circa 90 g di carboidrati all'ora
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        Ecco la parte che sorprende: per la maggior parte dell'intervallo di intensità a cui pedali
        davvero, quella soglia di assorbimento resta più o meno costante. Che tu stia spingendo
        piano o mantenendo un tempo solido, il tuo intestino riesce comunque a muovere circa 60 g/h
        da una singola fonte di carboidrati, o fino a circa 90 g/h da una buona miscela
        glucosio-fruttosio. Andare più forte aumenta quanto ti serve. Non aumenta automaticamente
        quanto puoi assumere.
      </p>
      <p style={articleTextStyle}>
        Questo cambia all'estremo della scala di sforzo. Sopra circa l'80-90% del tuo sforzo massimo
        — scatti duri, o gara a soglia o oltre — il corpo devia il flusso sanguigno dall'intestino
        verso i muscoli in lavoro e la pelle. Meno sangue che raggiunge l'intestino significa
        svuotamento gastrico e assorbimento più lenti. Con sforzi davvero massimali, la tua soglia
        può calare proprio quando il fabbisogno è al massimo. Questo disallineamento è gran parte
        del motivo per cui gli sforzi molto duri hanno molte più probabilità di causare problemi di
        stomaco.
      </p>
      <p style={articleTextStyle}>
        Per la maggior parte del ciclismo di endurance — sforzi costanti, da moderati a duri, di più
        ore — non si raggiunge mai quella zona estrema. Quindi puoi ragionevolmente assumere che la
        tua soglia di assorbimento allenata regga per tutto il giro. È nel correre a un'intensità
        sostenuta molto alta che il fueling diventa davvero più difficile, e non semplicemente
        perché ti servono più carboidrati. La tua capacità di assumerli può ridursi proprio nel
        momento sbagliato.
      </p>
      <p style={articleTextStyle}>
        Questo è uno dei motivi per cui{' '}
        <a href={faqHref('it', 'gut-training-carb-tolerance')} style={articleLinkStyle}>
          l'allenamento intestinale
        </a>{' '}
        dovrebbe includere anche un po' di pratica a sforzi duri rilevanti per la gara, non solo
        giri facili. Quanto tolleri bene i carboidrati in un'uscita leggera dice poco su quanto li
        tollererai bene nel pieno di una gara dura. Testare il tuo fueling all'intensità a cui
        gareggerai davvero è ciò che ti dice la verità.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling tiene queste due cose visibili fianco a fianco: l'impostazione di intensità
        guida quanti carboidrati richiede il tuo giro, e il rapporto del tuo mix fissa la soglia di
        quanti puoi assorbirne. Vedere entrambe insieme rende ovvio quando un piano sta chiedendo al
        tuo intestino più di quanto può fornire.
      </p>
      <p style={articleSourcesStyle}>
        Fonti:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/28589631/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Costa et al., Aliment Pharmacol Ther 2017
        </a>{' '}
        (revisione sistematica: ad alta intensità di esercizio, il sangue viene deviato
        dall'intestino, rallentando svuotamento gastrico e assorbimento).
      </p>
      <p>
        <a href={calculatorHref('it')} style={articleLinkStyle}>
          Guarda insieme il tuo fabbisogno e la tua soglia →
        </a>
      </p>
    </FaqLayout>
  );
}
