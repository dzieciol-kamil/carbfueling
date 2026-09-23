import { calculatorHref, faqHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function SodiumElectrolytesCyclingDe() {
  return (
    <FaqLayout lang="de" slug="sodium-electrolytes-cycling">
      <h1 style={articleH1Style}>
        Natrium auf dem Rad: wann zusätzliche Elektrolyte wirklich einen Unterschied machen
      </h1>
      <p style={articleTextStyle}>
        Schweiß ist nicht nur Wasser. Er transportiert auch Natrium, und wie viel Natrium darin
        steckt, unterscheidet sich stark von Fahrer zu Fahrer. Manche verlieren etwa 200 mg Natrium
        pro Liter Schweiß, andere über 2000 mg pro Liter — das Zehnfache, bei derselben
        Schweißmenge. Dieser Unterschied liegt größtenteils in der individuellen Physiologie, nicht
        in Fitness oder Training.
      </p>
      <p style={articleTextStyle}>
        Fahrer am oberen Ende dieser Skala werden oft "Salty Sweaters" genannt. Meistens erkennst du
        das selbst: Wenn nach dem Training ein sichtbarer weißer Belag oder eingetrocknete Kristalle
        auf Haut oder Kleidung zurückbleiben, ist das getrocknetes Natrium, das nach dem Verdunsten
        des Schweißes übrig geblieben ist. Ein einfaches, verlässliches Zeichen, dass du mehr
        Natrium verlierst als die meisten Radfahrer.
      </p>
      <p style={articleTextStyle}>
        Für die meisten Radfahrer, bei den meisten Ausfahrten, braucht das Thema Natrium keine
        besondere Aufmerksamkeit. Bei Fahrten unter etwa zwei bis drei Stunden und normalen
        Bedingungen reicht meist das Natrium aus der täglichen Ernährung plus das, was ohnehin schon
        in Gels oder Kohlenhydratmix steckt. Zusätzliche Elektrolytsupplementierung ist dann meist
        nicht nötig.
      </p>
      <p style={articleTextStyle}>
        Relevant wird es in ein paar konkreten Situationen: bei langen Belastungen in der Hitze, bei
        Fahrern, die wissen, dass sie stark oder "salzig" schwitzen, sowie bei mehrstündigen oder
        mehrtägigen Events. Dann summieren sich die Natriumverluste über die Zeit. In Extremfällen
        droht ein ernster Zustand namens belastungsbedingte Hyponatriämie — ein gefährlich niedriger
        Natriumspiegel im Blut, der entsteht, wenn er über viele Stunden durch zu viel reine
        Flüssigkeit verdünnt wird.
      </p>
      <p style={articleTextStyle}>
        Gehörst du zu einer dieser Risikogruppen, musst du nicht raten. Fahrer, die wissen, dass sie
        stark oder salzig schwitzen, oder die lange bei Hitze unterwegs sind, können
        Elektrolyttabletten oder etwas Salz zur Flasche oder zum Gel hinzufügen. Zwei einfache Wege,
        um herauszufinden, wo du stehst: nach dem Salzbelag nach einer Fahrt schauen, oder einen{' '}
        <a href={faqHref('de', 'hydration-water-per-hour')} style={articleLinkStyle}>
          Schweißraten-Wiegetest
        </a>{' '}
        machen (dich vor und nach einer Stunde im gleichmäßigen Tempo wiegen).
      </p>
      <p style={articleTextStyle}>
        Die Erkenntnis lautet nicht "immer zusätzliches Natrium dazugeben", sondern "kenne dein
        eigenes Schweißprofil und passe es an die Bedingungen an". Die meisten Freizeitfahrer bei
        moderaten Ausfahrten können das Thema ganz beiseitelassen. Am meisten profitieren
        diejenigen, die lange, bei Hitze oder mehrtägig fahren — besonders wenn sie bereits
        vermuten, salzig zu schwitzen.
      </p>
      <p style={articleTextStyle}>
        Wenn du deine eigene Schweiß-Natriumkonzentration kennst — aus einem Labortest oder
        geschätzt anhand der oben beschriebenen Salty-Sweater-Anzeichen —, kannst du das direkt ins
        Mix-Panel von Carb Fueling übertragen. Das Feld "Salz" dort meint Gramm gewöhnliches
        Kochsalz (NaCl) pro 100 ml, nicht reines Natrium — wir verwenden Salz, weil genau das
        tatsächlich in die Flasche kommt; reines Natrium als Element ist ein hochreaktives Metall,
        das du weder kaufen noch einem Getränk zusetzen kannst. Grob gilt: jedes 0,1 g Salz pro 100
        ml Getränk liefert etwa 390 mg Natrium pro Liter. Zielst du also z. B. auf 700 mg Natrium
        pro Liter, sind das etwa 0,18 g Salz pro 100 ml.
      </p>
      <p style={articleSourcesStyle}>
        Quellen:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/27478425/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Lara et al., J Int Soc Sports Nutr 2016
        </a>{' '}
        (Schweiß-Natriumbereich bei 157 Marathonläufern: etwa 160-2200 mg/l, unterteilt in
        low/typical/salty sweaters).
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Plane Kohlenhydrate und Flüssigkeit gemeinsam →
        </a>
      </p>
    </FaqLayout>
  );
}
