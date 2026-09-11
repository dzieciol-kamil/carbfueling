import { calculatorHref, faqHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function HydrationWaterPerHourIt() {
  return (
    <FaqLayout lang="it" slug="hydration-water-per-hour">
      <h1 style={articleH1Style}>
        Quanta acqua all'ora? Idratazione, caldo e tasso di sudorazione
      </h1>
      <p style={articleTextStyle}>
        Non esiste un unico numero «bevi X ml all'ora» che vada bene per ogni atleta. Il tasso di
        sudorazione varia enormemente da persona a persona — circa da 0,5 a 2,5 litri all'ora, a
        volte di più. Dipende dalla tua corporatura, dalla tua forma fisica e acclimatazione al
        caldo, dalla temperatura dell'aria e dall'umidità, e da quanto stai spingendo. Due atleti
        sullo stesso percorso, allo stesso ritmo, possono perdere quantità di liquidi molto diverse.
      </p>
      <p style={articleTextStyle}>
        Il modo classico per trovare il tuo numero personale è un semplice test di pesata. Pesati
        subito prima di un'ora a sforzo costante e di nuovo subito dopo, senza bere nulla durante
        quell'ora (o, se bevi, sottrai dal risultato quanto hai bevuto). Il peso perso è più o meno
        la tua perdita di sudore per quell'ora, dato che 1 kg di peso corporeo perso corrisponde a
        circa 1 litro di liquido. Fai questo test in una giornata calda e in una fresca e vedrai
        quanto si sposta il numero.
      </p>
      <p style={articleTextStyle}>
        Temperatura e umidità spingono entrambe il tasso di sudorazione verso l'alto, e lo fanno in
        modi diversi. Una temperatura più alta semplicemente fa produrre più sudore al corpo per
        restare fresco. L'umidità rende quel sudore meno utile: il raffreddamento dipende
        dall'evaporazione del sudore dalla pelle, e in aria umida evapora più lentamente. Per questo
        una giornata calda e umida può risultare più difficile da gestire di una calda e secca alla
        stessa temperatura sul termometro — il tuo corpo suda molto ma ne ricava meno beneficio di
        raffreddamento.
      </p>
      <p style={articleTextStyle}>
        Questo crea un vero compromesso con il tuo mix di carboidrati. Se mescoli la borraccia forte
        per raggiungere un obiettivo alto di carboidrati, sei limitato in quanto liquido semplice
        quella borraccia può anche contenere. In un giro caldo, quel mix concentrato potrebbe non
        darti abbastanza acqua per stare al passo con le perdite di sudore. Molti atleti risolvono
        portando una borraccia separata di sola acqua accanto al mix di carboidrati nelle giornate
        calde, invece di aspettarsi che una sola borraccia copra sia idratazione sia carburante.
      </p>
      <p style={articleTextStyle}>
        Non devi rimpiazzare ogni grammo di sudore perso in tempo reale — accumulare un piccolo
        deficit di liquidi in poche ore è normale e ben tollerato. Ma lasciare che quel deficit
        cresca troppo ha dei costi. Una disidratazione significativa danneggia direttamente la
        prestazione, e rallenta anche lo svuotamento gastrico, il che significa che i carboidrati
        che stai bevendo o mangiando vengono assorbiti più lentamente proprio quando ti servono più
        in fretta.
      </p>
      <p style={articleTextStyle}>
        L'unità naturale per quel deficit è la percentuale della massa corporea, perché è l'unità in
        cui ogni studio riporta i propri risultati — e perché un litro significa qualcosa di molto
        diverso per un corridore di 55 kg rispetto a un ciclista di 95 kg. Per un ciclista di 75 kg,
        un litro in meno è circa l'1,3% della massa corporea. Fino a circa il 2%, le prove di un
        reale costo sulla prestazione sono deboli, e la stessa soglia del 2% è oggetto di un vero
        dibattito: diversi studi in cieco non trovano nulla al 2-3%, mentre altri trovano un calo
        chiaro allo stesso valore. Trattalo come una zona di allerta morbida, non come un limite
        netto.
      </p>
      <p style={articleTextStyle}>
        Conta più del numero il clima in cui lo raccogli. Sawka, Cheuvront e Kenefick (2015) hanno
        trovato che il costo di un deficit è trascurabile finché la temperatura della pelle non
        supera circa 27 °C — nel loro riepilogo della letteratura, nessuno studio al freddo (2-10
        °C) mostrava un calo, mentre 8 su 9 sopra i 25 °C sì. Lo stesso deficit del 2% ti costa
        quasi nulla in una giornata fredda e diversi punti percentuali di prestazione con caldo
        vero. Ecco perché Carb Fueling valuta la stessa carenza in modo diverso a seconda della
        temperatura che imposti: a 20 °C e sotto la barra resta verde fino al 2,5% della massa
        corporea, e a 30 °C e sopra solo fino all'1,2%.
      </p>
      <p style={articleTextStyle}>
        L'altro estremo della scala è più raro ma più pericoloso. Bere oltre le proprie perdite di
        sudore diluisce{' '}
        <a href={faqHref('it', 'sodium-electrolytes-cycling')} style={articleLinkStyle}>
          il sodio nel sangue
        </a>{' '}
        e porta all'iponatriemia associata all'esercizio — l'unica modalità di guasto acuto in tutto
        questo argomento con un percorso documentato fino a un letto d'ospedale, e che tipicamente
        colpisce gli atleti più lenti che bevono a ogni ristoro «per sicurezza». Per questo la barra
        di idratazione diventa rosso scuro anche per un surplus: non c'è nessun premio per aver
        bevuto più di quanto hai perso.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling prende la temperatura che imposti per il tuo percorso e il tuo sforzo, e la usa
        per stimare il tuo fabbisogno di liquidi in ml all'ora insieme al tuo piano di carboidrati —
        così non devi indovinare o fare il tuo test di pesata a metà giro. Il numero sopra la barra
        di idratazione è proprio quel bilancio: un meno è una carenza, un più significa che il piano
        ti fa bere più di quanto sudi.
      </p>
      <p style={articleSourcesStyle}>
        Fonti:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/26553489/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Sawka, Cheuvront, Kenefick, Sports Med 2015
        </a>{' '}
        (la soglia dei 27 °C di temperatura della pelle sopra la quale la disidratazione inizia a
        colpire la prestazione).
      </p>
      <p>
        <a href={calculatorHref('it')} style={articleLinkStyle}>
          Pianifica insieme i tuoi obiettivi di liquidi e carboidrati →
        </a>
      </p>
    </FaqLayout>
  );
}
