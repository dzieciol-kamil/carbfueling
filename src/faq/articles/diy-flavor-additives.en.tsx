import { faqHref, calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function DiyFlavorAdditivesEn() {
  return (
    <FaqLayout lang="en" slug="diy-flavor-additives">
      <h1 style={articleH1Style}>
        DIY flavor additives: simple ways to make your mix taste better
      </h1>
      <p style={articleTextStyle}>
        Flavor is not just a nice extra on a long ride. After a few hours, the same sweet taste gets
        genuinely harder to stomach — riders call this "flavor fatigue" or palate fatigue. Your mix
        has not changed, but your tolerance for it has. If you have a way to vary or improve the
        flavor, you are more likely to keep drinking and eating on schedule, which matters a lot
        more than it sounds. A carb plan only works if you actually follow it.
      </p>
      <p style={articleTextStyle}>
        Flavor essences or extracts are the simplest fix. A few drops of vanilla, almond, or a fruit
        essence go a long way. They add no meaningful calories and do not change the osmolality of
        your drink, so they will not upset your stomach or change how the mix is absorbed. Carry a
        small dropper bottle in your jersey pocket and you can vary the flavor from bottle to bottle
        without carrying extra weight.
      </p>
      <p style={articleTextStyle}>
        Freeze-dried fruit powder is another option. It gives you real fruit flavor, plus a small
        amount of extra carbs, which is a bonus rather than a problem. The one issue is that it can
        clump if you just tip it straight into a full bottle. A simple fix: mix the powder into a
        small amount of water first, until it forms a smooth paste or slurry, then add that to the
        rest of your bottle.
      </p>
      <p style={articleTextStyle}>
        Hibiscus, or a light tea infusion, is worth trying if you want a natural sour edge. Hibiscus
        is naturally tart, so adding a small amount can let you cut back on added citric acid or
        lemon while still getting a pleasant sharpness in the mix. It is a good way to vary the sour
        side of your recipe beyond plain citric acid — and in Carb Fueling, you can already choose
        lemon or lime instead of plain citric acid for that part of the mix, so hibiscus is simply
        one more option to rotate in.
      </p>
      <p style={articleTextStyle}>
        Do not overlook salt itself. A small pinch does more than supply sodium — it also works as a
        flavor enhancer, the same way a pinch of salt rounds out a dish that tastes flat. If your
        mix tastes dull or one-dimensional, a little extra salt is often the fix, separate from
        whatever your overall sodium target is (see{' '}
        <a href={faqHref('en', 'sodium-electrolytes-cycling')} style={articleLinkStyle}>
          how much sodium you actually need on the bike
        </a>
        ).
      </p>
      <p style={articleTextStyle}>
        One practical tip covers most of these additions: dissolve powders or flavorings in a small
        amount of warm water first, then top up the bottle with the rest of your water. This stops
        clumping and stops bits of powder floating on top or sticking to the bottle wall, so your
        mix stays smooth from the first sip to the last.
      </p>
      <p style={articleTextStyle}>
        For the sweetener side of your mix — sugar, honey, or a formulated glucose-fructose blend —
        see{' '}
        <a href={faqHref('en', 'honey-sugar-diy-mix')} style={articleLinkStyle}>
          honey or table sugar instead of a store-bought mix
        </a>
        . Flavor additions like the ones above work alongside any of those choices; they change
        taste, not the underlying carb math.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Set your sweetener and sour ingredient →
        </a>
      </p>
    </FaqLayout>
  );
}
