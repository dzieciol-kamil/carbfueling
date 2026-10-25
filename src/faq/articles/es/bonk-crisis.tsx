import { faqHref, appHref, assetHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function BonkCrisisEs() {
  return (
    <FaqLayout lang="es" slug="bonk-crisis">
      <h1 style={articleH1Style}>Qué pasa realmente cuando te da la pájara — y cómo verla venir</h1>
      <p style={articleTextStyle}>
        La pájara no llega de repente. Es el punto final de una brecha que ha ido creciendo durante
        toda la salida — entre los carbohidratos que quema tu cuerpo y los que realmente le estás
        aportando.
      </p>
      <p style={articleTextStyle}>
        Tus músculos queman carbohidratos a un ritmo que marca el esfuerzo: cuanto más fuerte vas,
        más rápido los gastas. Tu intestino solo puede aportar carbohidratos a su propio ritmo,
        limitado por el techo de absorción (consulta{' '}
        <a href={faqHref('es', 'carb-transporter-mix')} style={articleLinkStyle}>
          por qué no puedes absorber más de ~90 g/h
        </a>
        ). Si el ritmo de consumo se mantiene por encima del de aporte el tiempo suficiente, tus
        reservas de glucógeno — la despensa de carbohidratos de los músculos y el hígado — se van
        agotando. Cuando esa reserva está casi vacía, tu cuerpo ya no puede mantener la potencia: el
        ritmo se desploma de golpe, y con él la concentración y la coordinación. Eso es la pájara.
      </p>
      <img
        src={assetHref('/faq/bonk-crisis/supply-demand-gap.png')}
        alt="Gráfico de Carb Fueling en el que el aporte de carbohidratos cae por debajo de la necesidad, con una brecha visible entre las dos líneas."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        La señal de alarma se ve antes de que ocurra: una brecha cada vez mayor entre los
        «carbohidratos quemados» y los «carbohidratos aportados» a lo largo del tiempo. Carb Fueling
        dibuja ambos mientras preparas una ruta, así que puedes ver cómo se abre la brecha y
        corregirla — tomas antes, una mezcla más concentrada o un ritmo algo más suave — antes de
        que se convierta en una crisis.
      </p>
      <p>
        <a href={appHref('es')} style={articleLinkStyle}>
          Compara tu aporte con tu necesidad →
        </a>
      </p>
    </FaqLayout>
  );
}
