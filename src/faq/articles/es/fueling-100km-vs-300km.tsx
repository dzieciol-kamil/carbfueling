import { faqHref, appHref } from '../../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../../FaqLayout';

export default function Fueling100kmVs300kmEs() {
  return (
    <FaqLayout lang="es" slug="fueling-100km-vs-300km">
      <h1 style={articleH1Style}>Alimentarse en 100 km frente a 300+ km: qué cambia realmente</h1>
      <p style={articleTextStyle}>
        Una salida de 100 km y una de 300 km no son «lo mismo, pero tres veces más largo». El factor
        limitante cambia a medida que se suman las horas, y un plan de alimentación que funciona
        bien en una distancia puede fallar estrepitosamente en la otra. Esto es lo que cambia de
        verdad.
      </p>
      <p style={articleTextStyle}>
        En una salida más corta — digamos de 2 a 4 horas, más o menos lo que lleva hacer 100 km a
        ritmo moderado — el límite principal es el{' '}
        <a href={faqHref('es', 'carb-transporter-mix')} style={articleLinkStyle}>
          techo de absorción
        </a>{' '}
        de tu intestino. El intestino solo puede asimilar una cierta cantidad de gramos de
        carbohidratos por hora, comas lo que comas. La buena noticia es que en unas pocas horas la
        fatiga intestinal todavía no se ha acumulado, así que la mayoría de los ciclistas pueden
        mantener la ingesta cerca de la parte alta de su rango entrenado durante toda la salida. El
        principal riesgo que gestionar es sencillo: si te quedas corto de carbohidratos demasiado
        pronto, tus piernas lo notarán en el tramo final.
      </p>
      <p style={articleTextStyle}>
        Una salida de ultradistancia — 8 horas o más, el tipo de jornada en que puede convertirse
        una ruta de 300 km — cambia el panorama. La energía total quemada a lo largo del día es
        enorme, pero tu intensidad media baja de forma natural cuanto más tiempo pasas sobre la
        bici. Menos intensidad significa que tu cuerpo necesita algo menos de carbohidratos por hora
        que al principio, lo que alivia un poco el problema puro del techo de absorción. Los grandes
        retos pasan a ser otros: horas comiendo y bebiendo sin parar desgastan el intestino, y el
        mismo gel o la misma bebida que te sentaban bien en la segunda hora pueden resultar
        difíciles de tragar en la octava. Es lo que a veces se llama fatiga del sabor. La comida de
        verdad y las opciones saladas —{' '}
        <a href={faqHref('es', 'rice-cake-bars')} style={articleLinkStyle}>
          rice cakes
        </a>
        , bocadillos, snacks salados — empiezan a importar mucho más, simplemente porque dan un
        respiro al paladar.
      </p>
      <p style={articleTextStyle}>
        La logística también escala de otra manera. Una salida de 100 km a menudo puede ser
        totalmente autosuficiente — llevas todo en los bidones y los bolsillos desde la salida y no
        necesitas parar nunca. Una de 300 km normalmente no funciona así: nadie lleva 8 horas o más
        de comida y bebida desde la primera pedalada. Las salidas de ultradistancia dependen de un
        reabastecimiento planificado, así que merece la pena{' '}
        <a href={faqHref('es', 'bottle-refill-planning')} style={articleLinkStyle}>
          trazar tus paradas de recarga
        </a>{' '}
        de antemano en lugar de confiar en improvisar en cualquier tienda.
      </p>
      <p style={articleTextStyle}>
        El ritmo y la fatiga también interactúan de una forma que un objetivo fijo por hora pasa por
        alto. Al ir más lento en las últimas horas de una salida larga, tu necesidad de
        carbohidratos baja junto con la intensidad — pero, al mismo tiempo, la fatiga puede quitarte
        el apetito y hacer que tu intestino tenga menos ganas de procesar comida. Un buen plan tiene
        que adaptarse en las dos direcciones: bajar el objetivo cuando vas más suave, pero también
        estar atento al momento en que tu cuerpo simplemente no quiere comer, y ajustar en vez de
        forzar una cifra fija.
      </p>
      <p style={articleTextStyle}>
        En los esfuerzos realmente largos — pruebas de ultrafondo, jornadas de bikepacking que se
        alargan hasta la noche — el sueño y la oscuridad añaden otra capa. La disciplina al comer y
        beber tiende a relajarse cuando estás cansado, y es fácil saltarse una toma prevista cuando
        vas medio dormido en la bici. Ayuda planificar a conciencia y de antemano la alimentación
        nocturna, en lugar de confiar en que te acordarás en el momento.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling puede modelar una salida tanto por duración como por ruta y ritmo, así que la
        misma herramienta sirve desde un rodaje de 3 horas hasta una ultradistancia de todo el día —
        solo tienes que describir el esfuerzo y dejar que haga los números.
      </p>
      <p>
        <a href={appHref('es')} style={articleLinkStyle}>
          Planifica tu propia salida, corta o larga →
        </a>
      </p>
    </FaqLayout>
  );
}
