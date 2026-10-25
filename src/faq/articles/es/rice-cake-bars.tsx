import { faqHref, appHref } from '../../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../../FaqLayout';

export default function RiceCakeBarsEs() {
  return (
    <FaqLayout lang="es" slug="rice-cake-bars">
      <h1 style={articleH1Style}>
        Rice cakes caseros: una receta de comida real para cuando ya no entran más geles
      </h1>
      <p style={articleTextStyle}>
        Nuestro artículo sobre{' '}
        <a href={faqHref('es', 'fueling-100km-vs-300km')} style={articleLinkStyle}>
          cómo alimentarse en 100 km frente a 300+ km
        </a>{' '}
        señala que, tras suficientes horas, el mismo gel o la misma bebida que te sentaban bien al
        principio pueden volverse difíciles de tragar — la fatiga del sabor. Los rice cakes son una
        respuesta clásica a ese problema: una barrita de arroz densa y compacta, muy popular entre
        los ciclistas de larga distancia y los ultrafondistas precisamente porque no sabe en
        absoluto a gel dulce ni a bebida isotónica.
      </p>
      <p style={articleTextStyle}>Receta, para 8 barritas:</p>
      <ul style={{ ...articleTextStyle, paddingLeft: 20 }}>
        <li>200 g de arroz para sushi</li>
        <li>200 ml de leche de coco — solo la parte espesa y sólida</li>
        <li>80 g de dátiles frescos (también valen secos)</li>
        <li>350 ml de agua para cocerlo (más otra agua aparte para lavar el arroz)</li>
        <li>4 cucharadas de azúcar</li>
        <li>3 pizcas de sal</li>
      </ul>
      <p style={articleTextStyle}>
        Lava el arroz dos veces y cuécelo en unas 2,5 veces su volumen de agua durante 20 minutos;
        después incorpora la parte sólida de la leche de coco, los dátiles, el azúcar y la sal. Da
        forma a la mezcla sobre papel de horno hasta obtener un bloque rectangular uniforme —
        apretar unas tablas de cortar contra los lados ayuda a que los bordes queden rectos — y
        enfríala en la nevera o el congelador unas horas, hasta que se endurezca. Córtala en 8
        trozos iguales y envuélvelos uno a uno. Se conserva hasta 3 días en la nevera, o
        indefinidamente en el congelador.
      </p>
      <p style={articleTextStyle}>
        Cada trozo tiene unas 140 kcal, 30 g de carbohidratos, 2 g de proteína y 2 g de grasa. Con
        un objetivo típico de{' '}
        <a href={faqHref('es', 'carbs-per-hour-by-intensity')} style={articleLinkStyle}>
          60-90 g de carbohidratos por hora
        </a>
        , una barrita cubre aproximadamente media hora, así que es fácil calcular cuántos trozos
        necesita un tramo concreto de tu salida — igual que con cualquier otro producto que
        introduzcas en un plan de Carb Fueling.
      </p>
      <p style={articleTextStyle}>
        La ventaja de este formato es la textura: mantiene la forma en el bolsillo del maillot, no
        se desmigaja y no se derrite con el calor como puede pasarle a un gel. La grasa de la leche
        de coco también da una sensación de saciedad más duradera que el azúcar solo, lo que puede
        ayudar en los tramos más tranquilos de una salida larga, cuando ya no necesitas solo un
        chute rápido de energía.
      </p>
      <p style={articleTextStyle}>
        Una advertencia: esta receta en concreto sigue siendo dulce — de eso se encargan los dátiles
        y el azúcar. Si tu problema es específicamente el empacho de dulce y no solo la textura del
        gel, reduce el azúcar o cambia los dátiles por algo menos dulce. Un rice cake solo rompe la
        monotonía si su sabor contrasta de verdad con lo que ya llevas en el bidón.
      </p>
      <p>
        <a href={appHref('es')} style={articleLinkStyle}>
          Añade rice cakes a tu plan →
        </a>
      </p>
    </FaqLayout>
  );
}
