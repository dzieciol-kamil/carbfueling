import { buildTcx, courseFileName, planCoursePoints } from '../domain/courseExport';
import { useAppStore } from '../store/appStore';
import { saveTextFile } from '../utils/fileSave';

// Shared "download the plan as a course file" handler behind the Pobierz/Download button in the
// GPX row — used by RoutePanel.tsx (desktop) and MobileRouteSheet.tsx (mobile), which render their
// own buttons because their markup differs. Same split as usePlanFileTransfer.ts next door.
export function useCourseDownload() {
  const route = useAppStore((s) => s.route);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const foodLib = useAppStore((s) => s.foodLib);
  const shops = useAppStore((s) => s.shops);
  const lang = useAppStore((s) => s.ui.lang);

  const track = route.gpxTrack?.pts;
  // A plan saved before course export existed has elevations but no coordinates, so there is
  // nothing to write a course onto until the rider loads their GPX again.
  const ready = !!track && track.length >= 2;

  const download = async () => {
    if (!track || track.length < 2) return;
    const points = planCoursePoints({ route, gear, fills, foods, foodLib, shops, lang });
    const xml = buildTcx({ points, track, route, name: route.gpxName ?? 'course' });
    try {
      await saveTextFile(xml, courseFileName(route.gpxName), 'application/vnd.garmin.tcx+xml');
    } catch {
      // saveTextFile already swallows the rider dismissing the native picker; what is left is a
      // genuine write failure, which the browser reports itself. Nothing useful to add here, and
      // the GPX row has no feedback slot to add it to.
    }
  };

  return { ready, download };
}
