import { faqHref, calculatorHref } from '../../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../../FaqLayout';

export default function DiyFlavorAdditivesDe() {
  return (
    <FaqLayout lang="de" slug="diy-flavor-additives">
      <h1 style={articleH1Style}>
        Selbstgemachte Geschmackszusätze: einfache Wege, um Flasche oder Gel besser schmecken zu
        lassen
      </h1>
      <p style={articleTextStyle}>
        Auf einer langen Strecke ist Geschmack nicht nur eine Frage des Vergnügens. Nach ein paar
        Stunden wird derselbe süße Geschmack richtig anstrengend — manchmal spricht man von
        Geschmacksermüdung. Das Getränk oder Gel selbst hat sich nicht verändert, aber deine
        Toleranz dafür schon. Wenn du eine Möglichkeit hast, den Geschmack abzuwechseln oder zu
        verbessern, fällt es dir viel leichter, deinen Trink- und Essplan durchzuziehen — und das
        zählt mehr, als man denken würde. Der beste Kohlenhydratplan bringt nichts, wenn du einfach
        aufhörst, ihn umzusetzen.
      </p>
      <p style={articleTextStyle}>
        Die einfachste Lösung sind Geschmacksessenzen oder Extrakte. Ein paar Tropfen Zitronen-,
        Limetten- oder Orangensaft können den Geschmack einer ganzen Flasche verändern. Sie liefern
        praktisch keine zusätzlichen Kalorien und verändern die Osmolalität des Getränks nicht, also
        beeinflussen sie weder den Magen noch die Aufnahmegeschwindigkeit.
      </p>
      <p style={articleTextStyle}>
        Eine weitere Option ist gefriergetrocknetes Fruchtpulver. Es gibt echten Fruchtgeschmack und
        liefert nebenbei eine kleine Menge zusätzlicher Kohlenhydrate — eher ein Plus als ein
        Problem. Der einzige Nachteil: direkt in eine volle Flasche geschüttet, kann es klumpen. Ein
        einfacher Trick dagegen: das Pulver zuerst mit etwas Wasser zu einer glatten Paste verrühren
        und erst danach den Rest der Flüssigkeit dazugeben. Das eignet sich eher für eine Flasche
        oder ein selbstgemachtes Gel.
      </p>
      <p style={articleTextStyle}>
        Wenn du eine natürliche Säure suchst, lohnt sich Hibiskus oder ein leichter Teeaufguss.
        Hibiskus schmeckt von Natur aus säuerlich, sodass du damit die Menge an zugesetzter
        Zitronensäure oder Zitronensaft reduzieren kannst und trotzdem eine angenehme Säure im
        Iso-Getränk oder Gel behältst. Das ist eine gute Möglichkeit, die saure Komponente deines
        Rezepts über reine Zitronensäure hinaus abzuwechseln — und in Carb Fueling kannst du ohnehin
        schon Zitrone oder Limette statt Zitronensäure wählen, Hibiskus ist einfach eine weitere
        Option zum Ausprobieren.
      </p>
      <p style={articleTextStyle}>
        Unterschätze auch das Salz selbst nicht. Eine Prise Salz liefert nicht nur Natrium — sie
        wirkt auch als Geschmacksverstärker, genau wie in der Küche, wo eine Prise Salz ein fades
        Gericht „belebt". Wenn dein Iso-Getränk oder Gel fad und eindimensional schmeckt, reicht oft
        etwas zusätzliches Salz, unabhängig davon, wie viel Natrium du für deine Strecke eigentlich
        brauchst (siehe{' '}
        <a href={faqHref('de', 'sodium-electrolytes-cycling')} style={articleLinkStyle}>
          wie viel Natrium du auf dem Rad wirklich brauchst
        </a>
        ).
      </p>
      <p style={articleTextStyle}>
        Was die Süße selbst angeht — Zucker, Honig oder eine fertige Maltodextrin-Fruktose-Mischung
        — sieh dir den Artikel{' '}
        <a href={faqHref('de', 'honey-sugar-diy-mix')} style={articleLinkStyle}>
          Honig oder Zucker statt einer fertigen Mischung
        </a>{' '}
        an. Die oben beschriebenen Geschmackszusätze funktionieren unabhängig von dieser Wahl — sie
        verändern den Geschmack, nicht die eigentliche Kohlenhydrat-Mathematik.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Stelle Süßungsmittel und Säurekomponente deines Mixes ein →
        </a>
      </p>
    </FaqLayout>
  );
}
