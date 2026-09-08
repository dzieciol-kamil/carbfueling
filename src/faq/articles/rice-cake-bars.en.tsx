import { faqHref, calculatorHref } from '../../urls';
import { FaqLayout, articleH1Style, articleLinkStyle, articleTextStyle } from '../FaqLayout';

export default function RiceCakeBarsEn() {
  return (
    <FaqLayout lang="en" slug="rice-cake-bars">
      <h1 style={articleH1Style}>Homemade rice cakes: a real-food recipe for when gels get old</h1>
      <p style={articleTextStyle}>
        Our article on{' '}
        <a href={faqHref('en', 'fueling-100km-vs-300km')} style={articleLinkStyle}>
          fueling a 100 km ride vs. a 300+ km ride
        </a>{' '}
        notes that after enough hours, the same gel or drink that tasted fine at the start can
        become hard to stomach — flavor fatigue. Rice cakes are a classic answer to that problem: a
        dense, compact rice bar popular among long-distance riders and ultra-runners precisely
        because it tastes nothing like a sweet gel or an isotonic drink.
      </p>
      <p style={articleTextStyle}>Recipe, makes 8 bars:</p>
      <ul style={{ ...articleTextStyle, paddingLeft: 20 }}>
        <li>200 g sushi rice</li>
        <li>200 ml coconut milk — the thick, solid part only</li>
        <li>80 g fresh dates (dried also works)</li>
        <li>350 ml water for cooking (plus separate water for rinsing the rice)</li>
        <li>4 tablespoons sugar</li>
        <li>3 pinches of salt</li>
      </ul>
      <p style={articleTextStyle}>
        Rinse the rice twice and cook it in about 2.5 times its volume of water for 20 minutes, then
        stir in the solid coconut milk, dates, sugar, and salt. Shape the mixture on parchment paper
        into an even rectangular block — cutting boards pressed against the sides help keep the
        edges straight — and chill it in the fridge or freezer for a few hours until it firms up.
        Slice into 8 equal pieces and wrap them individually. It keeps in the fridge for up to 3
        days, or indefinitely in the freezer.
      </p>
      <p style={articleTextStyle}>
        One piece works out to about 140 kcal, 30 g of carbohydrate, 2 g of protein, and 2 g of fat.
        At a typical{' '}
        <a href={faqHref('en', 'carbs-per-hour-by-intensity')} style={articleLinkStyle}>
          60-90 g of carbohydrate per hour
        </a>{' '}
        target, one bar covers roughly half an hour, so it is easy to work out how many pieces a
        given stretch of your ride needs — the same way you would with any other product entered
        into a Carb Fueling plan.
      </p>
      <p style={articleTextStyle}>
        The advantage of this format is texture: it holds its shape in a jersey pocket, does not
        crumble, and will not melt the way a gel can in the heat. The fat from the coconut milk also
        gives a longer feeling of fullness than sugar alone, which can help during the calmer
        stretch of a long ride when you no longer just need a quick energy spike.
      </p>
      <p style={articleTextStyle}>
        One caveat: this particular recipe is still sweet — the dates and sugar see to that. If your
        problem is specifically sweetness fatigue rather than just gel texture, cut back on the
        sugar or swap the dates for something less sweet. A rice cake only breaks the monotony if
        its flavor genuinely contrasts with whatever is already in your bottle.
      </p>
      <p>
        <a href={calculatorHref('en')} style={articleLinkStyle}>
          Add rice cake to your plan →
        </a>
      </p>
    </FaqLayout>
  );
}
