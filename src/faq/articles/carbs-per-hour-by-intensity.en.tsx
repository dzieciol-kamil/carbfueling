import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function CarbsPerHourByIntensityEn() {
  return (
    <FaqLayout lang="en">
      <h1 style={articleH1Style}>How many carbs per hour do you actually need?</h1>
      <p style={articleTextStyle}>
        There's no single correct number of grams per hour. The right amount depends mainly on how
        long you're riding and how hard. What follows is a practical range for most riders, not a
        strict rule — think of it as a starting point to adjust based on how you feel.
      </p>
      <p style={articleTextStyle}>
        For rides under about an hour, carbs barely matter. Your body's glycogen stores — the sugar
        already saved in your muscles and liver — are enough to cover that kind of effort on their
        own. In this case, water or a hydration drink matters more than carb intake.
      </p>
      <p style={articleTextStyle}>
        Once a ride stretches to 1–2.5 hours, carbs start to earn their place. Roughly 30–60g per
        hour is the useful range here. The goal is to spare your glycogen stores and keep your
        effort quality up in the later part of the ride, rather than to fuel every calorie you burn.
      </p>
      <p style={articleTextStyle}>
        Beyond about 2.5–3 hours, especially if the pace is moderate to hard, you can push intake up
        to 60–90g per hour. Getting that high only works well with a glucose-fructose blend, because
        a single carb source — glucose or maltodextrin alone — tends to cap out around 60g per hour
        no matter how much you drink. See{' '}
        <a href="/faq/carb-transporter-mix/" style={articleLinkStyle}>
          why that ceiling exists and how a glucose-fructose mix raises it
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        Intensity changes how urgently you need to reach the top of that range. An easy long day can
        often get by nearer the low end even after several hours, since you're burning glycogen more
        slowly. A hard or race-pace effort burns through glycogen faster and rewards higher carb
        intake, even at the same duration.
      </p>
      <p style={articleTextStyle}>
        A simple way to gauge intensity without a power meter or heart rate strap: can you still
        talk? Low means you can chat comfortably in full sentences. Medium means you can talk, but
        only in short sentences. High means you can barely speak at all, focused on your breathing.
        This is the same scale Carb Fueling's intensity setting uses.
      </p>
      <p style={articleTextStyle}>
        Body size and training status shift the exact number too — a larger rider or someone with a
        well-trained gut can often handle and use more carbs per hour than these ranges suggest.
        Treat 30–90g/h as a starting range to dial in through practice, not a target that fits every
        rider equally.
      </p>
      <p style={articleTextStyle}>
        Rather than applying a flat rule of thumb, Carb Fueling runs the numbers for your specific
        ride — using your route duration and intensity to work out your actual hourly carb need.
      </p>
      <p>
        <a href="/" style={articleLinkStyle}>
          Work out your own hourly target →
        </a>
      </p>
    </FaqLayout>
  );
}
