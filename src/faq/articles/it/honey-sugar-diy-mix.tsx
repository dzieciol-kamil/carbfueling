import { faqHref, calculatorHref } from '../../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../../FaqLayout';

export default function HoneySugarDiyMixIt() {
  return (
    <FaqLayout lang="it" slug="honey-sugar-diy-mix">
      <h1 style={articleH1Style}>
        Miele o zucchero da tavola al posto di una miscela pronta — funziona altrettanto bene?
      </h1>
      <p style={articleTextStyle}>
        Sì, nella maggior parte dei casi funziona più o meno altrettanto bene. Sia lo zucchero da
        tavola (saccarosio) sia il miele forniscono all'intestino un mix di glucosio e fruttosio,
        che è esattamente quello che una bevanda sportiva formulata cerca di fare. Il meccanismo è
        lo stesso che spieghiamo in{' '}
        <a href={faqHref('it', 'carb-transporter-mix')} style={articleLinkStyle}>
          perché non puoi assorbire più di ~90 g di carboidrati all'ora
        </a>
        : il tuo intestino ha due porte separate per lo zucchero, e usarle entrambe insieme alza la
        tua soglia di assorbimento.
      </p>
      <p style={articleTextStyle}>
        Lo zucchero da tavola è una molecola chiamata saccarosio, fatta da un'unità di glucosio e
        una di fruttosio legate insieme. Un enzima nell'intestino chiamato saccarasi spezza quel
        legame quasi immediatamente, rilasciando glucosio libero e fruttosio libero in un rapporto
        di circa 1:1. Quindi anche se il saccarosio sembra «solo zucchero» sull'etichetta, il corpo
        lo trasforma nella stessa combinazione glucosio-fruttosio da cui è fatta una bevanda
        sportiva.
      </p>
      <p style={articleTextStyle}>
        Il miele è un po' diverso chimicamente. È già in gran parte glucosio e fruttosio liberi, non
        legati insieme come nel saccarosio. Il rapporto esatto varia un po' a seconda della fonte
        floreale, ma di solito sta vicino allo stesso 1:1 effettivo dello zucchero, solo leggermente
        spostato verso il fruttosio. È abbastanza vicino da far comportare il miele in modo simile
        allo zucchero da tavola ai fini dell'assorbimento.
      </p>
      <p style={articleTextStyle}>
        Confrontalo con le maltodestrine pure o la polvere di destrosio (glucosio), che alcuni
        atleti sciolgono in acqua pensando sia una fonte di carburante semplice ed economica. Quelle
        aprono solo la porta del glucosio. Qualunque sia la quantità che bevi, resti limitato a
        circa 60 g all'ora, e lo zucchero in eccesso resta semplicemente nello stomaco. Un mix fatto
        in casa con zucchero o miele ha in realtà un vantaggio qui: apre entrambe le porte, come una
        miscela commerciale a due carboidrati.
      </p>
      <p style={articleTextStyle}>
        Quello che rinunci con un mix fatto in casa è comodità e costanza. Un misurino pre-dosato di
        un prodotto commerciale ti dà la stessa dose ogni volta; pesare a mano zucchero o miele è
        più facile da sbagliare di poco. Le miscele commerciali sono anche di solito testate per
        l'osmolalità — quanto è concentrata la soluzione — quindi non serve richiamare acqua extra
        nell'intestino per assorbirla. Un mix fatto in casa troppo concentrato può causare lo stesso
        gonfiore e gli stessi crampi che stai cercando di evitare, quindi tienilo moderato e testalo
        in allenamento prima di affidarti ad esso durante un giro lungo o una gara.
      </p>
      <p style={articleTextStyle}>
        Niente di tutto questo rende un mix fatto in casa una scelta peggiore. È un'opzione
        genuinamente valida, molto più economica per tanti atleti — solo un diverso insieme di
        compromessi, non una prestazione peggiore. È anche per questo che lo strumento di mix di
        Carb Fueling include i preset integrati «Zucchero» e «Miele» accanto al rapporto standard
        glucosio-fruttosio, così puoi pianificare con entrambi usando la stessa matematica di
        assorbimento.
      </p>
      <p>
        <a href={calculatorHref('it')} style={articleLinkStyle}>
          Prova i preset zucchero e miele →
        </a>
      </p>
    </FaqLayout>
  );
}
