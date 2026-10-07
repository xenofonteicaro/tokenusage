import { ActivityScreen } from "./activity";
import { OverviewScreen } from "./overview";
import { SourcesScreen, sourcesFor } from "./sources";
import type { ScreenDef } from "./types";

// Screens in tab order. Phase 2 adds Preferências here without touching the
// navigation code.
export const SCREENS: ScreenDef[] = [
  {
    id: "overview",
    label: "Visão geral",
    itemHeight: 1,
    reserved: 0,
    count: () => 0,
    Component: OverviewScreen,
  },
  {
    id: "activity",
    label: "Atividade",
    itemHeight: 1,
    reserved: 3,
    count: (ctx) => ctx.rows.length,
    Component: ActivityScreen,
  },
  {
    id: "sources",
    label: "Fontes",
    itemHeight: 5,
    reserved: 2,
    count: (ctx) => sourcesFor(ctx).length,
    Component: SourcesScreen,
  },
];
