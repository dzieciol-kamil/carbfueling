import { faqHref, appHref, assetHref } from '../../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../../FaqLayout';

export default function CarbTransporterMixEs() {
  return (
    <FaqLayout lang="es" slug="carb-transporter-mix">
      <h1 style={articleH1Style}>
        ¿Por qué no puedes absorber más de ~90 g de carbohidratos por hora?
      </h1>
      <p style={articleTextStyle}>
        Tu intestino absorbe el azúcar por dos puertas distintas — dos proteínas transportadoras
        diferentes integradas en la pared intestinal. La glucosa usa una, llamada SGLT1; la fructosa
        usa otra, llamada GLUT5. Como son sistemas físicamente separados, cada uno tiene su propio
        límite de velocidad, independiente del otro.
      </p>
      <p style={articleTextStyle}>
        El SGLT1 puede mover unos 60 g de glucosa por hora, da igual cuánta glucosa bebas — es un
        transportador activo, ligado al sodio, que simplemente se satura a ese ritmo. Si tomas solo
        geles de glucosa o maltodextrina pura, 60 g/h es tu techo infranqueable — el azúcar extra se
        queda en el estómago y provoca hinchazón o retortijones.
      </p>
      <p style={articleTextStyle}>
        El GLUT5 se encarga de la fructosa por una vía aparte, que da para unos 30 g más por hora
        (consulta{' '}
        <a href={faqHref('es', 'gut-training-carb-tolerance')} style={articleLinkStyle}>
          cómo entrenar el intestino para aumentar tu tolerancia a los carbohidratos
        </a>
        ). Si añades fructosa a tu fuente de carbohidratos, usas las dos puertas a la vez. Por eso
        las mezclas de glucosa y fructosa elevan el techo realista hasta unos 90 g por hora.
      </p>
      <p style={articleTextStyle}>
        No es solo teoría — se ha medido directamente. Los fisiólogos del ejercicio lo estudian con
        ensayos de doble trazador, usando azúcares marcados para ver con qué rapidez los
        carbohidratos ingeridos aparecen realmente como combustible quemado (oxidación de
        carbohidratos exógenos). La investigación sobre la ingesta combinada de glucosa y fructosa
        (Jeukendrup, 2010) comprobó que combinar fuentes de carbohidratos que usan transportadores
        distintos — lo que él llamó «carbohidratos transportables múltiples» — permite a los
        ciclistas oxidar carbohidratos aproximadamente un 50 % más rápido que solo con glucosa — la
        diferencia de ~60 g/h frente a ~90 g/h descrita arriba (en laboratorio se han medido hasta
        ~105 g/h).
      </p>
      <img
        src={assetHref('/faq/carb-transporter-mix/absorption-cap.png')}
        alt="Panel de mezcla de Carb Fueling con los ajustes predefinidos de proporción glucosa:fructosa y el techo de absorción resultante."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        La proporción importa. Con demasiada fructosa desaprovechas la capacidad de la puerta de la
        glucosa; con demasiado poca, la de la fructosa. Una proporción 2:1 de glucosa y fructosa en
        peso es un buen punto de partida para la mayoría de los ciclistas — es la mezcla «Izo» por
        defecto de Carb Fueling.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling calcula tu techo personal a partir de la proporción de mezcla que elijas, y lo
        muestra en directo mientras cambias la mezcla.
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
        (carbohidratos transportables múltiples, oxidación de hasta ~105 g/h).
      </p>
      <p>
        <a href={appHref('es')} style={articleLinkStyle}>
          Descubre tu propio techo →
        </a>
      </p>
    </FaqLayout>
  );
}
