import { appHref, faqHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function SodiumElectrolytesCyclingEs() {
  return (
    <FaqLayout lang="es" slug="sodium-electrolytes-cycling">
      <h1 style={articleH1Style}>
        Sodio en la bici: cuándo los electrolitos extra marcan la diferencia
      </h1>
      <p style={articleTextStyle}>
        El sudor no es solo agua. También arrastra sodio, y la cantidad de sodio que lleva varía
        muchísimo de un ciclista a otro. Algunas personas pierden unos 200 mg de sodio por litro de
        sudor. Otras pierden más de 2000 mg por litro — diez veces más con el mismo volumen de
        sudor. Esta diferencia la fija sobre todo tu cuerpo, no tu forma física ni tu entrenamiento.
      </p>
      <p style={articleTextStyle}>
        A los ciclistas del extremo alto se les suele llamar «sudadores salados». Normalmente puedes
        detectarlo tú mismo: si después de una salida tu piel o tu ropa muestran un residuo o una
        costra blanca visible, es la sal seca que quedó al evaporarse el sudor. Es una señal
        sencilla y útil de que pierdes más sodio que la mayoría.
      </p>
      <p style={articleTextStyle}>
        Para la mayoría de los ciclistas, en la mayoría de las salidas, esto no requiere mucha
        reflexión. Si tu salida dura menos de unas dos o tres horas y las condiciones son normales,
        el sodio que ya tiene tu dieta, más el que ya llevan tus geles o tu mezcla de carbohidratos,
        suele bastar. Suplementar electrolitos extra encima de eso a menudo no hace falta.
      </p>
      <p style={articleTextStyle}>
        Empieza a importar más en algunas situaciones concretas: esfuerzos largos con calor,
        ciclistas que ya saben que sudan mucho o que su sudor es muy salado, y pruebas de varias
        horas o de varios días. En estos casos, las pérdidas de sodio se van sumando con el tiempo.
        En casos extremos, pueden provocar una afección grave llamada hiponatremia asociada al
        ejercicio, en la que el sodio en sangre baja a un nivel peligroso porque demasiado líquido
        sin sales lo ha diluido durante muchas horas.
      </p>
      <p style={articleTextStyle}>
        Si estás en uno de esos grupos de mayor riesgo, no tienes que adivinar. Los ciclistas que
        saben que sudan mucho o que su sudor es salado, o que van a hacer una salida larga con
        calor, pueden añadir pastillas de electrolitos o sal extra a su bidón o a su gel. Dos formas
        sencillas de saber en qué punto estás: busca restos de sal después de una salida, o haz una{' '}
        <a href={faqHref('es', 'hydration-water-per-hour')} style={articleLinkStyle}>
          prueba de pesaje para medir tu tasa de sudoración
        </a>{' '}
        (pesándote antes y después de una hora de esfuerzo constante).
      </p>
      <p style={articleTextStyle}>
        La conclusión no es «añade siempre sodio extra». Es «conoce tu propio perfil de sudoración y
        ajústalo a las condiciones». La mayoría de los ciclistas aficionados en salidas moderadas
        pueden olvidarse de esto. Los que hacen esfuerzos largos, con calor o de varios días — sobre
        todo si ya sospechan que son sudadores salados — son los que más ganan prestándole atención.
      </p>
      <p style={articleTextStyle}>
        Si conoces la concentración de sodio de tu sudor — por una prueba de laboratorio, o estimada
        a partir de las señales de sudador salado de arriba — puedes trasladarla al panel de mezcla
        de Carb Fueling. El campo «sal» de ese panel son gramos de sal de mesa normal (NaCl) por 100
        ml, no de sodio puro — usamos sal porque es lo que realmente añadirías a un bidón; el sodio
        puro es un metal muy reactivo que no puedes comprar ni añadir a una bebida. A grandes
        rasgos, cada 0,1 g de sal por 100 ml de bebida aporta unos 390 mg de sodio por litro. Así
        que si buscas, por ejemplo, 700 mg de sodio por litro, son unos 0,18 g de sal por 100 ml.
      </p>
      <p style={articleSourcesStyle}>
        Fuentes:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/27478425/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Lara et al., J Int Soc Sports Nutr 2016
        </a>{' '}
        (rango de sodio en el sudor de 157 maratonianos: aproximadamente 160-2200 mg/l, divididos en
        sudadores bajos, típicos y salados).
      </p>
      <p>
        <a href={appHref('es')} style={articleLinkStyle}>
          Planifica juntos tus carbohidratos y tus líquidos →
        </a>
      </p>
    </FaqLayout>
  );
}
