import { faqHref, calculatorHref, assetHref } from '../../urls';
import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../FaqLayout';

export default function BonkCrisisEn() {
  return (
    <FaqLayout lang="en">
      <h1 style={articleH1Style}>What actually happens when you bonk — and how to see it coming</h1>
      <p style={articleTextStyle}>
        A bonk isn't sudden. It's the end point of a gap that's been growing the whole ride —
        between the carbs your body burns and the carbs you're actually getting in.
      </p>
      <p style={articleTextStyle}>
        Your muscles burn carbs at a rate set by your effort: harder pace, faster burn. Your gut can
        only deliver carbs at its own rate, capped by the absorption ceiling (see{' '}
        <a href={faqHref('en', 'carb-transporter-mix')}>why you can't absorb more than ~90g/h</a>).
        If burn rate stays above delivery rate for long enough, your glycogen stores — the carb
        reserve in muscle and liver — run down. Once that reserve is close to empty, your body can't
        keep up the power output: pace collapses fast, along with focus and coordination. That's the
        bonk.
      </p>
      <img
        src={assetHref('/faq/bonk-crisis/supply-demand-gap.png')}
        alt="Carb Fueling chart showing carb supply falling below demand, with a visible gap between the two lines."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        The warning sign is visible before it happens: a widening gap between "carbs burned" and
        "carbs delivered" on a timeline. Carb Fueling plots both as you build a route, so you can
        see the gap opening and fix it — earlier feeds, a stronger mix, or a slightly easier pace —
        before it turns into a crisis.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Plot your own supply vs demand →
        </a>
      </p>
    </FaqLayout>
  );
}
