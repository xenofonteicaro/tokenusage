import type { ReactElement } from "react";
import type { ScreenContext } from "../context";

export interface ScreenProps {
  ctx: ScreenContext;
  width: number;
  height: number;
  cursor: number;
  pageSize: number;
  searching: boolean;
}

export interface ScreenDef {
  id: string;
  label: string;
  // Lines one list item takes and lines used by the screen's own header and
  // footer; the app derives the page size for PgUp/PgDn from them.
  itemHeight: number;
  reserved: number;
  count: (ctx: ScreenContext) => number;
  Component: (props: ScreenProps) => ReactElement | null;
}
