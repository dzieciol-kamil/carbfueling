import { appHref, assetHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function BottleRefillPlanningEs() {
  return (
    <FaqLayout lang="es" slug="bottle-refill-planning">
      <h1 style={articleH1Style}>Cómo planificar las recargas de bidones en una salida larga</h1>
      <p style={articleTextStyle}>
        En cuanto una salida dura más de lo que dan de sí un par de bidones de mezcla, ya no puedes
        llevar todo el plan desde la salida. Necesitas puntos de recarga — y un plan de qué va en
        cada bidón cuando llegues a ellos.
      </p>
      <p style={articleTextStyle}>
        Empieza por tu necesidad total de carbohidratos y de líquido para toda la distancia (Carb
        Fueling calcula ambas a partir de tu ruta y de las condiciones). Compárala con lo que caben
        realmente en tus bidones y flasks. Todo lo que falte tiene que salir de algún punto del
        camino — una tienda, un avituallamiento, una fuente.
      </p>
      <img
        src={assetHref('/faq/bottle-refill-planning/shop-stops.png')}
        alt="Línea de tiempo de una ruta en Carb Fueling con marcadores de paradas en tiendas situados entre las recargas de bidones."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Coloca una «parada en tienda» en cada punto de recarga de tu ruta. Carb Fueling reparte
        entonces tu mezcla total de carbohidratos entre los tramos que hay entre paradas, así que
        sabes exactamente cuánto polvo (tu mezcla de carbohidratos), cuánta agua y qué productos
        (geles, plátanos) llevar — o comprar — por el camino.
      </p>
      <p style={articleTextStyle}>
        Pon las paradas antes de que el hueco sea demasiado grande, no después: recargar con un
        15-20 % de reserva es un plan; recargar al 0 % es una crisis.
      </p>
      <p style={articleTextStyle}>
        En rutas cortas y con buenos servicios, suele bastar con una recarga cerca de la mitad. En
        salidas más largas o por zonas aisladas, espacia las paradas para que ningún tramo exija a
        tus bidones más de lo que pueden llevar.
      </p>
      <p>
        <a href={appHref('es')} style={articleLinkStyle}>
          Añade paradas en tiendas a tu ruta →
        </a>
      </p>
    </FaqLayout>
  );
}
