import { faqHref, calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function Fueling100kmVs300kmEn() {
  return (
    <FaqLayout lang="en">
      <h1 style={articleH1Style}>
        Fueling a 100 km ride vs. a 300+ km ride: what actually changes
      </h1>
      <p style={articleTextStyle}>
        A 100 km ride and a 300 km ride are not just "the same thing, three times longer." The
        limiting factor changes as the hours add up, and a fueling plan that works well for one
        distance can fail badly at the other. Here is what actually shifts.
      </p>
      <p style={articleTextStyle}>
        On a shorter ride — say 2 to 4 hours, roughly what a 100 km ride takes at a moderate pace —
        the main limit is your gut's{' '}
        <a href={faqHref('en', 'carb-transporter-mix')} style={articleLinkStyle}>
          absorption ceiling
        </a>
        . Your intestine can only take in a certain number of grams of carbohydrate per hour, no
        matter how much you eat. The good news is that over a few hours, gut fatigue has not built
        up yet, so most riders can hold intake near the top of their trained range for the whole
        ride. The main risk to manage is simple: run low on carbohydrate too early and your legs
        will feel it in the final stretch.
      </p>
      <p style={articleTextStyle}>
        An ultra-distance ride — 8 hours or more, the kind of day a 300 km route can turn into —
        changes the picture. Total energy burned over the day is huge, but your average intensity
        naturally drops the longer you are out there. Lower intensity means your body actually needs
        somewhat less carbohydrate per hour than it did earlier, which eases the pure
        absorption-ceiling problem a bit. The bigger challenges become different: hours of
        continuous eating and drinking wear down your gut, and the same gel or drink mix that tasted
        fine at hour two can become hard to stomach by hour eight. This is sometimes called flavor
        fatigue. Real food and savory options — rice cakes, sandwiches, salty snacks — start to
        matter a lot more, simply because they give your palate a break.
      </p>
      <p style={articleTextStyle}>
        Logistics scale differently too. A 100 km ride can often be fully self-sufficient — you
        carry everything in your bottles and pockets from the start and never need to stop. A 300 km
        ride usually cannot work that way: nobody carries 8 or more hours of food and drink from the
        first pedal stroke. Ultra-distance rides depend on planned resupply, so it is worth{' '}
        <a href={faqHref('en', 'bottle-refill-planning')} style={articleLinkStyle}>
          mapping out your refill stops
        </a>{' '}
        in advance rather than hoping to improvise at a random shop.
      </p>
      <p style={articleTextStyle}>
        Pacing and fatigue also interact in a way that a flat hourly target misses. As you slow down
        in the later hours of a long ride, your carbohydrate need drops along with your intensity —
        but at the same time, fatigue can dull your appetite and make your gut less willing to
        process food. A good plan has to flex in both directions: lower the target when you are
        going easier, but also watch for the point where your body simply does not want to eat, and
        adjust rather than forcing a fixed number.
      </p>
      <p style={articleTextStyle}>
        For truly long efforts — ultra-endurance events, bikepacking days that run into the night —
        sleep and darkness add another layer. Eating and drinking discipline tends to slip when you
        are tired, and it is easy to forget a scheduled feed when you are half-asleep on the bike.
        It helps to plan overnight fueling deliberately in advance, rather than trusting yourself to
        remember in the moment.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling can model a ride either by duration or by route and pace, so the same tool
        scales from a 3-hour spin to an all-day ultra-distance ride — you just describe the effort
        and let it work out the numbers.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Plan your own ride, short or long →
        </a>
      </p>
    </FaqLayout>
  );
}
