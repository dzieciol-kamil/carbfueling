import { faqHref, calculatorHref } from '../../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../../FaqLayout';

export default function RiceCakeBarsIt() {
  return (
    <FaqLayout lang="it" slug="rice-cake-bars">
      <h1 style={articleH1Style}>
        Rice cake fatti in casa: una ricetta di cibo vero per quando i gel stancano
      </h1>
      <p style={articleTextStyle}>
        Il nostro articolo su{' '}
        <a href={faqHref('it', 'fueling-100km-vs-300km')} style={articleLinkStyle}>
          fueling per 100 km vs. 300+ km
        </a>{' '}
        nota che dopo abbastanza ore, lo stesso gel o bevanda che sapeva bene all'inizio può
        diventare difficile da digerire — stanchezza di gusto. I rice cake sono una risposta
        classica a questo problema: una barretta di riso densa e compatta popolare tra ciclisti a
        lunga distanza e ultra-runner proprio perché non sa affatto di gel dolce o bevanda
        isotonica.
      </p>
      <p style={articleTextStyle}>Ricetta, per 8 barrette:</p>
      <ul style={{ ...articleTextStyle, paddingLeft: 20 }}>
        <li>200 g di riso per sushi</li>
        <li>200 ml di latte di cocco — solo la parte densa e solida</li>
        <li>80 g di datteri freschi (vanno bene anche secchi)</li>
        <li>350 ml di acqua per la cottura (più acqua a parte per sciacquare il riso)</li>
        <li>4 cucchiai di zucchero</li>
        <li>3 pizzichi di sale</li>
      </ul>
      <p style={articleTextStyle}>
        Sciacqua il riso due volte e cuocilo in circa 2,5 volte il suo volume di acqua per 20
        minuti, poi incorpora il latte di cocco solido, i datteri, lo zucchero e il sale. Modella il
        composto su carta forno in un blocco rettangolare uniforme — dei taglieri premuti contro i
        lati aiutano a tenere i bordi dritti — e mettilo in frigo o freezer per qualche ora finché
        non si rassoda. Taglia in 8 pezzi uguali e avvolgili singolarmente. Si conserva in frigo
        fino a 3 giorni, o indefinitamente in freezer.
      </p>
      <p style={articleTextStyle}>
        Un pezzo corrisponde a circa 140 kcal, 30 g di carboidrati, 2 g di proteine e 2 g di grassi.
        A un tipico obiettivo di{' '}
        <a href={faqHref('it', 'carbs-per-hour-by-intensity')} style={articleLinkStyle}>
          60-90 g di carboidrati all'ora
        </a>
        , una barretta copre circa mezz'ora, quindi è facile calcolare quanti pezzi servono per un
        dato tratto del tuo giro — allo stesso modo di qualsiasi altro prodotto inserito in un piano
        Carb Fueling.
      </p>
      <p style={articleTextStyle}>
        Il vantaggio di questo formato è la consistenza: mantiene la forma in una tasca della
        maglia, non si sbriciola e non si scioglie come può fare un gel col caldo. Il grasso del
        latte di cocco dà anche una sensazione di sazietà più lunga rispetto al solo zucchero, il
        che può aiutare nel tratto più calmo di un giro lungo, quando non serve più solo un picco
        veloce di energia.
      </p>
      <p style={articleTextStyle}>
        Un'avvertenza: questa ricetta in particolare resta dolce — ci pensano datteri e zucchero. Se
        il tuo problema è nello specifico la stanchezza da dolce e non solo la consistenza del gel,
        riduci lo zucchero o sostituisci i datteri con qualcosa di meno dolce. Un rice cake rompe la
        monotonia solo se il suo sapore contrasta davvero con quello che hai già in borraccia.
      </p>
      <p>
        <a href={calculatorHref('it')} style={articleLinkStyle}>
          Aggiungi il rice cake al tuo piano →
        </a>
      </p>
    </FaqLayout>
  );
}
