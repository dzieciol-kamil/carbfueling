import { calculatorHref, assetHref } from '../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../FaqLayout';

export default function CarbTransporterMixEn() {
  return (
    <FaqLayout lang="en">
      <h1 style={articleH1Style}>Why can't you absorb more than ~90g of carbs per hour?</h1>
      <p style={articleTextStyle}>
        Your gut absorbs sugar through two separate doors — two different transport proteins built
        into the intestinal wall. Glucose uses one, called SGLT1; fructose uses another, called
        GLUT5. Because they're physically separate systems, each has its own independent speed
        limit.
      </p>
      <p style={articleTextStyle}>
        SGLT1 can move about 60g of glucose per hour, no matter how much glucose you drink — it's an
        active, sodium-linked carrier that simply saturates at that rate. Drink only glucose gels or
        plain maltodextrin, and 60g/h is your hard ceiling — extra sugar just sits in your stomach
        and causes bloating or cramps.
      </p>
      <p style={articleTextStyle}>
        GLUT5 handles fructose on a separate route, good for about another 30g per hour. Mix
        fructose into your carb source, and you're using both doors at once. That's why
        glucose-fructose blends push the realistic ceiling up to around 90g per hour.
      </p>
      <p style={articleTextStyle}>
        This isn't just theory — it's been measured directly. Exercise physiologists track it with
        dual-tracer feeding trials, using labelled sugars to see how quickly ingested carbohydrate
        actually shows up as fuel being burned (exogenous carbohydrate oxidation). Research on
        combined glucose-fructose feeding (Jeukendrup, 2010) found that pairing carb sources that
        use different transporters — what he called "multiple transportable carbohydrates" — lets
        riders oxidize carbs roughly 50% faster than glucose alone — the ~60g/h vs ~90g/h gap
        described above (lab studies have measured up to ~105g/h).
      </p>
      <img
        src={assetHref('/faq/carb-transporter-mix/absorption-cap.png')}
        alt="Mix panel showing the glucose:fructose ratio presets and the resulting absorption ceiling in Carb Fueling."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        The ratio matters. Too much fructose and you waste the glucose door's capacity; too little
        and you waste the fructose door's. A 2:1 glucose-to-fructose ratio by weight is a good
        starting point for most riders — that's the default "Izo" mix in Carb Fueling.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling calculates your personal ceiling from the mix ratio you set, and shows it live
        as you change the mix.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          See your own ceiling →
        </a>
      </p>
    </FaqLayout>
  );
}
