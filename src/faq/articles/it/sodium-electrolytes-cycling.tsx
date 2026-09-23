import { calculatorHref, faqHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function SodiumElectrolytesCyclingIt() {
  return (
    <FaqLayout lang="it" slug="sodium-electrolytes-cycling">
      <h1 style={articleH1Style}>
        Sodio in bici: quando gli elettroliti extra fanno davvero la differenza
      </h1>
      <p style={articleTextStyle}>
        Il sudore non è solo acqua. Porta con sé anche sodio, e quanto sodio porta varia moltissimo
        da un atleta all'altro. Alcune persone perdono circa 200 mg di sodio per litro di sudore.
        Altre ne perdono oltre 2000 mg per litro — dieci volte tanto, allo stesso volume di sudore.
        Questa differenza è in gran parte fissata dal tuo corpo, non dalla forma fisica o
        dall'allenamento.
      </p>
      <p style={articleTextStyle}>
        Gli atleti all'estremità alta vengono spesso chiamati «sudatori salati». Di solito puoi
        accorgertene da solo: se la pelle o i vestiti si ricoprono di una crosta o un residuo bianco
        visibile dopo un giro, è sale secco lasciato dal sudore evaporato. È un segnale semplice e
        utile che stai perdendo più sodio della maggior parte degli atleti.
      </p>
      <p style={articleTextStyle}>
        Per la maggior parte degli atleti, nella maggior parte dei giri, questo non richiede troppi
        pensieri. Se il tuo giro dura meno di due-tre ore e le condizioni sono normali, il sodio già
        presente nella tua dieta, più quello già nei tuoi gel o mix di carboidrati, di solito basta.
        Un'integrazione extra di elettroliti sopra a quello spesso non serve.
      </p>
      <p style={articleTextStyle}>
        Inizia a contare di più in alcune situazioni specifiche: sforzi lunghi al caldo, atleti che
        già sanno di sudare molto o in modo salato, ed eventi di più ore o più giorni. In questi
        casi, le perdite di sodio si accumulano nel tempo. Nei casi estremi, può portare a una
        condizione seria chiamata iponatriemia associata all'esercizio, in cui il sodio nel sangue
        scende a un livello pericoloso perché troppo liquido semplice lo ha diluito nell'arco di
        molte ore.
      </p>
      <p style={articleTextStyle}>
        Se rientri in uno di questi gruppi a rischio più alto, non devi indovinare. Gli atleti che
        sanno di sudare molto o in modo salato, o che vanno a lungo in condizioni calde, possono
        aggiungere compresse di elettroliti o sale extra alla borraccia o al gel. Due modi semplici
        per capire a che punto sei: cerca il residuo di sale dopo un giro, oppure fai un{' '}
        <a href={faqHref('it', 'hydration-water-per-hour')} style={articleLinkStyle}>
          test di pesata del tasso di sudorazione
        </a>{' '}
        (pesandoti prima e dopo un'ora a sforzo costante).
      </p>
      <p style={articleTextStyle}>
        La conclusione non è «aggiungi sempre sodio extra». È «conosci il tuo profilo di sudorazione
        e adattati alle condizioni». La maggior parte degli atleti occasionali su giri moderati può
        lasciar perdere. Chi fa sforzi lunghi, caldi o di più giorni — specialmente se sospetta già
        di essere un sudatore salato — è chi trae il maggior beneficio dal prestarci attenzione.
      </p>
      <p style={articleTextStyle}>
        Se conosci la tua concentrazione di sodio nel sudore — da un test di laboratorio, o stimata
        dai segnali di sudatore salato qui sopra — puoi tradurla nel pannello Mix di Carb Fueling.
        Il campo «sale» lì indica i grammi di normale sale da cucina (NaCl) per 100 ml, non sodio
        puro — usiamo il sale perché è quello che aggiungeresti davvero a una borraccia; il sodio
        puro è un metallo altamente reattivo che non puoi comprare né aggiungere a una bevanda. Come
        approssimazione, ogni 0,1 g di sale per 100 ml di bevanda fornisce circa 390 mg di sodio per
        litro. Quindi se punti, ad esempio, a 700 mg di sodio per litro, sono circa 0,18 g di sale
        per 100 ml.
      </p>
      <p style={articleSourcesStyle}>
        Fonti:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/27478425/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Lara et al., J Int Soc Sports Nutr 2016
        </a>{' '}
        (intervallo di sodio nel sudore su 157 maratoneti: circa 160-2200 mg/l, divisi in sudatori
        bassi/tipici/salati).
      </p>
      <p>
        <a href={calculatorHref('it')} style={articleLinkStyle}>
          Pianifica insieme carboidrati e liquidi →
        </a>
      </p>
    </FaqLayout>
  );
}
