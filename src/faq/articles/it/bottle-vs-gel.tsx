import { faqHref, calculatorHref } from '../../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../../FaqLayout';

export default function BottleVsGelIt() {
  return (
    <FaqLayout lang="it" slug="bottle-vs-gel">
      <h1 style={articleH1Style}>Borraccia o gel? Quando e cosa scegliere</h1>
      <p style={articleTextStyle}>
        I carboidrati possono arrivare al tuo corpo in poche forme diverse: sciolti in una
        borraccia, racchiusi in un gel, o mangiati come cibo solido. Ogni formato ha un compromesso
        reale. Scegliere quello giusto per il momento — non un solo formato per tutto il giro — è
        ciò che fa funzionare un piano di fueling.
      </p>
      <p style={articleTextStyle}>
        Un mix in borraccia è il formato più facile da usare in continuo. Bevi al tuo ritmo, e ogni
        sorso fornisce carboidrati e liquidi insieme, il che è efficiente nei giri caldi dove ti
        servono entrambi comunque. Il limite è che una borraccia contiene una sola concentrazione.
        Una volta mescolata non puoi cambiarla a metà giro, e una volta vuota, ricaricarla richiede
        un piano — un negozio o una tappa di supporto. Se vuoi la parte logistica già risolta, la
        trattiamo in un articolo separato su{' '}
        <a href={faqHref('it', 'bottle-refill-planning')} style={articleLinkStyle}>
          come pianificare le ricariche delle borracce
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        I gel risolvono il problema dell'ingombro. Una singola bustina di gel è piccola e densa,
        così puoi portare diverse ore di carboidrati in una tasca della maglia senza molto peso o
        volume. Il dosaggio è preciso — ogni bustina ha una quantità di carboidrati fissa e nota,
        quindi non devi indovinare quanto hai appena assunto. Il compromesso è che un gel è
        concentrato. Preso da solo, senza acqua, può restare pesante nello stomaco o attraversare
        l'intestino più velocemente di quanto vorresti. La maggior parte dei gel funziona meglio
        seguita da un sorso d'acqua. E ogni bustina lascia un involucro da tenere da qualche parte
        finché non lo puoi buttare.
      </p>
      <p style={articleTextStyle}>
        Il cibo solido è il formato che spesso ci si dimentica di pianificare, ma si guadagna il suo
        posto nei giri più lunghi e regolari. Masticare e digerire più lentamente non sono un
        problema quando l'intensità è abbastanza bassa — e il cibo vero aggiunge gusto e consistenza
        che un giro fatto solo di gel dolci e bevanda sportiva non può dare. Nelle giornate molto
        lunghe, quella varietà conta molto, perché "resetta" il gusto dolce in bocca e ti permette
        di continuare ad assumere carboidrati anche quando non hai più appetito per lo zucchero. Il
        limite è l'intensità e il terreno: è difficile masticare e deglutire mentre spingi forte, ed
        è scomodo mangiare del tutto su terreno tecnico e sconnesso dove ti servono entrambe le mani
        sul manubrio.
      </p>
      <p style={articleTextStyle}>
        Nella pratica, la maggior parte degli atleti non sceglie un solo formato per tutto il giro —
        li combina. La borraccia è la base, il livello costante, sorseggiata per tutto il tempo. Il
        gel è la ricarica veloce prima di uno sforzo duro, come una salita lunga o uno scatto,
        quando vuoi carboidrati subito senza fermarti a bere dalla borraccia. Il cibo solido riempie
        i tratti calmi e regolari, dove masticare non costa nulla e un cambio di gusto ti aiuta a
        digerire un altro gel più tardi.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling ti permette di pianificare con tutti e tre i formati in un unico posto.
        Aggiungi una borraccia di carboidrati, un gel o una banana al tuo piano, e ti mostra se la
        combinazione copre davvero il tuo fabbisogno orario di carboidrati — ora per ora, non solo
        come totale del giro.
      </p>
      <p>
        <a href={calculatorHref('it')} style={articleLinkStyle}>
          Costruisci un piano che combina borraccia, gel e cibo →
        </a>
      </p>
    </FaqLayout>
  );
}
