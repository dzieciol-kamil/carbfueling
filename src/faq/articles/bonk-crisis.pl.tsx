import { faqHref, calculatorHref, assetHref } from '../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../FaqLayout';

export default function BonkCrisisPl() {
  return (
    <FaqLayout lang="pl" slug="bonk-crisis">
      <h1 style={articleH1Style}>Co się dzieje, gdy "łapiesz bombę" — i jak to przewidzieć</h1>
      <p style={articleTextStyle}>
        Bomba nie przychodzi nagle. To efekt luki, która rośnie przez całą trasę — między
        węglowodanami, które spalasz, a tymi, które faktycznie dostarczasz.
      </p>
      <p style={articleTextStyle}>
        Mięśnie spalają węglowodany w tempie zależnym od wysiłku: mocniejsze tempo, szybsze
        spalanie. Jelito dostarcza węglowodany we własnym tempie — ograniczonym sufitem wchłaniania
        (zobacz{' '}
        <a href={faqHref('pl', 'carb-transporter-mix')}>
          dlaczego nie wchłoniesz więcej niż ok. 90 g/h
        </a>
        ). Jeśli spalanie przez dłuższy czas przewyższa dostawy, zapasy glikogenu — rezerwa
        węglowodanowa w mięśniach i wątrobie — się kończą. Gdy rezerwa jest bliska zera, organizm
        nie utrzymuje mocy — tempo gwałtownie spada, razem z koncentracją i koordynacją. To właśnie
        bomba.
      </p>
      <img
        src={assetHref('/faq/bonk-crisis/supply-demand-gap.png')}
        alt="Wykres Carb Fueling pokazujący spadek podaży węglowodanów poniżej zapotrzebowania, z widoczną luką między liniami."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Sygnał ostrzegawczy widać zanim to nastąpi: rosnąca luka między "spalone" a "dostarczone" na
        osi czasu. Carb Fueling rysuje obie linie podczas planowania trasy, więc widzisz otwierającą
        się lukę i możesz zareagować — wcześniejszy posiłek, mocniejszy miks albo trochę wolniejsze
        tempo — zanim zrobi się z tego kryzys.
      </p>
      <p>
        <a href={calculatorHref('pl')} style={articleLinkStyle}>
          Zobacz swój wykres podaży i popytu →
        </a>
      </p>
    </FaqLayout>
  );
}
