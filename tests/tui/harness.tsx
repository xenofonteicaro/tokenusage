import { render } from "ink-testing-library";
import { App, type AppProps } from "../../src/tui/app";
import type { UsagePayload } from "../../src/lib/usage-snapshot";
import { payload } from "./fixtures";

export const KEYS = {
  up: "\u001B[A",
  down: "\u001B[B",
  pageDown: "\u001B[6~",
  pageUp: "\u001B[5~",
  escape: "\u001B",
  enter: "\r",
  tab: "\t",
  backspace: "\u007F",
};

export async function waitFor(check: () => boolean, label: string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for: ${label}`);
}

// Mounts the app against a fake snapshot loader; returns helpers to drive it.
export function mount(
  props: Partial<AppProps> & { load?: () => Promise<UsagePayload> } = {},
) {
  const app = render(
    <App
      options={{ once: false, help: false, days: 30, channel: "tool" }}
      load={async () => payload()}
      size={{ columns: 100, rows: 40 }}
      intervalMs={3_600_000}
      {...props}
    />,
  );
  // Intl puts non-breaking spaces in "7,2 mil" and "US$ 1,00"; tests read plain text.
  const frame = () => (app.lastFrame() ?? "").replace(/\u00a0/g, " ");
  return {
    ...app,
    frame,
    seen: (text: string | RegExp) =>
      waitFor(
        () =>
          typeof text === "string"
            ? frame().includes(text)
            : text.test(frame()),
        String(text),
      ),
    press: async (input: string) => {
      app.stdin.write(input);
      await new Promise((resolve) => setTimeout(resolve, 20));
    },
  };
}
