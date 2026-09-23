import { faqHref, calculatorHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function RunningVsCyclingCarbsDe() {
  return (
    <FaqLayout lang="de" slug="running-vs-cycling-carbs">
      <h1 style={articleH1Style}>
        Laufen vs. Rad: wie sich Kohlenhydratbedarf und -aufnahme wirklich unterscheiden
      </h1>
      <p style={articleTextStyle}>
        Läufer nehmen oft an, ihr Darm käme schlechter mit Kohlenhydraten zurecht als der eines
        Radfahrers. Die Forschung sagt etwas Genaueres: Der Aufnahmemechanismus ändert sich zwischen
        den beiden Sportarten tatsächlich nicht. Was sich ändert, ist die mechanische Belastung, die
        ein Läufer gleichzeitig abbekommt — und deshalb können dieselben Zahlen auf dem Papier in
        der Praxis ganz unterschiedlich ausfallen.
      </p>
      <p style={articleTextStyle}>
        Fangen wir mit dem an, was gleich bleibt. Studien, die die Oxidation exogener Kohlenhydrate
        beim Laufen und beim Radfahren bei ähnlicher Intensität direkt verglichen haben, fanden
        keinen relevanten Unterschied darin, wie viele Kohlenhydrate pro Stunde der Körper
        tatsächlich verarbeiten kann. Die Aufnahmeobergrenze des Darms — bestimmt durch die
        Zuckertransporter in der Darmwand, beschrieben im Artikel darüber,{' '}
        <a href={faqHref('de', 'carb-transporter-mix')} style={articleLinkStyle}>
          warum du nicht mehr als ca. 90 g Kohlenhydrate pro Stunde aufnehmen kannst
        </a>{' '}
        — ist eine Eigenschaft deines Darms, nicht der Sportart, die du gerade ausübst.
      </p>
      <p style={articleTextStyle}>
        Warum schneidet Laufen dann so oft schlechter ab? Weil Aufnahmefähigkeit und Komfort nicht
        dasselbe sind. Laufen bringt eine mechanische Belastung mit sich, die es auf dem Rad nicht
        gibt: Jeder Fußaufprall erschüttert den Magen und erhöht den Druck im Bauchraum auf eine
        Weise, die Pedalieren nie erzeugt. Dieses zusätzliche Durchschütteln — zusammen mit der
        Umleitung des Bluts vom Darm weg, die jede harte Anstrengung verursacht, beschrieben im
        Artikel darüber,{' '}
        <a href={faqHref('de', 'pace-power-absorption')} style={articleLinkStyle}>
          ob Tempo oder Leistung beeinflussen, wie viel du aufnehmen kannst
        </a>{' '}
        — reicht aus, um einen Magen, der auf dem Rad in Ordnung wäre, beim Laufen in echte Probleme
        zu bringen.
      </p>
      <p style={articleTextStyle}>
        Die Zahlen bestätigen das. Studien zu Ultra-Wettkämpfen zeigen Magen-Darm-Beschwerden bei
        70-85% der Läufer bei Mehretappen- oder 24-Stunden-Rennen. Vergleichbare Studien bei
        Radfahrern fanden keinerlei Zusammenhang zwischen dem, was sie gegessen oder getrunken
        hatten, und dem Auftreten von Magenbeschwerden. Gleiche Kohlenhydratzufuhr, ähnliche
        Intensität, völlig anderes Ergebnis — weil die Sportart selbst Teil der Belastung ist, nicht
        nur die Anstrengung.
      </p>
      <p style={articleTextStyle}>
        Die praktische Schlussfolgerung lautet nicht „iss weniger, weil dein Darm schwächer ist".
        Sie lautet eher „iss mit weniger Fehlermarge, weil derselbe Plan Gramm für Gramm weniger
        Spielraum hat, bevor etwas schiefgeht". Die Kohlenhydrat-pro-Stunde-Spannen nach Intensität
        und Dauer aus dem Artikel{' '}
        <a href={faqHref('de', 'carbs-per-hour-by-intensity')} style={articleLinkStyle}>
          wie viele Kohlenhydrate du pro Stunde wirklich brauchst
        </a>{' '}
        wurden mit Blick aufs Radfahren erstellt; bei gleicher Dauer und Intensität beim Laufen ist
        es sinnvoller, sich am unteren Ende dieser Spanne zu orientieren oder sogar etwas darunter,
        statt am oberen Ende.
      </p>
      <p style={articleTextStyle}>
        Das ist auch der Grund, warum sich Darmtraining nicht perfekt zwischen den Sportarten
        überträgt. Ein Magen, der 80 g/h auf dem Rad problemlos verträgt, wurde nie auf die
        Erschütterungen beim Laufen getestet — der mechanische Reiz fehlt in diesem Training
        einfach. Sieh dir an, wie{' '}
        <a href={faqHref('de', 'gut-training-carb-tolerance')} style={articleLinkStyle}>
          Darmtraining
        </a>{' '}
        aussieht. In der Praxis bedeutet das: Wenn du deine Kohlenhydrattoleranz fürs Laufen
        steigern willst, musst du die Progression machen und deinen Darm beim Laufen trainieren,
        nicht nur auf dem Rad.
      </p>
      <p style={articleSourcesStyle}>
        Quellen:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/21049089/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Pfeiffer et al., Med Sci Sports Exerc 2011
        </a>{' '}
        (Kohlenhydratoxidation, Laufen vs. Rad);{' '}
        <a
          href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4701764/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Costa et al., Sports Med Open 2016
        </a>{' '}
        (Magen-Darm-Beschwerden bei Ultra-Läufern);{' '}
        <a
          href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11753326/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Eur J Appl Physiol 2024
        </a>{' '}
        (Magen-Darm-Beschwerden und Ernährung bei einem nichtprofessionellen Radrennen).
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Plane deine Kohlenhydratzufuhr →
        </a>
      </p>
    </FaqLayout>
  );
}
