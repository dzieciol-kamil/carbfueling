import { faqHref, calculatorHref } from '../../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../../FaqLayout';

export default function RiceCakeBarsPl() {
  return (
    <FaqLayout lang="pl" slug="rice-cake-bars">
      <h1 style={articleH1Style}>Domowy rice cake: przepis na paliwo, gdy żele już nie wchodzą</h1>
      <p style={articleTextStyle}>
        W artykule o{' '}
        <a href={faqHref('pl', 'fueling-100km-vs-300km')} style={articleLinkStyle}>
          różnicach między fuelingiem na 100 km i 300 km
        </a>{' '}
        piszemy, że po kilku godzinach ten sam żel czy napój, który smakował dobrze na starcie,
        potrafi być nie do przełknięcia — to zmęczenie smakowe. Rice cake to jedna z klasycznych
        odpowiedzi na ten problem: gęsty, zbity batonik z ryżu, popularny wśród kolarzy
        długodystansowych i ultrasów właśnie dlatego, że smakuje zupełnie inaczej niż słodki żel czy
        izotonik.
      </p>
      <p style={articleTextStyle}>Przepis na 8 porcji:</p>
      <ul style={{ ...articleTextStyle, paddingLeft: 20 }}>
        <li>200 g ryżu do sushi</li>
        <li>200 ml mleczka kokosowego — tylko gęsta, stała część</li>
        <li>80 g świeżych daktyli (mogą być suszone), ale może być też suszona żurawina</li>
        <li>350 ml wody do gotowania (plus osobna woda do płukania ryżu)</li>
        <li>4 łyżki cukru</li>
        <li>3 szczypty soli</li>
      </ul>
      <p style={articleTextStyle}>
        Ryż płuczesz dwukrotnie i gotujesz w ok. 2,5-krotnej ilości wody przez 20 minut, potem
        dodajesz stałą część mleczka kokosowego, daktyle, cukier i sól. Masę formujesz na papierze
        do pieczenia w równy, prostokątny blok — pomagając sobie deskami do krojenia po bokach, żeby
        krawędzie wyszły proste (możesz też użyć woreczka strunowego, który przygnieciesz deską,
        żeby zrobić płaski placek wypełniający cały woreczek) — i odstawiasz do lodówki albo
        zamrażarki na kilka godzin, aż stężeje. Potem kroisz na 8 równych kawałków i zawijasz
        pojedynczo. W lodówce wytrzyma do 3 dni, w zamrażarce praktycznie bez ograniczeń.
      </p>
      <p style={articleTextStyle}>
        Jedna porcja to ok. 140 kcal, 30 g węglowodanów, 2 g białka i 2 g tłuszczu. Przy typowym
        celu{' '}
        <a href={faqHref('pl', 'carbs-per-hour-by-intensity')} style={articleLinkStyle}>
          60-90 g węglowodanów na godzinę
        </a>{' '}
        jedna sztuka pokrywa mniej więcej połowę godziny, więc łatwo policzysz, ile kawałków
        potrzebujesz na daną część trasy — dokładnie tak samo, jak przy każdym innym produkcie,
        który wpiszesz do planu w Carb Fueling.
      </p>
      <p style={articleTextStyle}>
        Zaletą tej formy jest tekstura: dobrze trzyma kształt w kieszeni koszulki. Tłuszcz z mleczka
        kokosowego dodatkowo daje dłuższe uczucie sytości niż sam cukier, co bywa pomocne w
        spokojniejszej fazie długiej trasy, gdzie nie zależy Ci już wyłącznie na szybkim skoku
        energii.
      </p>
      <p style={articleTextStyle}>
        Jedno zastrzeżenie: ten konkretny przepis wciąż jest słodki — daktyle i cukier robią swoje.
        Jeśli Twój problem to dokładnie zmęczenie słodyczą, a nie tylko konsystencją żelu, warto
        ograniczyć cukier albo zamienić daktyle na coś mniej słodkiego. Sens rice cake'a jako
        przełamania monotonii działa najlepiej, gdy smak realnie kontrastuje z tym, co masz w
        bidonie (niektórzy dodają dobrze wysmażony i posiekany bekon).
      </p>
      <p>
        <a href={calculatorHref('pl')} style={articleLinkStyle}>
          Dodaj rice cake do swojego planu →
        </a>
      </p>
    </FaqLayout>
  );
}
