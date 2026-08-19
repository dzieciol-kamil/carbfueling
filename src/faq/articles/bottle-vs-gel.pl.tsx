import { faqHref, calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function BottleVsGelPl() {
  return (
    <FaqLayout lang="pl">
      <h1 style={articleH1Style}>
        Bidon czy żel? Kiedy opłaca się każda forma dostarczania węglowodanów
      </h1>
      <p style={articleTextStyle}>
        Węglowodany możesz dostarczyć organizmowi na kilka sposobów: rozpuszczone w bidonie,
        skoncentrowane w żelu albo zjedzone jako zwykłe jedzenie. Każda forma ma swoje plusy i
        minusy. Dobry plan żywieniowy nie polega na wybraniu jednej z nich na cały wyścig, tylko na
        dobraniu formy do momentu, w którym jej używasz.
      </p>
      <p style={articleTextStyle}>
        Bidon najłatwiej pije się na bieżąco. Popijasz w swoim tempie, a każdy łyk dostarcza od razu
        węglowodany i płyny — to bardzo wygodne w upale, kiedy i tak potrzebujesz jednego i
        drugiego. Problem w tym, że jeden bidon to jedno stężenie. Raz zmieszany, nie zmienisz go w
        trakcie jazdy, a gdy się skończy, uzupełnienie wymaga planu — sklepu, punktu wsparcia albo
        wody, którą wieziesz, żeby zmieszać kolejną porcję. Logistykę tego tematu opisujemy osobno w
        artykule o{' '}
        <a href={faqHref('pl', 'bottle-refill-planning')} style={articleLinkStyle}>
          planowaniu uzupełniania bidonów
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        Żele rozwiązują problem miejsca. Jedna saszetka jest mała i gęsta energetycznie, więc w
        kieszeni koszulki zmieścisz zapas na kilka godzin jazdy, praktycznie bez wagi i objętości.
        Dawkowanie jest precyzyjne — każda saszetka ma znaną, stałą ilość węglowodanów, więc nie
        zgadujesz, ile właśnie przyjąłeś. Minusem jest to, że żel jest skoncentrowany. Zjedzony sam,
        bez popicia wodą, może ciążyć w żołądku albo przejść przez jelita szybciej, niż byś chciał.
        Większość żeli najlepiej działa popita wodą. Do tego po każdej saszetce zostaje opakowanie,
        które musisz gdzieś schować, dopóki nie wyrzucisz go do kosza.
      </p>
      <p style={articleTextStyle}>
        O jedzeniu stałym często zapomina się przy planowaniu, a przecież sprawdza się świetnie na
        dłuższych, spokojniejszych odcinkach. Żucie i wolniejsze trawienie nie przeszkadzają, gdy
        intensywność jest odpowiednio niska — a prawdziwe jedzenie daje smak i teksturę, których nie
        zapewnią same słodkie żele i napój izotoniczny. Na bardzo długich dystansach ta różnorodność
        pomaga jeść dalej, nawet gdy ochota na słodycz spada. Minus to intensywność i teren — trudno
        żuć i przełykać, jadąc mocno, a na technicznym, wyboistym terenie, gdzie obie ręce potrzebne
        są na kierownicy, jedzenie czegokolwiek robi się niewygodne.
      </p>
      <p style={articleTextStyle}>
        W praktyce większość rowerzystów nie wybiera jednej formy na cały wyścig, tylko łączy je.
        Bidon to stały fundament, popijany przez cały czas. Żel to szybkie doładowanie przed trudnym
        momentem — długim podjazdem czy atakiem — kiedy chcesz szybko dostarczyć węglowodany bez
        odrywania się od jazdy na picie z bidonu. Jedzenie stałe wypełnia spokojne, równe odcinki,
        gdzie żucie nic nie kosztuje, a zmiana smaku pomaga jeść dalej.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling pozwala zaplanować wszystkie trzy formy naraz. Dodaj do planu wpisy z bidonem,
        żelem i jedzeniem, a aplikacja pokaże Ci, czy taka kombinacja rzeczywiście pokrywa Twoje
        zapotrzebowanie na węglowodany w każdej godzinie — nie tylko w sumie na całą trasę.
      </p>
      <p>
        <a href={calculatorHref('pl')} style={articleLinkStyle}>
          Zbuduj plan łączący bidon, żel i jedzenie →
        </a>
      </p>
    </FaqLayout>
  );
}
