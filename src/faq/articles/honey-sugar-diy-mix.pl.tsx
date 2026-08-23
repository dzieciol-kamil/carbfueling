import { faqHref, calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function HoneySugarDiyMixPl() {
  return (
    <FaqLayout lang="pl" slug="honey-sugar-diy-mix">
      <h1 style={articleH1Style}>
        Miód albo cukier zamiast gotowego proszku — czy to działa tak samo dobrze?
      </h1>
      <p style={articleTextStyle}>
        W większości przypadków tak — działa niemal identycznie. Zwykły cukier (sacharoza) i miód
        dostarczają jelitu mieszankę glukozy i fruktozy, czyli dokładnie to, co próbuje osiągnąć
        gotowy napój izotoniczny. To ten sam mechanizm, który opisujemy w artykule{' '}
        <a href={faqHref('pl', 'carb-transporter-mix')} style={articleLinkStyle}>
          dlaczego nie wchłoniesz więcej niż ok. 90 g węglowodanów na godzinę
        </a>
        : jelito ma dwoje osobnych "drzwi" na cukier, a użycie obu naraz podnosi Twój sufit
        wchłaniania.
      </p>
      <p style={articleTextStyle}>
        Zwykły cukier to sacharoza — cząsteczka złożona z jednej reszty glukozy i jednej reszty
        fruktozy, połączonych ze sobą. Enzym w jelicie zwany sacharazą rozbija to wiązanie niemal
        natychmiast, uwalniając wolną glukozę i wolną fruktozę w proporcji zbliżonej do 1:1. Więc
        mimo że na etykiecie sacharoza wygląda jak "zwykły cukier", organizm i tak zamienia ją w tę
        samą kombinację glukoza-fruktoza, na której bazują napoje sportowe.
      </p>
      <p style={articleTextStyle}>
        Miód pod względem chemicznym jest trochę inny. Zawiera w większości już wolną glukozę i
        fruktozę, niepołączone ze sobą tak jak w sacharozie. Dokładna proporcja zależy od źródła
        nektaru, ale zwykle jest bliska efektywnemu podziałowi 1:1 charakterystycznemu dla cukru, z
        lekką przewagą fruktozy. To wystarczająco blisko, żeby miód zachowywał się przy wchłanianiu
        podobnie do zwykłego cukru.
      </p>
      <p style={articleTextStyle}>
        Zestaw to z samą maltodekstryną albo dekstrozą (glukozą) w proszku, którą część rowerzystów
        wsypuje do bidonu, myśląc, że to proste i tanie paliwo. Taki miks otwiera tylko drzwi od
        glukozy. Bez względu na to, ile wypijesz, utkniesz przy ok. 60 g na godzinę, a nadmiar cukru
        po prostu zalega w żołądku. Domowy miks z cukru albo miodu ma tu przewagę — otwiera obie
        bramki naraz, tak samo jak gotowa mieszanka dwuskładnikowa.
      </p>
      <p style={articleTextStyle}>
        Tym, co tracisz przy domowym miksie, jest wygoda i powtarzalność dawki. Miarka z gotowego
        produktu za każdym razem daje tę samą ilość; ważenie cukru czy miodu ręcznie łatwiej lekko
        zaburzyć. Gotowe mieszanki są też zwykle testowane pod kątem osmolalności — czyli stężenia
        roztworu — tak żeby dobrze leżały w żołądku. Zbyt stężony domowy miks może wywołać dokładnie
        te wzdęcia i skurcze, których chcesz uniknąć, więc trzymaj umiarkowane stężenie i przetestuj
        je na treningu, zanim zdasz się na nie w długim wyścigu.
      </p>
      <p style={articleTextStyle}>
        Nic z tego nie czyni domowego miksu gorszą opcją. To realna, dużo tańsza alternatywa dla
        wielu rowerzystów — inne źródło, a nie słabszy wynik. Dlatego właśnie w narzędziu do
        mieszania w Carb Fueling znajdziesz gotowe presety "cukier" i "miód" obok standardowej
        proporcji glukoza-fruktoza, żeby móc planować wokół obu opcji z tą samą matematyką
        wchłaniania.
      </p>
      <p>
        <a href={calculatorHref('pl')} style={articleLinkStyle}>
          Wypróbuj presety cukru i miodu →
        </a>
      </p>
    </FaqLayout>
  );
}
