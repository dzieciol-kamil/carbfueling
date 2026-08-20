import { faqHref, calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function HeatCarbPlanEn() {
  return (
    <FaqLayout lang="en" slug="heat-carb-plan">
      <h1 style={articleH1Style}>How heat changes your carb plan (it's not just "drink more")</h1>
      <p style={articleTextStyle}>
        Heat raises your sweat rate, and it also puts extra stress on your core temperature. To cool
        down, your body sends more blood to your skin. That blood has to come from somewhere else,
        and one of the places it gets pulled from is your gut. This is a normal, healthy response —
        but it has a side effect that matters for fueling.
      </p>
      <p style={articleTextStyle}>
        With less blood flow to the gut, digestion slows down. Studies on exercise in the heat show
        that gastric emptying and carbohydrate absorption can measurably drop when core temperature
        climbs and the body prioritizes cooling. So heat doesn't just make you sweat more — it can
        also make your gut somewhat less able to process what you feed it.
      </p>
      <p style={articleTextStyle}>
        This is why "just drink more" is incomplete advice. If your gut's absorption capacity is
        already under some pressure from heat stress, adding more fluid is good, but pushing the
        same strong carb concentration on top of that extra fluid can backfire. The result is often
        bloating, nausea, or cramping — not better fueling.
      </p>
      <p style={articleTextStyle}>
        A better approach for hot rides is to dilute your bottles slightly. Your fluid needs go up a
        lot in the heat, so if you keep the same carb concentration per bottle, you end up forcing
        more total sugar through a gut that's working with less blood flow. Diluting keeps the
        concentration closer to what your gut can comfortably handle while still meeting your higher
        fluid needs.
      </p>
      <p style={articleTextStyle}>
        It also helps to lean on liquid, lower-osmolality carb sources rather than dense gels when
        the heat is on. A gel is a concentrated dose your gut has to dilute using its own fluid
        reserves; a well-mixed bottle is already at a gentler concentration. And don't forget sodium
        — sweat rate and sodium loss both climb with heat, so your electrolyte needs go up alongside
        your fluid needs (more on that in{' '}
        <a href={faqHref('en', 'sodium-electrolytes-cycling')} style={articleLinkStyle}>
          our sodium and electrolytes article
        </a>
        ).
      </p>
      <p style={articleTextStyle}>
        Heat acclimatization matters too. Riders who train in hot conditions for one to two weeks
        adapt: they sweat more efficiently, and their gut tends to tolerate heat stress better
        during exercise. A rider who's been riding in the heat all summer can handle a hot day very
        differently from someone hitting their first heat wave of the season — so your plan should
        account for how acclimatized you actually are, not just the forecast temperature.
      </p>
      <p style={articleTextStyle}>
        None of this means you need to overhaul your fueling for a normal warm day. This mainly
        matters for genuinely hot, long efforts, where the fluid and gut-tolerance tradeoffs really
        start to bite. Carb Fueling takes a route temperature input and adjusts your fluid estimate
        accordingly, so when you're planning a hot ride, you can see the fluid-versus-carb tradeoff
        directly instead of guessing at it.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Plan your next hot-weather ride →
        </a>
      </p>
    </FaqLayout>
  );
}
