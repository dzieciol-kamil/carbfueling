import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function SodiumElectrolytesCyclingEn() {
  return (
    <FaqLayout lang="en">
      <h1 style={articleH1Style}>
        Sodium on the bike: when extra electrolytes actually make a difference
      </h1>
      <p style={articleTextStyle}>
        Sweat is not just water. It also carries sodium, and how much sodium it carries varies a
        huge amount from one rider to the next. Some people lose around 200mg of sodium per liter of
        sweat. Others lose over 2000mg per liter — ten times as much, at the same sweat volume. This
        difference is mostly fixed by your body, not by fitness or training.
      </p>
      <p style={articleTextStyle}>
        Riders on the high end are often called "salty sweaters." You can usually spot this
        yourself: if your skin or your clothing gets a visible white residue or crust after a ride,
        that's dried salt left behind as your sweat evaporated. It's a simple, useful sign that
        you're losing more sodium than most riders.
      </p>
      <p style={articleTextStyle}>
        For most riders, on most rides, this doesn't need much thought. If your ride is under about
        two to three hours and the conditions are normal, the sodium already in your diet, plus
        whatever is already in your gels or carb mix, is usually enough. Extra electrolyte
        supplementation on top of that is often unnecessary.
      </p>
      <p style={articleTextStyle}>
        It starts to matter more in a few specific situations: long efforts in the heat, riders who
        already know they sweat heavily or saltily, and multi-hour or multi-day events. In these
        cases, sodium losses add up over time. Combined with drinking a lot of plain water, this can
        lead to muscle cramping. In extreme cases, it can lead to a serious condition called
        exercise-associated hyponatremia, where blood sodium drops to a dangerous level because too
        much plain fluid has diluted it over many hours.
      </p>
      <p style={articleTextStyle}>
        If you fall into one of those higher-risk groups, you don't need to guess. Riders who know
        they're heavy or salty sweaters, or who are riding long in hot conditions, can add
        electrolyte tablets or extra salt to their mix or diet. Two simple ways to check where you
        stand: look for salt residue after a ride, or do a sweat-rate weigh-in test (weighing
        yourself before and after a steady-effort hour, as described in the hydration FAQ) and pay
        attention to whether you tend to cramp on longer rides.
      </p>
      <p style={articleTextStyle}>
        The takeaway isn't "always add extra sodium." It's "know your own sweat profile and adjust
        for the conditions." Most casual riders on moderate rides can leave this alone. Riders doing
        long, hot, or multi-day efforts — especially if they already suspect they're salty sweaters
        — are the ones who benefit most from paying attention to it.
      </p>
      <p style={articleTextStyle}>
        If you know your own sweat sodium concentration — from a lab test, or estimated from the
        salty-sweater signs above — you can translate that into Carb Fueling's Mix panel. The "salt"
        field there is grams of ordinary table salt (NaCl) per 100ml, not pure sodium — we use salt
        because that's what you'd actually add to a bottle; pure sodium is a highly reactive metal
        you can't buy or add to a drink. Roughly, each 0.1g of salt per 100ml of drink delivers
        about 390mg of sodium per liter. So if you're aiming for, say, 700mg of sodium per liter,
        that's about 0.18g of salt per 100ml.
      </p>
      <p>
        <a href="/" style={articleLinkStyle}>
          Plan your carbs and fluids together →
        </a>
      </p>
    </FaqLayout>
  );
}
