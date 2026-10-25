import { faqHref, appHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function HeatCarbPlanEs() {
  return (
    <FaqLayout lang="es" slug="heat-carb-plan">
      <h1 style={articleH1Style}>
        Cómo cambia el calor tu plan de carbohidratos (no basta con «bebe más»)
      </h1>
      <p style={articleTextStyle}>
        El calor aumenta tu tasa de sudoración y, además, somete a un estrés extra a tu temperatura
        central. Para refrigerarse, tu cuerpo envía más sangre a la piel. Esa sangre tiene que salir
        de algún sitio, y uno de los lugares de los que se retira es el intestino. Es una respuesta
        normal y sana, pero importa a la hora de alimentarse.
      </p>
      <p style={articleTextStyle}>
        Con menos flujo sanguíneo en el intestino, la digestión se ralentiza. Los estudios sobre
        ejercicio con calor muestran que el vaciado gástrico y la absorción de carbohidratos pueden
        bajar de forma medible cuando sube la temperatura central y el cuerpo prioriza la
        refrigeración. Así que el calor no solo te hace sudar más — también puede hacer que tu
        intestino sea algo menos capaz de procesar lo que le das.
      </p>
      <p style={articleTextStyle}>
        Por eso «bebe más» es un consejo incompleto. Si la capacidad de absorción de tu intestino ya
        está algo presionada por el estrés térmico, añadir más líquido es bueno, pero mantener la
        misma concentración alta de carbohidratos además de ese líquido extra puede volverse en tu
        contra. El resultado suele ser hinchazón, náuseas o retortijones.
      </p>
      <p style={articleTextStyle}>
        Para las salidas con calor, es mejor diluir un poco los bidones. Tu necesidad de líquido
        sube mucho con el calor, así que si mantienes la misma concentración de carbohidratos por
        bidón, acabas forzando más azúcar total a través de un intestino que trabaja con menos flujo
        sanguíneo. Diluir mantiene la concentración más cerca de lo que tu intestino tolera
        cómodamente sin dejar de cubrir esa mayor necesidad de líquido.
      </p>
      <p style={articleTextStyle}>
        También ayuda tirar de fuentes de carbohidratos líquidas y de menor osmolalidad en lugar de
        geles densos cuando aprieta el calor. Un gel es una dosis concentrada que tu intestino tiene
        que diluir con sus propias reservas de líquido (salvo que lo acompañes con bastante agua);
        un bidón bien preparado ya tiene una concentración más suave. Y no te olvides del sodio — la
        tasa de sudoración y la pérdida de sodio suben con el calor, así que tu necesidad de
        electrolitos aumenta junto con la de líquido (más sobre esto en{' '}
        <a href={faqHref('es', 'sodium-electrolytes-cycling')} style={articleLinkStyle}>
          nuestro artículo sobre sodio y electrolitos
        </a>
        ).
      </p>
      <p style={articleTextStyle}>
        La aclimatación al calor también importa. Los ciclistas que entrenan con calor durante una o
        dos semanas se adaptan: sudan de forma más eficiente, y su intestino suele tolerar mejor el
        estrés térmico durante el ejercicio. Alguien que lleva todo el verano rodando con calor
        puede afrontar un día caluroso de forma muy distinta a quien se enfrenta a su primera ola de
        calor de la temporada — así que tu plan debería tener en cuenta lo aclimatado que estás
        realmente, no solo la temperatura de la previsión.
      </p>
      <p style={articleTextStyle}>
        Nada de esto significa que tengas que rehacer tu alimentación para un día templado normal.
        Importa sobre todo en esfuerzos largos y de verdad calurosos, donde los compromisos entre
        líquido y tolerancia intestinal empiezan a pasar factura. Carb Fueling tiene en cuenta la
        temperatura de la ruta y ajusta tu estimación de líquido en consecuencia, así que cuando
        planificas una salida con calor ves juntas tus necesidades de líquido y de carbohidratos, y
        puedes ajustar la ingesta en lugar de adivinar.
      </p>
      <p style={articleSourcesStyle}>
        Fuentes:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/41138215/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Mougin et al., J Appl Physiol 2025
        </a>{' '}
        (el calor reduce la oxidación de carbohidratos exógenos en un ~20 % incluso manteniendo una
        hidratación completa, sobre todo por una menor absorción intestinal).
      </p>
      <p>
        <a href={appHref('es')} style={articleLinkStyle}>
          Planifica tu próxima salida con calor →
        </a>
      </p>
    </FaqLayout>
  );
}
