import { faqHref, calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function MaltoFructoseBlendEn() {
  return (
    <FaqLayout lang="en" slug="malto-fructose-blend">
      <h1 style={articleH1Style}>
        Maltodextrin + fructose: why a transport blend beats glucose alone
      </h1>
      <p style={articleTextStyle}>
        Maltodextrin sounds like a special ingredient, but it is just a chain of glucose units stuck
        together. Your gut breaks that chain apart almost immediately, so by the time it reaches
        your intestinal wall, it is plain glucose. "Complex carb" is a fair description of the
        molecule, but it does not change which transporter it uses to enter your bloodstream.
      </p>
      <p style={articleTextStyle}>
        That transporter is called SGLT1, and it has a fixed speed limit of roughly 60g per hour, no
        matter how the glucose was packaged before you drank it. We cover the mechanism behind that
        limit — and why a second transporter can raise it — in{' '}
        <a href={faqHref('en', 'carb-transporter-mix')} style={articleLinkStyle}>
          our article on the glucose/fructose transporter mix
        </a>
        . The short version: pure maltodextrin, however you dose it, still caps out around 60g/h.
      </p>
      <p style={articleTextStyle}>
        This is exactly why most modern gels and drink mixes are not pure maltodextrin anymore.
        Manufacturers add fructose directly, or use ingredients that naturally contain it, like
        sucrose (which is half fructose) or honey. Fructose uses a separate transporter, GLUT5, so
        adding it opens a second door for carbohydrate to enter your blood alongside the first one.
      </p>
      <p style={articleTextStyle}>
        The ratio between the two matters. A good starting point is roughly 2 parts
        glucose-equivalent carbohydrate to 1 part fructose by weight — the same "Izo" default used
        elsewhere in this app. That ratio uses most of the SGLT1 capacity while adding enough
        fructose to make full use of GLUT5 as well.
      </p>
      <p style={articleTextStyle}>
        Going too far in the other direction causes its own problems. GLUT5 has a lower ceiling than
        SGLT1, so if fructose makes up too much of your mix, some of it will not get absorbed in
        time. That leftover fructose sits in the gut and ferments, which is a common cause of
        bloating, gas, and cramping on long rides.
      </p>
      <p style={articleTextStyle}>
        This is also why it is worth reading the ingredient list on a gel or mix instead of just the
        marketing copy. "Complex carbs" or "slow-release energy" on the front of the package does
        not tell you whether the product is maltodextrin alone or a maltodextrin-fructose blend —
        and that difference decides how much of it you can actually absorb per hour.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Build a glucose-fructose mix that matches your hourly target →
        </a>
      </p>
    </FaqLayout>
  );
}
