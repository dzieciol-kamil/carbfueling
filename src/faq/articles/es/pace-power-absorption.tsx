import { faqHref, appHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function PacePowerAbsorptionEs() {
  return (
    <FaqLayout lang="es" slug="pace-power-absorption">
      <h1 style={articleH1Style}>¿Influyen tu ritmo o tus vatios en cuánto puedes absorber?</h1>
      <p style={articleTextStyle}>
        Es fácil confundir dos cosas distintas: cuántos carbohidratos quema tu esfuerzo y cuántos
        puede absorber tu intestino. No son lo mismo, y no se mueven a la par. El ritmo de consumo —
        cuántos carbohidratos te pide el cuerpo por hora — sube directamente con lo fuerte que
        pedaleas. El ritmo de absorción — cuántos carbohidratos puede asimilar realmente tu
        intestino por hora — lo fija sobre todo un sistema aparte del intestino, y no escala de la
        misma manera.
      </p>
      <p style={articleTextStyle}>
        El ajuste de intensidad de Carb Fueling (baja, media, alta) cambia el lado de la demanda de
        la ecuación: estima cuántos carbohidratos quema una ruta por hora según lo fuerte que vayas.
        Pero esa cifra es solo la mitad de la historia. La otra mitad es el techo de absorción de tu
        intestino — un límite en gran parte independiente, fijado por las proteínas transportadoras
        de la pared intestinal, que explicamos en{' '}
        <a href={faqHref('es', 'carb-transporter-mix')} style={articleLinkStyle}>
          por qué no puedes absorber más de unos 90 g de carbohidratos por hora
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        Esta es la parte que sorprende: en casi todo el rango de intensidades al que vas a rodar de
        verdad, ese techo de absorción se mantiene más o menos constante. Tanto si vas de paseo como
        si mantienes un buen ritmo de tempo, tu intestino sigue pudiendo mover unos 60 g/h de una
        sola fuente de carbohidratos, o hasta unos 90 g/h de una buena mezcla de glucosa y fructosa.
        Ir más fuerte aumenta lo que necesitas. No aumenta automáticamente lo que puedes asimilar.
      </p>
      <p style={articleTextStyle}>
        Eso cambia en el extremo de la escala de esfuerzo. Por encima de aproximadamente el 80-90 %
        de tu esfuerzo máximo — sprints duros, o competir en el umbral o por encima — tu cuerpo
        desvía flujo sanguíneo del intestino hacia los músculos que trabajan y la piel. Menos sangre
        en el intestino significa un vaciado gástrico más lento y una absorción más lenta. En
        esfuerzos realmente máximos, tu techo puede bajar justo cuando tu demanda está en lo más
        alto. Ese desajuste explica en buena parte por qué los esfuerzos muy duros provocan
        problemas de estómago con mucha más frecuencia.
      </p>
      <p style={articleTextStyle}>
        En la mayor parte del ciclismo de resistencia — esfuerzos constantes, de moderados a duros,
        de varias horas — nunca llegas a esa zona extrema. Así que puedes suponer razonablemente que
        tu techo de absorción entrenado se mantiene durante toda la salida. Competir a una
        intensidad sostenida muy alta es donde alimentarse se complica de verdad, y no solo porque
        necesites más carbohidratos. Tu capacidad para asimilarlos puede reducirse justo en el peor
        momento.
      </p>
      <p style={articleTextStyle}>
        Esta es una de las razones por las que el{' '}
        <a href={faqHref('es', 'gut-training-carb-tolerance')} style={articleLinkStyle}>
          entrenamiento intestinal
        </a>{' '}
        debería incluir algo de práctica con esfuerzos duros propios de competición, no solo salidas
        suaves. Lo bien que toleras los carbohidratos en un rodaje suave dice poco de cómo los
        tolerarás en plena carrera dura. Probar tu alimentación a la intensidad a la que vas a
        competir es lo que te dice la verdad.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling mantiene estas dos cosas a la vista, una junto a otra: el ajuste de intensidad
        determina cuántos carbohidratos exige tu salida, y la proporción de tu mezcla fija el techo
        de cuántos puedes absorber. Verlas juntas deja claro cuándo un plan le pide a tu intestino
        más de lo que puede dar.
      </p>
      <p style={articleSourcesStyle}>
        Fuentes:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/28589631/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Costa et al., Aliment Pharmacol Ther 2017
        </a>{' '}
        (revisión sistemática: a alta intensidad de ejercicio, la sangre se desvía del intestino, lo
        que ralentiza el vaciado gástrico y la absorción).
      </p>
      <p>
        <a href={appHref('es')} style={articleLinkStyle}>
          Mira juntos tu demanda y tu techo →
        </a>
      </p>
    </FaqLayout>
  );
}
