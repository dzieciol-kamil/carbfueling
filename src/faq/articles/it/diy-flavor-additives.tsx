import { faqHref, calculatorHref } from '../../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../../FaqLayout';

export default function DiyFlavorAdditivesIt() {
  return (
    <FaqLayout lang="it" slug="diy-flavor-additives">
      <h1 style={articleH1Style}>
        Aggiunte di gusto fatte in casa: modi semplici per migliorare il sapore di borraccia o gel
      </h1>
      <p style={articleTextStyle}>
        Il gusto non è solo un extra piacevole su un giro lungo. Dopo qualche ora, lo stesso sapore
        dolce diventa davvero più difficile da digerire — gli atleti la chiamano "stanchezza di
        gusto" o affaticamento del palato. Il tuo mix non è cambiato, ma la tua tolleranza sì. Se
        hai un modo per variare o migliorare il gusto, è più probabile che continui a bere e
        mangiare secondo programma, il che conta molto più di quanto sembri. Un piano di carboidrati
        funziona solo se lo segui davvero.
      </p>
      <p style={articleTextStyle}>
        Le essenze o gli estratti aromatici sono la soluzione più semplice. Poche gocce di succo di
        limone, lime o arancia bastano e avanzano. Non aggiungono calorie significative e non
        cambiano l'osmolalità della bevanda, quindi non ti daranno fastidio allo stomaco né
        cambieranno come viene assorbito il mix.
      </p>
      <p style={articleTextStyle}>
        La frutta liofilizzata in polvere è un'altra opzione. Dà un vero sapore di frutta, più una
        piccola quantità di carboidrati extra, che è un bonus e non un problema. L'unico
        inconveniente è che può fare grumi se la versi direttamente in una borraccia piena. Una
        soluzione semplice: mescola prima la polvere in una piccola quantità d'acqua, finché forma
        una pasta liscia, poi aggiungila al resto della borraccia. Funziona meglio per una
        borraccia, o per un gel fatto in casa.
      </p>
      <p style={articleTextStyle}>
        L'ibisco, o una leggera infusione di tè, vale la pena provarlo se vuoi una nota acidula
        naturale. L'ibisco è naturalmente aspro, quindi aggiungerne un po' ti permette di ridurre
        l'acido citrico o il limone aggiunti pur mantenendo una piacevole nota pungente nel mix. È
        un buon modo per variare il lato acido della tua ricetta oltre il semplice acido citrico — e
        in Carb Fueling puoi già scegliere limone o lime al posto dell'acido citrico puro per quella
        parte del mix, quindi l'ibisco è semplicemente un'opzione in più da alternare.
      </p>
      <p style={articleTextStyle}>
        Non trascurare il sale in sé. Un pizzico non fa solo da apporto di sodio — funziona anche da
        esaltatore di sapore, allo stesso modo in cui un pizzico di sale arrotonda un piatto che
        sembra piatto. Se il tuo mix sa di poco o di monotono, un po' di sale in più è spesso la
        soluzione, a parte quale sia il tuo obiettivo complessivo di sodio (vedi{' '}
        <a href={faqHref('it', 'sodium-electrolytes-cycling')} style={articleLinkStyle}>
          quanto sodio ti serve davvero in bici
        </a>
        ).
      </p>
      <p style={articleTextStyle}>
        Per il lato dolcificante del tuo mix — zucchero, miele o una miscela glucosio-fruttosio
        formulata — vedi{' '}
        <a href={faqHref('it', 'honey-sugar-diy-mix')} style={articleLinkStyle}>
          miele o zucchero da tavola al posto di una miscela pronta
        </a>
        . Le aggiunte di gusto come queste sopra funzionano insieme a qualsiasi di quelle scelte;
        cambiano il sapore, non la matematica di base dei carboidrati.
      </p>
      <p>
        <a href={calculatorHref('it')} style={articleLinkStyle}>
          Imposta il tuo dolcificante e l'ingrediente acido →
        </a>
      </p>
    </FaqLayout>
  );
}
