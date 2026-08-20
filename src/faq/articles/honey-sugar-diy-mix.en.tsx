import { faqHref, calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function HoneySugarDiyMixEn() {
  return (
    <FaqLayout lang="en" slug="honey-sugar-diy-mix">
      <h1 style={articleH1Style}>
        Honey or table sugar instead of a store-bought mix — does it work as well?
      </h1>
      <p style={articleTextStyle}>
        Yes, in most cases it works about as well. Table sugar (sucrose) and honey both give your
        gut a mix of glucose and fructose, which is exactly what a formulated sports drink is trying
        to do. The mechanism is the same one we explain in{' '}
        <a href={faqHref('en', 'carb-transporter-mix')} style={articleLinkStyle}>
          why you can't absorb more than ~90g of carbs per hour
        </a>
        : your gut has two separate doors for sugar, and using both at once raises your absorption
        ceiling.
      </p>
      <p style={articleTextStyle}>
        Table sugar is a molecule called sucrose, made of one glucose unit and one fructose unit
        joined together. An enzyme in your gut called sucrase splits that bond almost immediately,
        releasing free glucose and free fructose in roughly a 1:1 ratio. So even though sucrose
        looks like "just sugar" on the label, your body turns it into the same glucose-fructose
        combination a sports drink is built from.
      </p>
      <p style={articleTextStyle}>
        Honey is a bit different chemically. It's mostly already-free glucose and fructose, not
        bound together the way sucrose is. The exact ratio varies a little by floral source, but it
        usually sits close to sugar's effective 1:1 split, just tilted slightly more toward
        fructose. That's close enough that honey behaves similarly to table sugar for absorption
        purposes.
      </p>
      <p style={articleTextStyle}>
        Compare that to plain maltodextrin or dextrose (glucose) powder, which some riders mix into
        water thinking it's a simple, cheap fuel source. Those only open the glucose door. No matter
        how much you drink, you're capped at around 60g per hour, and the extra sugar just sits in
        your stomach. A DIY mix using sugar or honey actually has an advantage here: it opens both
        doors, the same as a two-carb commercial blend.
      </p>
      <p style={articleTextStyle}>
        What you do give up with a DIY mix is convenience and consistency. A pre-measured scoop from
        a branded product gives you the same dose every time; weighing out sugar or honey by hand is
        easier to get slightly wrong. Commercial mixes are also usually tested for osmolality — how
        concentrated the solution is — so it sits well in your stomach. A DIY mix that's too
        concentrated can cause the same bloating and cramping you're trying to avoid, so keep it
        moderate and test it in training before relying on it during a long ride or race.
      </p>
      <p style={articleTextStyle}>
        None of this makes a DIY mix a downgrade. It's a genuinely viable, much cheaper option for a
        lot of riders — just a different set of tradeoffs, not worse performance. That's also why
        Carb Fueling's own mix tool includes built-in "sugar" and "honey" presets alongside the
        standard glucose-fructose ratio, so you can plan around either one with the same absorption
        math.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Try the sugar and honey presets →
        </a>
      </p>
    </FaqLayout>
  );
}
