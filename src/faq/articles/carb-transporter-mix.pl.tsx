import { faqHref, calculatorHref, assetHref } from '../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../FaqLayout';

export default function CarbTransporterMixPl() {
  return (
    <FaqLayout lang="pl" slug="carb-transporter-mix">
      <h1 style={articleH1Style}>
        Dlaczego nie wchłoniesz więcej niż ok. 90 g węglowodanów na godzinę?
      </h1>
      <p style={articleTextStyle}>
        Jelito wchłania cukier dwoma osobnymi kanałami — a właściwie dwoma różnymi białkami
        transportowymi wbudowanymi w ścianę jelita. Glukoza korzysta z jednego, nazywanego SGLT1,
        fruktoza z drugiego, GLUT5. To fizycznie osobne systemy, więc każdy ma swój niezależny limit
        prędkości.
      </p>
      <p style={articleTextStyle}>
        Transporter SGLT1 przepuszcza maksymalnie ok. 60 g glukozy na godzinę — niezależnie od tego,
        ile jej wypijesz. To aktywny mechanizm sprzężony z sodem, który po prostu wysyca się przy
        tym tempie. Jeśli pijesz samą maltodekstrynę albo żele czysto glukozowe, 60 g/h to Twój
        twardy sufit. Nadmiar zalega w żołądku i kończy się wzdęciami albo skurczami.
      </p>
      <p style={articleTextStyle}>
        Fruktoza korzysta z transportera GLUT5, osobny kanał, który wysyca się przy ok. 30 g na
        godzinę (zobacz{' '}
        <a href={faqHref('pl', 'gut-training-carb-tolerance')} style={articleLinkStyle}>
          jak wytrenować jelito, żeby zwiększyć tolerancję na węglowodany
        </a>
        ). Dodając fruktozę do miksu, otwierasz obie bramki naraz — dlatego mieszanki
        glukozowo-fruktozowe podnoszą realny sufit do ok. 90 g na godzinę.
      </p>
      <p style={articleTextStyle}>
        To nie tylko teoria — zostało to bezpośrednio zmierzone. Fizjolodzy sportu badają to w
        testach z podwójnym znacznikiem izotopowym, śledząc, jak szybko spożyty cukier faktycznie
        trafia do spalania (utlenianie węglowodanów egzogennych). Badania nad łączonym podawaniem
        glukozy i fruktozy (Jeukendrup, 2010) pokazały, że łączenie źródeł węglowodanów
        korzystających z różnych transporterów — określane przez niego jako "wielokrotnie
        transportowalne węglowodany" — pozwala utleniać cukry o około połowę szybciej niż sama
        glukoza — dokładnie tak, jak różnica między ok. 60 g/h a ok. 90 g/h opisana wyżej (w
        badaniach laboratoryjnych mierzono nawet ok. 105 g/h).
      </p>
      <img
        src={assetHref('/faq/carb-transporter-mix/absorption-cap.png')}
        alt="Panel miksu pokazujący presety proporcji glukoza:fruktoza i wynikowy sufit wchłaniania w Carb Fueling."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Proporcja ma znaczenie. Za dużo fruktozy i marnujesz zapas kanału od glukozy; za mało i
        marnujesz zapas kanału od fruktozy. Proporcja 2:1 (glukoza do fruktozy wagowo) to dobry
        punkt startowy dla większości rowerzystów — to domyślny miks "Izo" w Carb Fueling.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling liczy Twój indywidualny sufit na podstawie ustawionej proporcji i pokazuje go
        na bieżąco przy zmianie miksu.
      </p>
      <p style={articleSourcesStyle}>
        Źródła:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/20574242/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Jeukendrup, Curr Opin Clin Nutr Metab Care 2010
        </a>{' '}
        (wielokrotnie transportowalne węglowodany, utlenianie do ok. 105 g/h).
      </p>
      <p>
        <a href={calculatorHref('pl')} style={articleLinkStyle}>
          Sprawdź swój sufit →
        </a>
      </p>
    </FaqLayout>
  );
}
