import { faqHref, calculatorHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function MaltoFructoseBlendIt() {
  return (
    <FaqLayout lang="it" slug="malto-fructose-blend">
      <h1 style={articleH1Style}>
        Maltodestrine + fruttosio: perché una miscela di trasporto batte il solo glucosio
      </h1>
      <p style={articleTextStyle}>
        Le maltodestrine suonano come un ingrediente speciale, ma sono solo una catena di unità di
        glucosio legate insieme. L'intestino spezza quella catena quasi immediatamente, quindi
        quando arriva alla parete intestinale è semplice glucosio. «Carboidrato complesso» è una
        descrizione onesta della molecola, ma non cambia quale trasportatore usa per entrare nel
        sangue.
      </p>
      <p style={articleTextStyle}>
        Quel trasportatore si chiama SGLT1, e ha un limite di velocità fisso di circa 60 g all'ora,
        indipendentemente da come era confezionato il glucosio prima che lo bevessi. Trattiamo il
        meccanismo dietro quel limite — e perché un secondo trasportatore può alzarlo — nel nostro{' '}
        <a href={faqHref('it', 'carb-transporter-mix')} style={articleLinkStyle}>
          articolo sul mix di trasportatori glucosio/fruttosio
        </a>
        . In breve: le maltodestrine pure, in qualsiasi dose, si fermano comunque intorno ai 60 g/h.
      </p>
      <p style={articleTextStyle}>
        Questo è esattamente il motivo per cui la maggior parte dei gel e mix da bere moderni non
        sono più pure maltodestrine. I produttori aggiungono fruttosio direttamente, o usano
        ingredienti che lo contengono naturalmente, come il saccarosio (che è per metà fruttosio) o
        il miele. Il fruttosio usa un trasportatore separato, il GLUT5, quindi aggiungerlo apre una
        seconda porta per far entrare carboidrati nel sangue insieme alla prima.
      </p>
      <p style={articleTextStyle}>
        Il rapporto tra i due conta. Un buon punto di partenza è circa 2 parti di carboidrato
        equivalente-glucosio a 1 parte di fruttosio in peso — lo stesso predefinito «Izo» usato
        altrove in questa app. Quel rapporto usa la maggior parte della capacità dell'SGLT1
        aggiungendo abbastanza fruttosio da sfruttare bene anche il GLUT5.
      </p>
      <p style={articleTextStyle}>
        Andare troppo nell'altra direzione causa problemi propri. Il GLUT5 ha una soglia più bassa
        dell'SGLT1, quindi se il fruttosio è troppa parte del tuo mix, una parte non verrà assorbita
        in tempo. Quel fruttosio in eccesso resta nell'intestino e fermenta, il che è una causa
        comune di gonfiore, gas e crampi sui giri lunghi.
      </p>
      <p style={articleTextStyle}>
        Ecco anche perché vale la pena leggere la lista ingredienti di un gel o un mix invece che
        solo il testo di marketing. «Carboidrati complessi» o «energia a rilascio lento» sulla
        confezione non ti dice se il prodotto è solo maltodestrine o una miscela
        maltodestrine-fruttosio — e quella differenza decide quanto ne puoi davvero assorbire
        all'ora.
      </p>
      <p style={articleSourcesStyle}>
        Fonti:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/20574242/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Jeukendrup, Curr Opin Clin Nutr Metab Care 2010
        </a>{' '}
        (soglia dell'SGLT1 di ~60 g/h, soglia combinata più alta con una miscela
        glucosio-fruttosio).
      </p>
      <p>
        <a href={calculatorHref('it')} style={articleLinkStyle}>
          Costruisci un mix glucosio-fruttosio che combacia col tuo obiettivo orario →
        </a>
      </p>
    </FaqLayout>
  );
}
