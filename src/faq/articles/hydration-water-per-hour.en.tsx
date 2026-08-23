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
        Carb Fueling takes the temperature you set for your route and your riding effort, and uses
        them to estimate your fluid need in ml per hour alongside your carb plan — so you don't have
        to guess or run your own weigh-in test mid-ride.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Plan your fluid and carb targets together →
        </a>
      </p>
    </FaqLayout>
  );
}
