import { faqHref, calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function PacePowerAbsorptionEn() {
  return (
    <FaqLayout lang="en" slug="pace-power-absorption">
      <h1 style={articleH1Style}>Does your pace or power affect how much you can absorb?</h1>
      <p style={articleTextStyle}>
        It's easy to mix up two different things: how many carbs your effort burns, and how many
        carbs your gut can absorb. They are not the same, and they don't move together. Burn rate —
        how many carbs your body demands per hour — scales up directly with how hard you ride.
        Absorption rate — how many carbs your gut can actually take in per hour — is set mostly by a
        separate system in your intestine, and it does not scale the same way.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling's intensity setting (low, mid, high) changes the demand side of the equation:
        it estimates how many carbs a given route burns per hour based on how hard you're riding.
        But that number is only half the picture. The other half is your gut's absorption ceiling —
        a largely separate limit set by the transport proteins in your intestinal wall, explained in{' '}
        <a href={faqHref('en', 'carb-transporter-mix')} style={articleLinkStyle}>
          why you can't absorb more than about 90g of carbs per hour
        </a>
        .
      </p>
      <p style={articleTextStyle}>
        Here's the part that surprises people: for most of the intensity range you'll actually ride
        at, that absorption ceiling stays roughly constant. Whether you're spinning easy or pushing
        a solid tempo, your gut can still move around 60g/h from a single carb source, or up to
        about 90g/h from a good glucose-fructose blend. Riding harder increases what you need. It
        does not automatically increase what you can take in.
      </p>
      <p style={articleTextStyle}>
        That changes at the extreme end of the effort scale. Above roughly 80-90% of your maximum
        effort — hard sprints, or racing at threshold or above — your body redirects blood flow away
        from your gut and toward your working muscles and skin. Less blood reaching the intestine
        means slower gastric emptying and slower absorption. At genuinely maximal efforts, your
        ceiling can drop right when your demand is at its highest. That mismatch is a big part of
        why very hard efforts are so much more likely to cause stomach trouble.
      </p>
      <p style={articleTextStyle}>
        For most endurance riding — steady, moderate-to-hard, multi-hour efforts — you never reach
        that extreme zone. So you can reasonably assume your trained absorption ceiling holds for
        the whole ride. Racing at very high sustained intensity is where fueling actually gets
        harder, and it's not simply because you need more carbs. Your capacity to take them in can
        shrink at exactly the wrong moment.
      </p>
      <p style={articleTextStyle}>
        This is one reason{' '}
        <a href={faqHref('en', 'gut-training-carb-tolerance')} style={articleLinkStyle}>
          gut training
        </a>{' '}
        should include some practice at race-relevant hard efforts, not only easy rides. How well
        you tolerate carbs on an easy spin tells you little about how well you'll tolerate them deep
        into a hard race. Testing your fueling at the intensity you'll actually race is what tells
        you the truth.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling keeps these two things visible side by side: the intensity setting drives how
        many carbs your ride demands, and your mix ratio sets the ceiling for how many you can
        absorb. Seeing both together makes it obvious when a plan is asking more of your gut than it
        can deliver.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          See your demand and your ceiling together →
        </a>
      </p>
    </FaqLayout>
  );
}
