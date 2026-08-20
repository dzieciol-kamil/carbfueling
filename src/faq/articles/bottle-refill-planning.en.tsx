import { calculatorHref, assetHref } from '../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../FaqLayout';

export default function BottleRefillPlanningEn() {
  return (
    <FaqLayout lang="en" slug="bottle-refill-planning">
      <h1 style={articleH1Style}>Planning bottle refills on a long ride</h1>
      <p style={articleTextStyle}>
        Once a ride is longer than a couple of bottles' worth of mix, you can't carry the whole plan
        from the start line. You need refill points — and a plan for what goes in each bottle when
        you get there.
      </p>
      <p style={articleTextStyle}>
        Start with your total carb and fluid demand for the full distance (Carb Fueling calculates
        both from your route and conditions). Compare that to what your bottles and flasks can
        actually hold. Any shortfall has to come from somewhere along the way — a shop, a support
        stop, a water fountain.
      </p>
      <img
        src={assetHref('/faq/bottle-refill-planning/shop-stops.png')}
        alt="Carb Fueling route timeline with shop-stop pins placed between bottle refills."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Place a "shop stop" at each refill point on your route. Carb Fueling then splits your total
        mix across the stretches between stops, so you know exactly how much powder, water, and
        extras to carry — or buy — at each one. Put stops before a gap gets too big, not after:
        refilling at 20% supply left is a plan, refilling at 0% is a crisis.
      </p>
      <p style={articleTextStyle}>
        For short, well-stocked routes, one refill near the halfway point is often enough. For
        longer or more remote rides, space stops so no single stretch pushes your bottles past what
        they can carry.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Add shop stops to your route →
        </a>
      </p>
    </FaqLayout>
  );
}
