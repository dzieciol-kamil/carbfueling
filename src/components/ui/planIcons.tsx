/**
 * The Planning row's icons, shared by the desktop row (ChartCard.tsx), the autoplan button
 * (AutoplanFlow.tsx) and the menus that gather the plan's actions (MobilePlanMenu.tsx, and
 * ChartCard.tsx's "More").
 */
// Matches Header.tsx's GearIcon/MixIcon/FoodIcon/SettingsIcon idiom (viewBox, stroke width,
// sizing).
export function WandIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 17.5 L13 9" />
      <path d="M16.5 3 v4 M14.5 5 h4" />
    </svg>
  );
}

// These three match Header.tsx's GearIcon/MixIcon/FoodIcon/SettingsIcon idiom (viewBox,
// stroke width, sizing) so the whole Planning row reads as one icon set.
export function DownloadIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 3.5 V13.5 M7 10 L11 14 L15 10 M4.5 18.5 H17.5" />
    </svg>
  );
}

export function UploadIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 14.5 V4.5 M7 8 L11 4 L15 8 M4.5 18.5 H17.5" />
    </svg>
  );
}

// A six-ray asterisk/sparkle (✳): three equal-length diameters through a common centre,
// 60° apart (0°/60°/120°). Open strokes, no fill, no closed outline — deliberately not the
// closed/filled star this replaced (that read as "favourite", not "fresh start").
export function StartOverIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
    >
      <path d="M3.5 11 L18.5 11 M7.3 4.5 L14.8 17.5 M14.8 4.5 L7.3 17.5" />
    </svg>
  );
}
