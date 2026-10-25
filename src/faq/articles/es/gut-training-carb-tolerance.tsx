import { appHref, faqHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function GutTrainingCarbToleranceEs() {
  return (
    <FaqLayout lang="es" slug="gut-training-carb-tolerance">
      <h1 style={articleH1Style}>
        Entrenar el intestino: cómo aumentar con seguridad tu tolerancia a los carbohidratos
      </h1>
      <p style={articleTextStyle}>
        La capacidad de tu intestino para absorber carbohidratos durante el ejercicio no es fija.
        Funciona un poco como un músculo: exponerlo repetidamente a carbohidratos mientras pedaleas
        entrena al intestino para mover el azúcar más rápido, con menos hinchazón y menos
        retortijones. Esta adaptación requiere semanas de práctica constante. No es algo que puedas
        activar la mañana de la carrera simplemente bebiendo más.
      </p>
      <p style={articleTextStyle}>
        La forma más segura de desarrollar esta tolerancia es poco a poco. Empieza bastante por
        debajo de tu objetivo final — unos 30 g de carbohidratos por hora es un punto de partida
        razonable para la mayoría de los ciclistas. Después aumenta la cantidad despacio, unos 5-10
        g por hora cada semana o cada dos semanas. Dale al intestino tiempo para adaptarse en cada
        escalón antes de subir más. Los ciclistas que saltan directamente a{' '}
        <a href={faqHref('es', 'carb-transporter-mix')} style={articleLinkStyle}>
          ~90 g/h
        </a>{' '}
        sin esta progresión suelen acabar con dolor de estómago, hinchazón o diarrea en lugar de
        energía extra.
      </p>
      <p style={articleTextStyle}>
        Practica a la intensidad y con la duración que esperas en carrera, no solo en salidas
        suaves. Que el intestino vaya bien a ritmo tranquilo no garantiza que vaya bien con un
        esfuerzo duro. Cuanto más aprietas, más sangre envía tu cuerpo a los músculos que trabajan y
        menos al aparato digestivo, así que la misma cantidad de carbohidratos puede costar mucho
        más de absorber al final de una carrera dura que en un rodaje suave de entrenamiento.
      </p>
      <p style={articleTextStyle}>
        Practica también con los productos y la mezcla exactos (la proporción
        maltodextrina-fructosa) que piensas usar el día de la carrera. Un gel o una bebida que te
        sienta bien en los entrenamientos puede no ser el que acabes usando en carrera, y cambiar de
        producto o de mezcla en el último momento tira por la borda los beneficios de toda esa
        práctica.
      </p>
      <p style={articleTextStyle}>
        La fatiga del sabor también existe — un sabor que está bien durante una hora puede hacerse
        difícil de tolerar después de tres o cuatro, así que conviene probarlo también en las
        salidas largas de entrenamiento. Puedes ir variando, p. ej.{' '}
        <a href={faqHref('es', 'diy-flavor-additives')} style={articleLinkStyle}>
          con distintos aditivos de sabor
        </a>
        , o llevar algo de sabor más neutro, como{' '}
        <a href={faqHref('es', 'rice-cake-bars')} style={articleLinkStyle}>
          rice cakes
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        Antes de culpar a los propios carbohidratos, merece la pena descartar algunas causas
        habituales de problemas de estómago. Los bidones preparados demasiado concentrados elevan la
        osmolalidad de la bebida, lo que atrae agua al intestino y puede provocar retortijones.
        Comer mucha grasa, fibra o proteína justo antes o durante un ejercicio intenso ralentiza la
        digestión y compite por el mismo flujo sanguíneo limitado. Estar deshidratado empeora además
        la absorción de carbohidratos. Y tomar sin más más carbohidratos por hora de los que tu
        intestino tiene entrenados dará problemas por muy bien formulado que esté el producto.
      </p>
      <p style={articleTextStyle}>
        Cuando conozcas tu techo entrenado actual, planifica en torno a él en lugar de adivinar.
        Carb Fueling muestra tu límite de absorción en directo mientras ajustas la proporción de la
        mezcla del bidón y del gel, así que puedes hacerlo coincidir con lo que tu intestino ha
        practicado de verdad, y luego crear un plan de alimentación que se mantenga por debajo en
        lugar de pasarte el día de la carrera. Una salvedad: ajustes como ajustes la proporción de
        la mezcla del bidón y del gel, el límite de absorción de Carb Fueling no pasa de unos 92
        g/h. Es un valor por defecto prudente a propósito, no un muro fisiológico — unos pocos
        intestinos muy bien entrenados pueden superarlo — pero es un techo sensato para la gran
        mayoría de los ciclistas.
      </p>
      <p style={articleSourcesStyle}>
        Fuentes:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/20466803/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Cox et al., J Appl Physiol 2010
        </a>{' '}
        (28 días de entrenamiento con alta disponibilidad de carbohidratos aumentaron la oxidación
        de carbohidratos exógenos y el rendimiento en contrarreloj en un ~6 %).
      </p>
      <p>
        <a href={appHref('es')} style={articleLinkStyle}>
          Comprueba tu límite de absorción →
        </a>
      </p>
    </FaqLayout>
  );
}
