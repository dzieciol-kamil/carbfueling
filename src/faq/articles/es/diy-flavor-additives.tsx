import { faqHref, appHref } from '../../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../../FaqLayout';

export default function DiyFlavorAdditivesEs() {
  return (
    <FaqLayout lang="es" slug="diy-flavor-additives">
      <h1 style={articleH1Style}>
        Aditivos de sabor caseros: formas sencillas de mejorar el sabor de tu bidón o gel
      </h1>
      <p style={articleTextStyle}>
        El sabor no es un simple extra en una salida larga. Al cabo de unas horas, el mismo sabor
        dulce cuesta de verdad cada vez más de tolerar — es lo que se conoce como «fatiga del sabor»
        o saturación del paladar. Tu mezcla no ha cambiado, pero tu tolerancia hacia ella sí. Si
        tienes una forma de variar o mejorar el sabor, es más probable que sigas bebiendo y comiendo
        según lo previsto, y eso importa mucho más de lo que parece. Un plan de carbohidratos solo
        funciona si de verdad lo sigues.
      </p>
      <p style={articleTextStyle}>
        Las esencias o extractos de sabor son la solución más sencilla. Unas gotas de zumo de limón,
        lima o naranja cunden mucho. No aportan calorías significativas ni cambian la osmolalidad de
        tu bebida, así que no te revolverán el estómago ni cambiarán cómo se absorbe la mezcla.
      </p>
      <p style={articleTextStyle}>
        La fruta liofilizada en polvo es otra opción. Te da sabor a fruta de verdad, y además una
        pequeña cantidad de carbohidratos extra, lo que es una ventaja y no un problema. El único
        inconveniente es que puede formar grumos si la echas directamente en un bidón lleno. Un
        truco sencillo: mezcla primero el polvo con un poco de agua hasta obtener una pasta o
        papilla homogénea, y luego añádela al resto del bidón. Funciona mejor en un bidón o en un
        gel casero.
      </p>
      <p style={articleTextStyle}>
        El hibisco, o una infusión suave, merece la pena si quieres un toque ácido natural. El
        hibisco es ácido por naturaleza, así que añadir un poco te permite reducir el ácido cítrico
        o el limón sin perder un punto agradable de acidez en la mezcla. Es una buena forma de
        variar la parte ácida de tu receta más allá del ácido cítrico — y en Carb Fueling ya puedes
        elegir limón o lima en lugar de ácido cítrico para esa parte de la mezcla, así que el
        hibisco es simplemente una opción más para ir alternando.
      </p>
      <p style={articleTextStyle}>
        No te olvides de la propia sal. Una pizca hace más que aportar sodio — también potencia el
        sabor, igual que una pizca de sal redondea un plato soso. Si tu mezcla sabe apagada o plana,
        un poco más de sal suele ser la solución, al margen de tu objetivo general de sodio
        (consulta{' '}
        <a href={faqHref('es', 'sodium-electrolytes-cycling')} style={articleLinkStyle}>
          cuánto sodio necesitas realmente en la bici
        </a>
        ).
      </p>
      <p style={articleTextStyle}>
        Para la parte dulce de tu mezcla — azúcar, miel o una mezcla formulada de glucosa y fructosa
        — consulta{' '}
        <a href={faqHref('es', 'honey-sugar-diy-mix')} style={articleLinkStyle}>
          miel o azúcar común en lugar de un preparado comercial
        </a>
        . Los añadidos de sabor como los de arriba funcionan con cualquiera de esas opciones;
        cambian el sabor, no las cuentas de carbohidratos.
      </p>
      <p>
        <a href={appHref('es')} style={articleLinkStyle}>
          Elige tu edulcorante y tu ingrediente ácido →
        </a>
      </p>
    </FaqLayout>
  );
}
