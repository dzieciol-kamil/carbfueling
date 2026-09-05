import { faqHref, calculatorHref } from '../../urls';
import {
  FaqLayout,
  articleCodeStyle,
  articleH1Style,
  articleLinkStyle,
  articleSourcesStyle,
  articleTextStyle,
} from '../FaqLayout';

export default function PlanOnYourBikeComputerEn() {
  return (
    <FaqLayout lang="en" slug="plan-on-your-bike-computer">
      <h1 style={articleH1Style}>Getting your fueling plan onto your bike computer</h1>
      <p style={articleTextStyle}>
        A strip of paper taped to your top tube lasts until the first rain, and it only works if you
        remember to look down. The "Download" button next to the GPX profile saves the same plan as
        a course file: your route, with prompts written into the places where you're meant to drink
        or eat. The computer speaks up on its own.
      </p>
      <p style={articleTextStyle}>
        You load it like any other route. Garmin Connect takes .fit, .gpx and .tcx as a course: pick
        the file, give it an activity type and a name, save, push it to the head unit. Keep the name
        short — most Edges show only the first 15 characters, so two similarly named routes end up
        looking the same on the screen. Wahoo ELEMNT and Hammerhead Karoo read TCX too and will show
        the route; whether the prompts fire on those brands, we don't know.
      </p>
      <p style={articleTextStyle}>
        The computer drops a banner at the bottom of the screen with the point's name, then hides it
        after a couple of seconds. Ten characters, one glance — hence the shorthand:
      </p>
      <ul style={{ ...articleTextStyle, paddingLeft: 20 }}>
        <li>
          <code style={articleCodeStyle}>B1</code> — the first bottle, in the order your gear sits
          in the app
        </li>
        <li>
          <code style={articleCodeStyle}>(W)</code> water, <code style={articleCodeStyle}>(I)</code>{' '}
          izo, <code style={articleCodeStyle}>(G)</code> gel
        </li>
        <li>
          <code style={articleCodeStyle}>25%</code> — what should be <em>left</em> in the bottle,
          not what you should have drunk
        </li>
        <li>
          <code style={articleCodeStyle}>B3(G)2/3</code> — gel counts doses rather than a level: the
          second of three
        </li>
        <li>
          <code style={articleCodeStyle}>Stop 1/3</code> — the first of three stops
        </li>
      </ul>
      <p style={articleTextStyle}>
        The points aren't evenly spaced. A bottle drains with effort, not with distance — you drink
        faster climbing and slower descending. If the hard kilometres come early, "a quarter left"
        lands before the three-quarter mark of the leg. That comes straight off your route's
        elevation profile, the same one that{' '}
        <a href={faqHref('en', 'what-the-chart-shows')}>drives the demand line on the chart</a>.
      </p>
      <p style={articleTextStyle}>
        Levels step in quarters: at thirty kilometres an hour you can't read a bottle any finer than
        that anyway. Two bottles means two separate banners in the same spot, because a banner holds
        one name at a time. At a stop where you refill both and take a gel, it'll beep several times
        over.
      </p>
      <p style={articleTextStyle}>
        The file saves as TCX, not GPX. A waypoint in a GPX file is a pin on a map — Garmin Connect
        strips those out when it turns your upload into a course to navigate, and nothing fires
        while you ride. TCX has a separate point type for this, the course point, and that's what
        triggers the alert.
      </p>
      <p style={articleTextStyle}>
        Computers cap how many course points a route can hold, and every automatically generated
        turn counts against that cap. An Edge fits around two hundred, most watches fifty. The
        export aims at fifty: when a plan runs denser, it thins the intermediate bottle levels
        evenly across the whole route rather than cutting the tail off. Food and stops you placed
        yourself are never dropped — if you have more of those than the cap allows, the file goes
        out over it and the device decides the rest.
      </p>
      <p style={articleSourcesStyle}>
        Sources:{' '}
        <a
          href="https://support.garmin.com/en-US/?faq=aisqGZTLwH5LvbExSdO6L6"
          target="_blank"
          rel="noopener noreferrer"
        >
          Garmin
        </a>{' '}
        (course points and device limits);{' '}
        <a
          href="https://support.ridewithgps.com/hc/en-us/articles/4419007646235-Export-File-Formats"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ride with GPS
        </a>{' '}
        (which formats devices handle).
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Build a plan and send it to your computer →
        </a>
      </p>
    </FaqLayout>
  );
}
