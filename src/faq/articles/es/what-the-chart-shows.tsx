import { faqHref, appHref, assetHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function WhatTheChartShowsEs() {
  return (
    <FaqLayout lang="es" slug="what-the-chart-shows">
      <h1 style={articleH1Style}>Qué muestra realmente el gráfico: del bidón a la sangre</h1>
      <p style={articleTextStyle}>
        Cada punto del gráfico corresponde a lo que tienes previsto comer o beber en ese punto de la
        ruta. Un gel, un trago de agua o de mezcla de tu bidón, un plátano en una parada. El gráfico
        lo registra exactamente donde está previsto que ocurra en la ruta, no como un total para
        toda la salida.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/intake-vessels.jpg')}
        alt="Entradas de bidón y de gel en la lista del plan de Carb Fueling, cada una con su contenido y su cantidad."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        La comida y la bebida no se convierten en combustible utilizable en cuanto llegan a la boca.
        Primero llegan al estómago y al intestino, y se digieren poco a poco. Hay un desfase real
        entre comer algo y que tu cuerpo pueda usarlo. El gráfico muestra todo este proceso — los
        carbohidratos se quedan un rato en el intestino, esperando, en lugar de estar disponibles en
        el instante en que los tragas.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/gut-strip.jpg')}
        alt="La franja del contenido del estómago en la parte superior del gráfico, que se llena y se vacía a medida que se digieren los carbohidratos."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Comas lo que comas, tu intestino solo puede pasar a la sangre una cantidad limitada de
        carbohidratos cada hora. Es el límite de absorción, y en el gráfico aparece como una línea
        de techo plana. Con una buena mezcla de glucosa y fructosa, ese techo está en unos 90 g por
        hora para la mayoría de los ciclistas — consulta{' '}
        <a href={faqHref('es', 'carb-transporter-mix')} style={articleLinkStyle}>
          por qué existe este techo y cómo lo eleva combinar azúcares
        </a>
        . Comer por encima del límite no ayuda — lo que sobra simplemente se queda más tiempo en el
        estómago.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/absorption-cap.jpg')}
        alt="La línea discontinua plana del límite de absorción, por encima de las líneas ascendentes de necesidad y de absorción."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        La línea de «necesidad» es el lado de la demanda. Muestra cuántos carbohidratos exige tu
        salida cada hora, según lo fuerte que estés trabajando en ese momento — subes un puerto duro
        y sube, bajas por el otro lado y baja. Frente a ella está lo «absorbido»: cuántos
        carbohidratos ha asimilado realmente tu cuerpo y puede usar, frenado por dos cosas a la vez
        — cuánto has comido y el límite de absorción. Ni siquiera un ciclista bien alimentado puede
        llevar lo absorbido por encima del techo. Observar estas dos líneas una junto a otra, hora a
        hora, es la clave para leer este gráfico.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/need-absorbed.jpg')}
        alt="Las líneas de necesidad y de absorción juntas, con el hueco entre ellas sombreado para mostrar el déficit."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Cuando lo absorbido cae por debajo de la necesidad durante un tramo de la ruta, ese hueco se
        marca como déficit. Ahí es donde el riesgo de pájara se va acumulando en silencio — no en un
        momento dramático, sino minuto a minuto, hora a hora. Consulta{' '}
        <a href={faqHref('es', 'bonk-crisis')} style={articleLinkStyle}>
          qué pasa cuando ese hueco dura demasiado
        </a>
        , y cómo un déficit pequeño e ignorado se convierte en una crisis de verdad sobre la bici.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/deficit.jpg')}
        alt="Primer plano del hueco sombreado de déficit entre las líneas de necesidad y de absorción al principio de la salida."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Los líquidos funcionan igual, con su propio par de líneas: líquido absorbido frente a
        pérdida por sudor, siguiendo la hidratación en lugar de los carbohidratos.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/fluid-lines.png')}
        alt="Las líneas de líquido absorbido y de pérdida por sudor en la vista de hidratación del gráfico."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Ver todo este recorrido desplegado, en lugar de una sola cifra, es el verdadero sentido del
        gráfico. Convierte «¿he comido suficiente hoy?» de una pregunta que respondes después de la
        salida en algo que puedes ver venir, con horas de antelación, y corregir antes de que se
        convierta en un problema.
      </p>
      <p>
        <a href={appHref('es')} style={articleLinkStyle}>
          Sigue tu propia línea de alimentación →
        </a>
      </p>
    </FaqLayout>
  );
}
