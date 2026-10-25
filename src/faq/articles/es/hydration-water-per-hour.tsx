import { appHref, faqHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function HydrationWaterPerHourEs() {
  return (
    <FaqLayout lang="es" slug="hydration-water-per-hour">
      <h1 style={articleH1Style}>¿Cuánta agua por hora? Hidratación, calor y tasa de sudoración</h1>
      <p style={articleTextStyle}>
        No existe una cifra única de «bebe X ml por hora» que sirva para todos los ciclistas. La
        tasa de sudoración varía muchísimo de una persona a otra — aproximadamente de 0,5 a 2,5
        litros por hora, a veces más. Depende de tu tamaño corporal, de tu forma física y tu
        aclimatación al calor, de la temperatura y la humedad del aire, y de lo fuerte que vayas.
        Dos ciclistas en la misma ruta y al mismo ritmo pueden perder cantidades de líquido muy
        distintas.
      </p>
      <p style={articleTextStyle}>
        La forma clásica de encontrar tu propia cifra es una sencilla prueba de pesaje. Pésate justo
        antes de una hora de esfuerzo constante y otra vez justo después, sin beber nada durante esa
        hora (o, si bebes, resta lo que hayas bebido del resultado). El peso que has perdido es más
        o menos tu pérdida por sudor en esa hora, ya que 1 kg de peso corporal perdido equivale casi
        a 1 litro de líquido. Hazlo un día de calor y un día fresco y verás cuánto cambia la cifra.
      </p>
      <p style={articleTextStyle}>
        La temperatura y la humedad hacen subir la tasa de sudoración, y cada una a su manera. Más
        temperatura hace simplemente que tu cuerpo produzca más sudor para mantenerse fresco. La
        humedad hace que ese sudor sirva de menos: la refrigeración depende de que el sudor se
        evapore de la piel, y en el aire húmedo se evapora más despacio. Por eso un día caluroso y
        húmedo puede costar más que uno caluroso y seco con la misma lectura en el termómetro — tu
        cuerpo suda mucho, pero se refrigera menos.
      </p>
      <p style={articleTextStyle}>
        Esto crea un verdadero compromiso con tu mezcla de carbohidratos. Si preparas el bidón muy
        concentrado para alcanzar un objetivo alto de carbohidratos, ese bidón no puede llevar a la
        vez tanta agua. En una salida con calor, esa mezcla concentrada puede no darte suficiente
        agua para compensar lo que sudas. Muchos ciclistas lo resuelven llevando, los días de calor,
        un bidón aparte de agua sola junto al de la mezcla de carbohidratos, en lugar de esperar que
        un solo bidón cubra hidratación y combustible.
      </p>
      <p style={articleTextStyle}>
        No necesitas reponer cada gramo de sudor en tiempo real — arrastrar un pequeño déficit de
        líquido durante unas horas es normal y se tolera bien. Pero dejar que ese déficit crezca
        demasiado tiene un coste. Una deshidratación importante perjudica directamente el
        rendimiento, y además ralentiza el vaciado gástrico, lo que significa que los carbohidratos
        que bebes o comes se absorben más despacio justo cuando más rápido los necesitas.
      </p>
      <p style={articleTextStyle}>
        La unidad natural de ese déficit es el porcentaje de la masa corporal, porque es la unidad
        en la que todos los estudios dan sus resultados — y porque un litro no significa lo mismo
        para un corredor de 55 kg que para un ciclista de 95 kg. Para un ciclista de 75 kg, un litro
        de déficit es aproximadamente el 1,3 % de su masa corporal. Hasta alrededor del 2 %, las
        pruebas de un coste fiable en el rendimiento son débiles, y la propia cifra del 2 % es
        objeto de un debate real: varios ensayos ciegos no encuentran nada al 2–3 %, mientras que
        otros encuentran una caída clara con esa misma cifra. Tómalo como una zona de aviso suave,
        no como un precipicio.
      </p>
      <p style={articleTextStyle}>
        Lo que más importa, más que la cifra, es el tiempo que hace cuando la acumulas. Sawka,
        Cheuvront y Kenefick (2015) comprobaron que el coste de un déficit es despreciable hasta que
        la temperatura de la piel supera unos 27 °C — en su recuento de la literatura, ningún
        estudio con frío (2–10 °C) mostró un empeoramiento, mientras que 8 de 9 por encima de 25 °C
        sí lo hicieron. El mismo déficit del 2 % no te cuesta casi nada un día frío y varios puntos
        de rendimiento con calor de verdad. Por eso Carb Fueling valora el mismo déficit de forma
        distinta según la temperatura que indiques: a 20 °C o menos la barra sigue verde hasta el
        2,5 % de la masa corporal, y a 30 °C o más solo hasta el 1,2 %.
      </p>
      <p style={articleTextStyle}>
        El otro extremo de la escala es más raro, pero más peligroso. Beber por encima de lo que
        sudas diluye el{' '}
        <a href={faqHref('es', 'sodium-electrolytes-cycling')} style={articleLinkStyle}>
          sodio de tu sangre
        </a>{' '}
        y provoca la hiponatremia asociada al ejercicio — el único fallo agudo de todo este tema con
        un camino documentado hasta una cama de hospital, y que suele afectar a los participantes
        más lentos que beben en cada avituallamiento «por si acaso». Por eso la barra de hidratación
        también se pone roja oscura con un excedente: no hay premio por beber más de lo que pierdes.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling toma la temperatura que indicas para tu ruta y tu nivel de esfuerzo, y los usa
        para estimar tu necesidad de líquido en ml por hora junto a tu plan de carbohidratos — así
        no tienes que adivinar ni hacer tu propia prueba de pesaje en plena salida. La cifra sobre
        la barra de hidratación es ese balance: un signo menos es un déficit; un signo más significa
        que el plan te hace beber más de lo que sudas.
      </p>
      <p style={articleSourcesStyle}>
        Fuentes:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/26553489/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Sawka, Cheuvront, Kenefick, Sports Med 2015
        </a>{' '}
        (el umbral de 27 °C de temperatura cutánea a partir del cual la deshidratación empieza a
        afectar al rendimiento).
      </p>
      <p>
        <a href={appHref('es')} style={articleLinkStyle}>
          Planifica juntos tus objetivos de líquido y de carbohidratos →
        </a>
      </p>
    </FaqLayout>
  );
}
