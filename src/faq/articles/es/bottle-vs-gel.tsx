import { faqHref, appHref } from '../../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../../FaqLayout';

export default function BottleVsGelEs() {
  return (
    <FaqLayout lang="es" slug="bottle-vs-gel">
      <h1 style={articleH1Style}>¿Bidón o gel? Cuándo y qué elegir</h1>
      <p style={articleTextStyle}>
        Los carbohidratos pueden llegar a tu cuerpo en varias formas: disueltos en un bidón,
        concentrados en un gel o como comida sólida. Cada formato tiene sus pros y sus contras.
        Elegir el adecuado para cada momento — y no un único formato para toda la salida — es lo que
        hace que un plan de alimentación funcione.
      </p>
      <p style={articleTextStyle}>
        La mezcla en el bidón es el formato más fácil para alimentarse de forma continua. Bebes a
        sorbos a tu ritmo, y cada sorbo aporta carbohidratos y líquido a la vez, algo muy eficiente
        en salidas con calor, en las que necesitas ambas cosas de todos modos. El inconveniente es
        que un bidón tiene una sola concentración. Una vez preparado, no puedes cambiarla en plena
        salida, y cuando se vacía, recargarlo requiere un plan — una tienda o un avituallamiento. Si
        quieres resolver esa parte logística, la tratamos en un artículo aparte sobre{' '}
        <a href={faqHref('es', 'bottle-refill-planning')} style={articleLinkStyle}>
          cómo planificar las recargas de bidones
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        Los geles resuelven el problema del espacio. Un sobre de gel es pequeño y denso, así que
        puedes llevar varias horas de carbohidratos en el bolsillo del maillot sin apenas peso ni
        volumen. La dosis es precisa — cada sobre tiene una cantidad conocida y fija de
        carbohidratos, así que no tienes que adivinar cuánto acabas de tomar. La contrapartida es
        que un gel está concentrado. Tomado solo, sin agua, puede sentar pesado en el estómago o
        pasar por el intestino más rápido de lo que te gustaría. La mayoría de los geles funcionan
        mejor con un trago de agua después. Y cada sobre deja un envoltorio que tienes que guardar
        hasta que puedas tirarlo a una papelera.
      </p>
      <p style={articleTextStyle}>
        La comida sólida es el formato que la gente olvida planificar, pero se gana su sitio en
        salidas más largas y regulares. Masticar y una digestión más lenta no son un problema cuando
        la intensidad es lo bastante baja — y la comida de verdad aporta un sabor y una textura que
        una salida a base solo de geles dulces y bebida isotónica no tiene. En jornadas muy largas,
        esa variedad importa mucho, porque «resetea» el sabor dulce en la boca y te permite seguir
        tomando carbohidratos incluso cuando ya no te apetece nada azucarado. El problema son la
        intensidad y el terreno: cuesta masticar y tragar mientras aprietas, y es incómodo comer en
        terreno técnico y bacheado, donde necesitas las dos manos en el manillar.
      </p>
      <p style={articleTextStyle}>
        En la práctica, la mayoría de los ciclistas no eligen un único formato para toda la salida —
        los combinan. El bidón es la base, el aporte constante que vas bebiendo a sorbos todo el
        rato. El gel es el empujón rápido antes de un esfuerzo duro, como un puerto largo o un
        ataque, cuando quieres meter carbohidratos rápido sin pararte a beber del bidón. La comida
        sólida llena los tramos tranquilos y regulares, en los que masticar no te cuesta nada y un
        cambio de sabor te ayuda a tolerar otro gel más adelante.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling te permite planificar con los tres formatos en un mismo sitio. Añade a tu plan
        un bidón de carbohidratos, un gel o un plátano, y verás si la combinación cubre realmente tu
        necesidad de carbohidratos por hora — hora a hora, no solo como total de la salida.
      </p>
      <p>
        <a href={appHref('es')} style={articleLinkStyle}>
          Crea un plan que combine bidón, gel y comida →
        </a>
      </p>
    </FaqLayout>
  );
}
