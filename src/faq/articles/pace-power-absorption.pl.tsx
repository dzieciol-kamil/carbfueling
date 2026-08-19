import { faqHref, calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function PacePowerAbsorptionPl() {
  return (
    <FaqLayout lang="pl">
      <h1 style={articleH1Style}>Czy tempo lub moc wpływają na to, ile możesz wchłonąć?</h1>
      <p style={articleTextStyle}>
        Łatwo pomylić dwie różne rzeczy: ile węglowodanów spala Twój wysiłek i ile węglowodanów jest
        w stanie wchłonąć Twoje jelito. To nie to samo i te dwie wartości nie rosną razem.
        Zapotrzebowanie — ile węglowodanów na godzinę potrzebuje organizm — rośnie wprost
        proporcjonalnie do intensywności jazdy. Wchłanianie — ile węglowodanów na godzinę realnie
        przyjmie jelito — zależy głównie od zupełnie innego mechanizmu i nie skaluje się w ten sam
        sposób.
      </p>
      <p style={articleTextStyle}>
        Ustawienie intensywności w Carb Fueling (niska, średnia, wysoka) zmienia właśnie stronę
        zapotrzebowania — szacuje, ile węglowodanów na godzinę spala dana trasa przy danym tempie.
        To jednak tylko połowa obrazu. Druga połowa to sufit wchłaniania Twojego jelita — osobny
        limit, wyznaczany przez transportery cukru w ścianie jelita, opisany w artykule o tym,{' '}
        <a href={faqHref('pl', 'carb-transporter-mix')} style={articleLinkStyle}>
          dlaczego nie wchłoniesz więcej niż ok. 90 g węglowodanów na godzinę
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        I tu zaskoczenie: w praktyce, dla większości zakresu intensywności, w jakim faktycznie
        jeździsz, ten sufit wchłaniania pozostaje mniej więcej stały. Niezależnie od tego, czy
        jedziesz spokojnie, czy solidnym tempem, jelito nadal przepuszcza ok. 60 g/h z jednego
        źródła węglowodanów albo do ok. 90 g/h przy dobrej mieszance glukozowo-fruktozowej.
        Mocniejsza jazda zwiększa Twoje zapotrzebowanie. Nie zwiększa automatycznie tego, ile jesteś
        w stanie przyjąć.
      </p>
      <p style={articleTextStyle}>
        To się zmienia dopiero na samym skraju skali wysiłku. Powyżej mniej więcej 80-90% wysiłku
        maksymalnego — ostre sprinty albo wyścig na progu lub mocniej — organizm kieruje krew z dala
        od jelita, w stronę pracujących mięśni i skóry. Mniej krwi docierającej do jelita oznacza
        wolniejsze opróżnianie żołądka i wolniejsze wchłanianie. Przy naprawdę maksymalnym wysiłku
        Twój sufit może się obniżyć dokładnie wtedy, gdy zapotrzebowanie jest najwyższe. Ten rozjazd
        to spora część powodu, dla którego bardzo ciężkie wysiłki tak często kończą się problemami
        żołądkowymi.
      </p>
      <p style={articleTextStyle}>
        Większość jazd wytrzymałościowych — spokojnych, umiarkowanie-do-mocno intensywnych,
        wielogodzinnych — nigdy nie sięga tej skrajnej strefy. Dlatego przy nich możesz spokojnie
        zakładać, że Twój wytrenowany sufit wchłaniania utrzyma się przez całą trasę. Prawdziwe
        trudności zaczynają się przy wyścigu na bardzo wysokiej, długo utrzymywanej intensywności —
        i nie chodzi tylko o wyższe zapotrzebowanie. Twoja zdolność do wchłaniania węglowodanów może
        się wtedy skurczyć w najgorszym możliwym momencie.
      </p>
      <p style={articleTextStyle}>
        To jeden z powodów, dla których{' '}
        <a href={faqHref('pl', 'gut-training-carb-tolerance')} style={articleLinkStyle}>
          trening jelita
        </a>{' '}
        powinien obejmować też trening przy intensywności zbliżonej do wyścigowej, a nie tylko
        spokojne wyjazdy. To, jak dobrze tolerujesz węglowodany na luźnym tempie, niewiele mówi o
        tym, jak zniesiesz czasie cieżkiego wyścigu. Prawdę pokazuje dopiero test przy
        intensywności, z jaką faktycznie wystartujesz.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling pokazuje obie te wielkości obok siebie: ustawienie intensywności decyduje o
        zapotrzebowaniu na węglowodany, a proporcja miksu wyznacza sufit tego, ile jesteś w stanie
        wchłonąć. Widząc je razem, od razu widać, kiedy plan wymaga od jelita więcej, niż jest ono w
        stanie dostarczyć.
      </p>
      <p>
        <a href={calculatorHref('pl')} style={articleLinkStyle}>
          Zobacz swoje zapotrzebowanie i sufit razem →
        </a>
      </p>
    </FaqLayout>
  );
}
