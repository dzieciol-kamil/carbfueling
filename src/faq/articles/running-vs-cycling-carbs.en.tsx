import { faqHref, calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function RunningVsCyclingCarbsEn() {
  return (
    <FaqLayout lang="en" slug="running-vs-cycling-carbs">
      <h1 style={articleH1Style}>
        Running vs. cycling: how carb needs and absorption really differ
      </h1>
      <p style={articleTextStyle}>
        Runners often assume their gut is worse at handling carbs than a cyclist's. The research
        says something more specific: your absorption machinery doesn't actually change between the
        two sports. What changes is how much abuse it's taking at the same time — and that's why the
        same on-paper numbers can play out very differently on foot.
      </p>
      <p style={articleTextStyle}>
        Start with the part that stays the same. Studies comparing exogenous carb oxidation directly
        between running and cycling at similar effort found no meaningful difference in how much
        carb the body could actually process per hour. The gut's absorption ceiling — set by the
        sugar transporters in the intestinal wall, explained in{' '}
        <a href={faqHref('en', 'carb-transporter-mix')} style={articleLinkStyle}>
          why you can't absorb more than about 90g of carbs per hour
        </a>{' '}
        — is a property of your gut, not of the sport you're doing it in.
      </p>
      <p style={articleTextStyle}>
        So why does running so often feel worse? Because absorption capacity and comfort aren't the
        same thing. Running adds mechanical stress cycling doesn't: every footstrike bounces the
        stomach and raises intra-abdominal pressure in a way pedaling never does. That extra
        jostling — on top of the blood flow shifted away from the gut that any hard effort causes,
        covered in{' '}
        <a href={faqHref('en', 'pace-power-absorption')} style={articleLinkStyle}>
          whether pace or power affects what you can absorb
        </a>{' '}
        — is enough to tip a stomach that would have been fine on a bike into real trouble on foot.
      </p>
      <p style={articleTextStyle}>
        The numbers back this up. Studies of ultra-distance events put gastrointestinal complaints
        at 70-85% of runners over multi-stage or 24-hour races. Comparable studies of cyclists found
        no link at all between what riders ate or drank and whether they had GI symptoms. Same fuel,
        same rough intensity, very different outcome — because the sport itself is part of the
        stress, not just the effort.
      </p>
      <p style={articleTextStyle}>
        The practical takeaway isn't "eat less because your gut is weaker." It's "eat with less
        margin for error, because the same gram-for-gram plan has less room to go wrong." The
        carbs-per-hour ranges by intensity and duration in{' '}
        <a href={faqHref('en', 'carbs-per-hour-by-intensity')} style={articleLinkStyle}>
          how many carbs per hour you actually need
        </a>{' '}
        were built around cycling; running the same duration and intensity, it's sensible to aim for
        the lower end of that range, or a step below it, rather than the top.
      </p>
      <p style={articleTextStyle}>
        This is also why gut training doesn't transfer perfectly between sports. A stomach that
        handles 80g/h comfortably on the bike hasn't been tested against footstrike impact at all —
        the mechanical stressor is simply absent from that training. See{' '}
        <a href={faqHref('en', 'gut-training-carb-tolerance')} style={articleLinkStyle}>
          training your gut
        </a>{' '}
        for the general approach; for running specifically, the progression needs to happen on runs,
        not just on the bike, before you trust the number on race day.
      </p>
      <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--muted)', marginBottom: 16 }}>
        Sources:{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/21049089/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Pfeiffer et al., Med Sci Sports Exerc 2011
        </a>{' '}
        (carb oxidation, running vs. cycling);{' '}
        <a
          href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4701764/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Costa et al., Sports Med Open 2016
        </a>{' '}
        (GI symptoms in ultramarathon runners);{' '}
        <a
          href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11753326/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Eur J Appl Physiol 2024
        </a>{' '}
        (GI symptoms and nutrition in a non-professional cycling event).
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Plan your carb intake →
        </a>
      </p>
    </FaqLayout>
  );
}
