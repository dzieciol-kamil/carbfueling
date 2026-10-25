import { faqHref, appHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function MaltoFructoseBlendEs() {
  return (
    <FaqLayout lang="es" slug="malto-fructose-blend">
      <h1 style={articleH1Style}>
        Maltodextrina + fructosa: por qué una mezcla de transportadores supera a la glucosa sola
      </h1>
      <p style={articleTextStyle}>
        La maltodextrina suena a ingrediente especial, pero no es más que una cadena de unidades de
        glucosa unidas entre sí. Tu intestino rompe esa cadena casi de inmediato, así que cuando
        llega a la pared intestinal ya es glucosa sin más. «Carbohidrato complejo» describe bien la
        molécula, pero no cambia qué transportador usa para pasar a la sangre.
      </p>
      <p style={articleTextStyle}>
        Ese transportador se llama SGLT1, y tiene un límite de velocidad fijo de unos 60 g por hora,
        da igual cómo estuviera presentada la glucosa antes de bebértela. Explicamos el mecanismo de
        ese límite — y por qué un segundo transportador puede elevarlo — en{' '}
        <a href={faqHref('es', 'carb-transporter-mix')} style={articleLinkStyle}>
          nuestro artículo sobre la mezcla de transportadores de glucosa y fructosa
        </a>
        . En resumen: la maltodextrina pura, la dosifiques como la dosifiques, se queda en un tope
        de unos 60 g/h.
      </p>
      <p style={articleTextStyle}>
        Precisamente por eso la mayoría de los geles y bebidas modernos ya no son maltodextrina
        pura. Los fabricantes añaden fructosa directamente, o usan ingredientes que la contienen de
        forma natural, como la sacarosa (que es mitad fructosa) o la miel. La fructosa usa un
        transportador distinto, el GLUT5, así que añadirla abre una segunda puerta para que los
        carbohidratos pasen a la sangre junto a la primera.
      </p>
      <p style={articleTextStyle}>
        La proporción entre ambas importa. Un buen punto de partida es aproximadamente 2 partes de
        carbohidrato equivalente a glucosa por 1 parte de fructosa en peso — la misma mezcla «Izo»
        por defecto que se usa en el resto de la app. Esa proporción aprovecha la mayor parte de la
        capacidad del SGLT1 y añade la fructosa suficiente para sacar también todo el partido al
        GLUT5.
      </p>
      <p style={articleTextStyle}>
        Pasarse en la otra dirección trae sus propios problemas. El GLUT5 tiene un techo más bajo
        que el SGLT1, así que si la fructosa es una parte demasiado grande de tu mezcla, una parte
        no se absorberá a tiempo. Esa fructosa sobrante se queda en el intestino y fermenta, una
        causa habitual de hinchazón, gases y retortijones en las salidas largas.
      </p>
      <p style={articleTextStyle}>
        Por eso también merece la pena leer la lista de ingredientes de un gel o una bebida en lugar
        de quedarse con el texto publicitario. «Carbohidratos complejos» o «energía de liberación
        lenta» en la parte delantera del envase no te dicen si el producto es solo maltodextrina o
        una mezcla de maltodextrina y fructosa — y esa diferencia decide cuánto puedes absorber
        realmente por hora.
      </p>
      <p style={articleSourcesStyle}>
        Fuentes:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/20574242/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Jeukendrup, Curr Opin Clin Nutr Metab Care 2010
        </a>{' '}
        (techo del SGLT1 de ~60 g/h, techo combinado más alto con una mezcla de glucosa y fructosa).
      </p>
      <p>
        <a href={appHref('es')} style={articleLinkStyle}>
          Prepara una mezcla de glucosa y fructosa a la medida de tu objetivo por hora →
        </a>
      </p>
    </FaqLayout>
  );
}
