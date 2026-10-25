import { faqHref, appHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function CarbsPerHourByIntensityEs() {
  return (
    <FaqLayout lang="es" slug="carbs-per-hour-by-intensity">
      <h1 style={articleH1Style}>¿Cuántos carbohidratos por hora necesitas de verdad?</h1>
      <p style={articleTextStyle}>
        No existe un único número correcto de gramos por hora. La cantidad adecuada depende sobre
        todo de cuánto tiempo pedaleas y a qué intensidad. Lo que sigue es un rango práctico para la
        mayoría de los ciclistas, no una regla estricta — tómalo como un punto de partida que
        ajustar según cómo te sientas.
      </p>
      <p style={articleTextStyle}>
        En una salida suave de menos de una hora, los carbohidratos apenas importan. Tus reservas de
        glucógeno — el azúcar que ya tienes almacenado en los músculos y el hígado — bastan por sí
        solas para cubrir ese tipo de esfuerzo, así que el agua o una bebida de hidratación importan
        más que los carbohidratos.
      </p>
      <p style={articleTextStyle}>
        Cuando la salida se alarga a 1–2,5 horas, los carbohidratos empiezan a ganarse su sitio.
        Unos 30–60 g por hora es el rango útil aquí. El objetivo es ahorrar tus reservas de
        glucógeno y mantener la calidad del esfuerzo en la parte final de la salida, no reponer cada
        caloría que quemas.
      </p>
      <p style={articleTextStyle}>
        A partir de unas 2,5–3 horas, sobre todo si el ritmo es de moderado a alto, puedes subir la
        ingesta hasta 60–90 g por hora. Llegar tan alto solo funciona bien con una mezcla de glucosa
        y fructosa, porque una única fuente de carbohidratos — glucosa o maltodextrina solas — suele
        toparse con un techo de unos 60 g por hora, bebas lo que bebas. Consulta{' '}
        <a href={faqHref('es', 'carb-transporter-mix')} style={articleLinkStyle}>
          por qué existe ese techo y cómo lo eleva una mezcla de glucosa y fructosa
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        La intensidad cambia la urgencia con la que necesitas llegar a la parte alta del rango de
        absorción. Una jornada larga y tranquila a menudo se puede resolver cerca del extremo bajo
        incluso tras varias horas, porque quemas glucógeno más despacio. Un esfuerzo duro o a ritmo
        de carrera agota el glucógeno más deprisa y exige una ingesta de carbohidratos mayor, aunque
        la duración sea la misma.
      </p>
      <p style={articleTextStyle}>
        Una forma sencilla de calcular la intensidad sin potenciómetro ni banda de pulso: ¿todavía
        puedes hablar? Baja significa que puedes charlar cómodamente con frases completas. Media
        significa que puedes hablar, pero solo con frases cortas. Alta significa que apenas puedes
        hablar, concentrado en la respiración. Es la misma escala que usa el ajuste de intensidad de
        Carb Fueling.
      </p>
      <p style={articleTextStyle}>
        El tamaño corporal y el nivel de entrenamiento también mueven la cifra exacta — un ciclista
        más grande o alguien con el intestino bien entrenado a menudo tolera y aprovecha más
        carbohidratos por hora de lo que sugieren estos rangos. Toma 30–90 g/h como un rango de
        partida que afinar con la práctica, no como un objetivo que sirva igual para todos. El
        objetivo de Carb Fueling se basa solo en la duración y la intensidad de tu salida, no en tu
        peso — si eres un ciclista grande, tira hacia la parte alta del rango que te dé.
      </p>
      <p style={articleTextStyle}>
        En lugar de aplicar una regla general, Carb Fueling hace las cuentas para tu salida concreta
        — usando la duración de la ruta y la intensidad para calcular tu necesidad real de
        carbohidratos por hora.
      </p>
      <p style={articleSourcesStyle}>
        Fuentes:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/24791914/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Jeukendrup, Sports Med 2014
        </a>{' '}
        (las pautas de 30/60/90 g/h según la duración del ejercicio).
      </p>
      <p>
        <a href={appHref('es')} style={articleLinkStyle}>
          Calcula tu propio objetivo por hora →
        </a>
      </p>
    </FaqLayout>
  );
}
