import { calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function HydrationWaterPerHourEn() {
  return (
    <FaqLayout lang="en" slug="hydration-water-per-hour">
      <h1 style={articleH1Style}>How much water per hour? Hydration, heat, and sweat rate</h1>
      <p style={articleTextStyle}>
        There is no single "drink X ml per hour" number that works for every rider. Sweat rate
        varies enormously between individuals — roughly 0.5 to 2.5 liters per hour, sometimes more.
        It depends on your body size, your fitness and heat acclimatization, the air temperature and
        humidity, and how hard you're riding. Two riders on the same route, at the same pace, can
        lose very different amounts of fluid.
      </p>
      <p style={articleTextStyle}>
        The classic way to find your own number is a simple weigh-in test. Weigh yourself right
        before a steady-effort hour and again right after, without drinking anything during that
        hour (or, if you do drink, subtract what you drank from the result). The weight you lost is
        roughly your sweat loss for that hour, since 1 kg of body weight lost is close to 1 liter of
        fluid. Do this on a warm day and a cool day and you'll see how much the number moves.
      </p>
      <p style={articleTextStyle}>
        Temperature and humidity both push your sweat rate up, and they do it in different ways.
        Higher temperature simply makes your body produce more sweat to stay cool. Humidity makes
        that sweat less useful: cooling depends on sweat evaporating off your skin, and in humid air
        it evaporates more slowly. That's why a hot, humid day can feel harder to manage than a hot,
        dry day at the same reading on the thermometer — your body is sweating heavily but getting
        less cooling benefit from it.
      </p>
      <p style={articleTextStyle}>
        This creates a real tradeoff with your carb mix. If you mix your bottle strong to hit a high
        carb target, you're limited in how much plain fluid that bottle can also carry. On a hot
        ride, that concentrated mix may not give you enough water to keep up with sweat losses. Many
        riders solve this by carrying a separate plain-water bottle alongside the carb mix on hot
        days, rather than expecting one bottle to cover both hydration and fuel.
      </p>
      <p style={articleTextStyle}>
        You don't need to replace every gram of sweat loss in real time — running a small fluid
        deficit over a few hours is normal and well tolerated. But letting that deficit grow too
        large has costs. Significant dehydration hurts performance directly, and it also slows
        gastric emptying, which means the carbs you are drinking or eating get absorbed more slowly
        right when you need them fastest.
      </p>
      <p style={articleTextStyle}>
        The natural unit for that deficit is percent of body mass, because that is the unit every
        study reports its findings in — and because a litre means something very different to a 55
        kg runner than to a 95 kg rider. For a 75 kg cyclist, one litre short is about 1.3% of body
        mass. Up to roughly 2%, the evidence for any reliable performance cost is weak, and the 2%
        figure itself is genuinely disputed: several blinded trials find nothing at 2–3%, while
        others find a clear drop at the same number. Treat it as a soft warning zone, not a cliff
        edge.
      </p>
      <p style={articleTextStyle}>
        What matters more than the number is the weather you collect it in. Sawka, Cheuvront and
        Kenefick (2015) found the cost of a deficit negligible until skin temperature passes about
        27 °C — in their tally of the literature, no study in the cold (2–10 °C) showed impairment,
        while 8 of 9 above 25 °C did. The same 2% deficit costs you close to nothing on a cold day
        and several percent of your performance in real heat. That is why Carb Fueling grades the
        same shortfall differently depending on the temperature you set: at 20 °C and below the bar
        stays green out to 2.5% of body mass, and at 30 °C and above only to 1.2%.
      </p>
      <p style={articleTextStyle}>
        The other end of the scale is rarer but more dangerous. Drinking past your sweat losses
        dilutes the sodium in your blood and leads to exercise-associated hyponatraemia — the one
        acute failure mode in this whole subject with a documented path to a hospital bed, and one
        that typically catches slower finishers who drink at every aid station "to be safe". So the
        hydration bar turns dark red for a surplus too: there is no prize for drinking more than you
        lose.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling takes the temperature you set for your route and your riding effort, and uses
        them to estimate your fluid need in ml per hour alongside your carb plan — so you don't have
        to guess or run your own weigh-in test mid-ride. The figure above the hydration bar is that
        balance: a minus is a shortfall, a plus means the plan has you drinking more than you sweat.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Plan your fluid and carb targets together →
        </a>
      </p>
    </FaqLayout>
  );
}
