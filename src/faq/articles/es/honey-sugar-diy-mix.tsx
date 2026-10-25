import { faqHref, appHref } from '../../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../../FaqLayout';

export default function HoneySugarDiyMixEs() {
  return (
    <FaqLayout lang="es" slug="honey-sugar-diy-mix">
      <h1 style={articleH1Style}>
        Miel o azúcar común en lugar de un preparado comercial — ¿funciona igual de bien?
      </h1>
      <p style={articleTextStyle}>
        Sí, en la mayoría de los casos funciona más o menos igual de bien. El azúcar común
        (sacarosa) y la miel aportan a tu intestino una mezcla de glucosa y fructosa, que es
        exactamente lo que intenta hacer una bebida deportiva formulada. El mecanismo es el mismo
        que explicamos en{' '}
        <a href={faqHref('es', 'carb-transporter-mix')} style={articleLinkStyle}>
          por qué no puedes absorber más de ~90 g de carbohidratos por hora
        </a>
        : tu intestino tiene dos puertas distintas para el azúcar, y usar las dos a la vez eleva tu
        techo de absorción.
      </p>
      <p style={articleTextStyle}>
        El azúcar común es una molécula llamada sacarosa, formada por una unidad de glucosa y una de
        fructosa unidas entre sí. Una enzima del intestino llamada sacarasa rompe ese enlace casi de
        inmediato y libera glucosa y fructosa libres en una proporción aproximada de 1:1. Así que,
        aunque en la etiqueta la sacarosa parezca «simple azúcar», tu cuerpo la convierte en la
        misma combinación de glucosa y fructosa con la que se fabrica una bebida deportiva.
      </p>
      <p style={articleTextStyle}>
        La miel es algo distinta químicamente. Es sobre todo glucosa y fructosa ya libres, no unidas
        como en la sacarosa. La proporción exacta varía un poco según el origen floral, pero suele
        quedar cerca del reparto efectivo 1:1 del azúcar, solo que algo inclinada hacia la fructosa.
        Es lo bastante parecido como para que la miel se comporte de forma similar al azúcar común
        en cuanto a absorción.
      </p>
      <p style={articleTextStyle}>
        Compáralo con la maltodextrina o la dextrosa (glucosa) en polvo, que algunos ciclistas
        mezclan con agua pensando que es un combustible sencillo y barato. Esas solo abren la puerta
        de la glucosa. Bebas lo que bebas, te quedas en un tope de unos 60 g por hora, y el azúcar
        extra se queda en el estómago. Una mezcla casera con azúcar o miel tiene aquí incluso una
        ventaja: abre las dos puertas, igual que una mezcla comercial de dos carbohidratos.
      </p>
      <p style={articleTextStyle}>
        Lo que sí pierdes con una mezcla casera es comodidad y regularidad. Un cacito ya medido de
        un producto comercial te da la misma dosis cada vez; pesar azúcar o miel a mano es más fácil
        equivocarse un poco. Además, los preparados comerciales suelen estar probados en cuanto a
        osmolalidad — lo concentrada que está la solución — para que el intestino no tenga que
        atraer agua extra para absorberla. Una mezcla casera demasiado concentrada puede causar la
        misma hinchazón y los mismos retortijones que intentas evitar, así que mantenla moderada y
        pruébala en los entrenamientos antes de confiar en ella en una salida larga o en una
        carrera.
      </p>
      <p style={articleTextStyle}>
        Nada de esto convierte la mezcla casera en una opción de segunda. Es una alternativa
        totalmente viable y mucho más barata para muchos ciclistas — simplemente con otros pros y
        contras, no con peor rendimiento. Por eso la herramienta de mezcla de Carb Fueling incluye
        ajustes predefinidos de «Azúcar» y «Miel» junto a la proporción estándar de glucosa y
        fructosa, para que puedas planificar con cualquiera de ellos con las mismas cuentas de
        absorción.
      </p>
      <p>
        <a href={appHref('es')} style={articleLinkStyle}>
          Prueba los ajustes de azúcar y miel →
        </a>
      </p>
    </FaqLayout>
  );
}
