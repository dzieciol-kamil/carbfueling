import { faqHref, calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function BottleVsGelEn() {
  return (
    <FaqLayout lang="en" slug="bottle-vs-gel">
      <h1 style={articleH1Style}>
        Bottle or gel? When each carb-delivery format actually pays off
      </h1>
      <p style={articleTextStyle}>
        Carbs can reach your body in a few different forms: dissolved in a bottle, packed into a
        gel, or eaten as solid food. Each format has a real trade-off. Picking the right one for the
        moment — not just one format for the whole ride — is what makes a fueling plan work.
      </p>
      <p style={articleTextStyle}>
        A bottle mix is the easiest format to fuel with continuously. You sip at your own pace, and
        each sip delivers carbs and fluid together, which is efficient on hot rides where you need
        both anyway. The catch is that one bottle holds one concentration. Once it's mixed, you
        can't change it mid-ride, and once it's empty, refilling it needs a plan — a shop, a support
        stop, or water you carry to mix a new batch. If you want the logistics side of that worked
        out, we cover it in a separate article on{' '}
        <a href={faqHref('en', 'bottle-refill-planning')} style={articleLinkStyle}>
          planning bottle refills
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        Gels solve the storage problem. A single gel packet is small and dense, so you can carry
        several hours of carbs in a jersey pocket without much weight or bulk. Dosing is precise —
        each packet has a known, fixed amount of carbs, so there's no guessing how much you just
        took in. The trade-off is that a gel is concentrated. Taken on its own, without water, it
        can sit heavy in the stomach or move through your gut faster than you'd like. Most gels work
        best with a water chaser. And each packet leaves a wrapper you have to stash somewhere until
        you can bin it.
      </p>
      <p style={articleTextStyle}>
        Solid food is the format people forget to plan around, but it earns its place on longer,
        steadier rides. Chewing and slower digestion aren't a problem when your intensity is low
        enough — and real food adds taste and texture that a ride made only of sweet gels and sports
        drink can't. On very long days, that variety helps you keep eating even when your appetite
        for sugar drops. The downside is intensity and terrain: it's hard to chew and swallow while
        pushing hard, and awkward to eat at all on technical, bumpy terrain where you need both
        hands on the bar.
      </p>
      <p style={articleTextStyle}>
        In practice, most riders don't pick one format for the whole ride — they blend them. A
        bottle carries the steady baseline, sipped throughout. A gel is the fast top-up before a
        hard effort, like a long climb or an attack, when you want carbs in quickly without stopping
        to drink from a bottle. Solid food fills the calm, steady stretches, where chewing costs you
        nothing and a change of taste keeps you eating.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling lets you plan with all three formats in one place. Add bottle mix, gel, and
        food entries to your plan, and it shows you whether the combination actually covers your
        hourly carb need — hour by hour, not just as a ride total.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Build a plan that mixes bottle, gel, and food →
        </a>
      </p>
    </FaqLayout>
  );
}
