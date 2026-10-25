import { faqHref, appHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function RunningVsCyclingCarbsEs() {
  return (
    <FaqLayout lang="es" slug="running-vs-cycling-carbs">
      <h1 style={articleH1Style}>
        Correr frente a pedalear: en qué se diferencian realmente la necesidad y la absorción de
        carbohidratos
      </h1>
      <p style={articleTextStyle}>
        Los corredores suelen dar por hecho que su intestino tolera peor los carbohidratos que el de
        un ciclista. La investigación dice algo más concreto: tu maquinaria de absorción no cambia
        realmente entre los dos deportes. Lo que cambia es cuánta carga mecánica soporta el corredor
        al mismo tiempo — y por eso las mismas cifras sobre el papel pueden dar resultados muy
        distintos en la práctica.
      </p>
      <p style={articleTextStyle}>
        Empecemos por lo que no cambia. Los estudios que comparan directamente la oxidación de
        carbohidratos exógenos entre correr y pedalear a un esfuerzo similar no encontraron
        diferencias significativas en cuántos carbohidratos podía procesar realmente el cuerpo por
        hora. El techo de absorción del intestino — fijado por los transportadores de azúcar de la
        pared intestinal, que explicamos en{' '}
        <a href={faqHref('es', 'carb-transporter-mix')} style={articleLinkStyle}>
          por qué no puedes absorber más de unos 90 g de carbohidratos por hora
        </a>{' '}
        — es una propiedad de tu intestino, no del deporte que practiques.
      </p>
      <p style={articleTextStyle}>
        Entonces, ¿por qué correr sienta peor tan a menudo? Porque capacidad de absorción y
        comodidad no son lo mismo. Correr añade un estrés mecánico que el ciclismo no tiene: cada
        pisada hace rebotar el estómago y eleva la presión intraabdominal de una forma que el
        pedaleo nunca provoca. Ese zarandeo extra — sumado al flujo sanguíneo que se desvía del
        intestino en cualquier esfuerzo duro, del que hablamos en{' '}
        <a href={faqHref('es', 'pace-power-absorption')} style={articleLinkStyle}>
          si el ritmo o los vatios influyen en lo que puedes absorber
        </a>{' '}
        — basta para que un estómago que habría ido bien en la bici tenga problemas serios
        corriendo.
      </p>
      <p style={articleTextStyle}>
        Las cifras lo confirman. Los estudios sobre pruebas de ultradistancia sitúan las molestias
        gastrointestinales en el 70-85 % de los corredores en carreras por etapas o de 24 horas.
        Estudios comparables con ciclistas no encontraron ninguna relación entre lo que comían o
        bebían y si tenían síntomas digestivos. El mismo combustible, una intensidad parecida y un
        resultado muy distinto — porque el propio deporte forma parte del estrés, no solo el
        esfuerzo.
      </p>
      <p style={articleTextStyle}>
        La conclusión práctica no es «come menos porque tu intestino es más débil». Es «come con
        menos margen de error, porque el mismo plan, gramo a gramo, tiene menos holgura». Los rangos
        de carbohidratos por hora según intensidad y duración de{' '}
        <a href={faqHref('es', 'carbs-per-hour-by-intensity')} style={articleLinkStyle}>
          cuántos carbohidratos por hora necesitas de verdad
        </a>{' '}
        se pensaron para el ciclismo; corriendo con la misma duración e intensidad, lo sensato es
        apuntar a la parte baja de ese rango, o un escalón por debajo, en lugar de a la alta.
      </p>
      <p style={articleTextStyle}>
        Por eso también el entrenamiento intestinal no se traslada perfectamente de un deporte a
        otro. Un estómago que tolera cómodamente 80 g/h en la bici no se ha puesto a prueba en
        absoluto frente al impacto de las pisadas — ese estrés mecánico simplemente no está en ese
        entrenamiento. Consulta{' '}
        <a href={faqHref('es', 'gut-training-carb-tolerance')} style={articleLinkStyle}>
          cómo entrenar el intestino
        </a>
        . En la práctica, esto significa que si quieres aumentar tu tolerancia a los carbohidratos
        para correr, tienes que hacer la progresión y entrenar el intestino corriendo, no solo en la
        bici.
      </p>
      <p style={articleSourcesStyle}>
        Fuentes:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/21049089/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Pfeiffer et al., Med Sci Sports Exerc 2011
        </a>{' '}
        (oxidación de carbohidratos, correr frente a pedalear);{' '}
        <a
          href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4701764/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Costa et al., Sports Med Open 2016
        </a>{' '}
        (síntomas digestivos en corredores de ultramaratón);{' '}
        <a
          href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11753326/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Eur J Appl Physiol 2024
        </a>{' '}
        (síntomas digestivos y nutrición en una prueba ciclista no profesional).
      </p>
      <p>
        <a href={appHref('es')} style={articleLinkStyle}>
          Planifica tu ingesta de carbohidratos →
        </a>
      </p>
    </FaqLayout>
  );
}
