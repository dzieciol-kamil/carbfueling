import { calculatorHref, faqHref } from '../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../FaqLayout';

export default function GutTrainingCarbToleranceEn() {
  return (
    <FaqLayout lang="en" slug="gut-training-carb-tolerance">
      <h1 style={articleH1Style}>Training your gut: how to safely raise your carb tolerance</h1>
      <p style={articleTextStyle}>
        Your gut's ability to absorb carbs during exercise is not fixed. It works a bit like a
        muscle: repeated exposure to carbs while you ride trains your intestine to move sugar
        faster, with less bloating and fewer cramps. This adaptation takes weeks of consistent
        practice. It is not something you can switch on the morning of a race by simply drinking
        more.
      </p>
      <p style={articleTextStyle}>
        The safest way to build this tolerance is gradual. Start well below your eventual target —
        around 30g of carbs per hour is a reasonable starting point for most riders. Then increase
        the amount slowly, by roughly 5-10g per hour every week or two. Give your gut time to adapt
        at each step before pushing higher. Riders who jump straight to{' '}
        <a href={faqHref('en', 'carb-transporter-mix')} style={articleLinkStyle}>
          ~90g/h
        </a>{' '}
        without this buildup often end up with stomach pain, bloating, or diarrhea instead of extra
        energy.
      </p>
      <p style={articleTextStyle}>
        Practice at the intensity and duration you expect to race at, not just on easy rides. Gut
        comfort at a relaxed pace does not predict gut comfort under hard effort. As your effort
        rises, your body sends more blood to your working muscles and less to your digestive system,
        so the same amount of carbs can feel much harder to absorb late in a hard race than during
        an easy training spin.
      </p>
      <p style={articleTextStyle}>
        Also practice with the exact products and mix (the maltodextrin-fructose ratio) you plan to
        use on race day. A gel or drink that sits fine in training might not be the one you actually
        use in the race, and swapping products or mix at the last minute removes the benefit of all
        your practice.
      </p>
      <p style={articleTextStyle}>
        Flavor fatigue is real too — a flavor that tastes fine for one hour can become hard to
        stomach after three or four, so it helps to test that during long training rides as well.
        You could try mixing things up, e.g.{' '}
        <a href={faqHref('en', 'diy-flavor-additives')} style={articleLinkStyle}>
          with different flavor additives
        </a>
        , or bring along something more neutral-tasting, like{' '}
        <a href={faqHref('en', 'rice-cake-bars')} style={articleLinkStyle}>
          rice cakes
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        A few common causes of stomach trouble are worth ruling out before you blame the carbs
        themselves. Bottles that are mixed too concentrated raise the osmolality of the drink, which
        pulls water into the gut and can cause cramping. Eating a lot of fat, fiber, or protein
        right before or during hard exercise slows digestion and competes for the same limited blood
        flow. Being dehydrated makes carb absorption worse on top of that. And simply taking in more
        carbs per hour than your gut is currently trained for will cause problems no matter how
        well-formulated the product is.
      </p>
      <p style={articleTextStyle}>
        Once you know your current trained ceiling, plan around it instead of guessing. Carb Fueling
        shows your absorption cap live as you dial in your bottle and gel mix ratio, so you can
        match it to what your gut has actually practiced, then build a fueling schedule that stays
        under it instead of overshooting on race day. One caveat: no matter how you dial in your
        bottle and gel mix ratio, Carb Fueling's absorption cap tops out around 92g/h. That's a
        deliberate safe default, not a hard physiological wall — a small number of very well-trained
        guts can push past it — but it's a sensible ceiling for the vast majority of riders.
      </p>
      <p style={articleSourcesStyle}>
        Sources:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/20466803/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Cox et al., J Appl Physiol 2010
        </a>{' '}
        (28 days of training with high carb availability raised exogenous carbohydrate oxidation and
        time-trial performance by ~6%).
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Check your absorption cap →
        </a>
      </p>
    </FaqLayout>
  );
}
