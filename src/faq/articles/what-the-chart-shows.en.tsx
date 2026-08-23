import { faqHref, calculatorHref, assetHref } from '../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../FaqLayout';

export default function WhatTheChartShowsEn() {
  return (
    <FaqLayout lang="en" slug="what-the-chart-shows">
      <h1 style={articleH1Style}>What the chart actually shows: from bottle to bloodstream</h1>
      <p style={articleTextStyle}>
        Every point on the chart starts with one simple fact: what you actually ate or drank at that
        moment on the route. This is intake — the raw input to everything else. A gel, a sip from
        your bottle, a banana at a rest stop. The chart records it exactly where it happened on the
        route, not as one total for the whole ride.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/intake-vessels.jpg')}
        alt="Bottle and gel entries in Carb Fueling's plan list, each labeled with its content and amount."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Food and drink don't turn into usable fuel the moment they reach your mouth. They land in
        your stomach and gut first, and digest gradually. There's a real lag between eating
        something and your body being able to use it. The chart shows this honestly — carbs sit in
        your gut for a while, waiting, instead of becoming available the instant you swallow them.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/gut-strip.jpg')}
        alt="The gut-content strip at the top of the chart, filling up and draining as carbs digest."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        No matter how much you eat, your gut can only push a limited amount of carbohydrate into
        your bloodstream each hour. This is the absorption cap, and it shows up on the chart as a
        flat ceiling line. With a good glucose-fructose blend, that ceiling sits at roughly 90g per
        hour for most riders — see{' '}
        <a href={faqHref('en', 'carb-transporter-mix')}>
          why this ceiling exists and how mixing sugars raises it
        </a>
        . Eating more than the cap doesn't help — the extra just sits in your stomach longer.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/absorption-cap.jpg')}
        alt="The flat dashed absorption-limit line sitting above the rising need and absorbed lines."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        The "need" line is the demand side of the picture. It shows how many carbs your ride
        requires each hour, based on how hard you're working at that point — climb a steep hill and
        it rises, roll down the other side and it drops. Against it sits "absorbed": how much
        carbohydrate your body has actually taken in and can use, held back by two things at once —
        how much you've eaten, and the absorption cap. Even a well-fed rider can't push absorbed
        past the ceiling. Watching these two lines side by side, hour by hour, is the core skill of
        reading this chart.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/need-absorbed.jpg')}
        alt="Need and absorbed lines together, with the gap between them shaded to show the deficit."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        When absorbed drops below need for a stretch of the route, that gap gets marked as a
        deficit. This is where bonk risk quietly builds — not in one dramatic moment, but minute by
        minute, hour by hour. See{' '}
        <a href={faqHref('en', 'bonk-crisis')}>what happens when that gap runs on too long</a>, and
        how a small, ignored deficit turns into a real crisis on the bike.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/deficit.jpg')}
        alt="A close-up of the shaded deficit gap between the need and absorbed lines early in the ride."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Fluid works the same way, on its own pair of lines: fluid absorbed versus sweat loss,
        tracking hydration instead of carbs.
      </p>
      <img
        src={assetHref('/faq/what-the-chart-shows/fluid-lines.png')}
        alt="The fluid absorbed and sweat loss lines on the chart's hydration view."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Seeing this whole pipeline laid out, instead of one number, is the actual point of the
        chart. It turns "did I eat enough today" from a question you answer after the ride into
        something you can watch coming, hours ahead, and fix before it becomes a problem.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Watch your own fueling line →
        </a>
      </p>
    </FaqLayout>
  );
}
