import test from "node:test";
import assert from "node:assert/strict";
import { events, payload } from "./fixtures";
import { KEYS, mount } from "./harness";

test("shows a progress message, then the overview", async () => {
  const app = mount();
  try {
    assert.match(app.frame(), /Coletando/);
    await app.seen("Consumo diário");
    const frame = app.frame();
    assert.match(frame, /TOKENS/);
    assert.match(frame, /7,2 mil/); // 1.200 + 5.000 + 1.000 in the 30-day window
    assert.match(frame, /Por serviço/);
    assert.match(frame, /Modelos mais usados/);
    assert.match(frame, /Meta mensal/);
    assert.match(frame, /Canal: Ferramentas · Período: 30 dias/);
  } finally {
    app.unmount();
  }
});

test("number keys and Tab switch screens", async () => {
  const app = mount();
  try {
    await app.seen("Consumo diário");
    await app.press("2");
    assert.match(app.frame(), /Agrupado por/);
    await app.press("3");
    assert.match(app.frame(), /Fontes de dados/);
    await app.press(KEYS.tab);
    assert.match(app.frame(), /Consumo diário/);
  } finally {
    app.unmount();
  }
});

test("filter keys change channel, period and service", async () => {
  const app = mount();
  try {
    await app.seen("Consumo diário");
    await app.press("d");
    assert.match(app.frame(), /Período: 90 dias/);
    await app.press("s");
    assert.match(app.frame(), /Serviço: Codex/);
    assert.match(app.frame(), /1,2 mil/);
    await app.press("c");
    assert.match(app.frame(), /Canal: APIs/);
    assert.match(app.frame(), /Serviço: Todos|Sem consumo nesta seleção/);
  } finally {
    app.unmount();
  }
});

test("activity search narrows rows and Esc clears it", async () => {
  const app = mount();
  try {
    await app.seen("Consumo diário");
    await app.press("2");
    assert.match(app.frame(), /projeto-beta/);
    await app.press("/");
    for (const letter of "beta") await app.press(letter);
    assert.match(app.frame(), /Busca: beta/);
    assert.doesNotMatch(app.frame(), /grok-sintetico/);
    await app.press(KEYS.enter);
    assert.match(app.frame(), /Busca: beta/);
    await app.press("/");
    await app.press(KEYS.escape);
    assert.match(app.frame(), /projeto-alfa/);
    assert.match(app.frame(), /\/ buscar/);
  } finally {
    app.unmount();
  }
});

test("g cycles the activity grouping", async () => {
  const app = mount();
  try {
    await app.seen("Consumo diário");
    await app.press("2");
    await app.press("g");
    assert.match(app.frame(), /Agrupado por Modelo/);
    assert.match(app.frame(), /modelo-sem-tarifa/);
    await app.press("g");
    await app.press("g");
    assert.match(app.frame(), /Agrupado por Dia/);
    assert.match(app.frame(), /07\/10/);
  } finally {
    app.unmount();
  }
});

test("project picker applies the chosen project", async () => {
  const app = mount();
  try {
    await app.seen("Consumo diário");
    await app.press("p");
    assert.match(app.frame(), /Todos os projetos/);
    await app.press(KEYS.down);
    await app.press(KEYS.enter);
    assert.match(app.frame(), /Projeto: projeto-alfa/);
    assert.doesNotMatch(app.frame(), /Todos os projetos/);
  } finally {
    app.unmount();
  }
});

test("help overlay opens with ? and closes on any key", async () => {
  const app = mount();
  try {
    await app.seen("Consumo diário");
    await app.press("?");
    assert.match(app.frame(), /Atalhos/);
    await app.press("x");
    assert.doesNotMatch(app.frame(), /Atalhos/);
  } finally {
    app.unmount();
  }
});

test("a tiny window shows a size warning instead of a broken layout", async () => {
  const app = mount({ size: { columns: 60, rows: 20 } });
  try {
    await app.seen("Janela pequena (60×20)");
  } finally {
    app.unmount();
  }
});

test("first load failure shows the error and r retries", async () => {
  let calls = 0;
  const app = mount({
    load: async () => {
      calls++;
      if (calls === 1) throw new Error("disco indisponível");
      return payload();
    },
  });
  try {
    await app.seen("Não foi possível consultar seu histórico.");
    assert.match(app.frame(), /disco indisponível/);
    await app.press("r");
    await app.seen("Consumo diário");
  } finally {
    app.unmount();
  }
});

test("a failed refresh keeps the last snapshot and warns", async () => {
  let calls = 0;
  const app = mount({
    load: async () => {
      calls++;
      if (calls > 1) throw new Error("leitura falhou");
      return payload();
    },
  });
  try {
    await app.seen("Consumo diário");
    await app.press("r");
    await app.seen("Falha ao atualizar: leitura falhou");
    assert.match(app.frame(), /Consumo diário/);
  } finally {
    app.unmount();
  }
});

test("cursor scrolls through long activity lists", async () => {
  const many = Array.from({ length: 40 }, (_, index) => ({
    ...events[0],
    id: `bulk-${index}`,
    sessionId: `bulk-${index}`,
    project: `bulk-projeto-${String(index).padStart(2, "0")}`,
    timestamp: `2026-10-07T${String(10 + (index % 5)).padStart(2, "0")}:${String(index).padStart(2, "0")}:00Z`,
  }));
  const app = mount({
    load: async () => payload({ events: many }),
    size: { columns: 100, rows: 24 },
  });
  try {
    await app.seen("Consumo diário");
    await app.press("2");
    assert.match(app.frame(), /1–18 de 40/);
    await app.press(KEYS.pageDown);
    assert.match(app.frame(), /de 40/);
    assert.doesNotMatch(app.frame(), /1–18 de 40/);
    await app.press(KEYS.pageDown);
    await app.press(KEYS.pageDown);
    await app.press(KEYS.pageDown);
    assert.match(app.frame(), /23–40 de 40/);
    await app.press(KEYS.up);
    assert.match(app.frame(), /› /);
  } finally {
    app.unmount();
  }
});

test("q quits and the app stops reacting", async () => {
  const app = mount();
  try {
    await app.seen("Consumo diário");
    await app.press("q");
    await app.press("2");
    assert.doesNotMatch(app.frame(), /Agrupado por/);
  } finally {
    app.unmount();
  }
});

test("narrow windows still render the overview within 80x24", async () => {
  const app = mount({ size: { columns: 80, rows: 24 } });
  try {
    await app.seen("Consumo diário");
    const lines = app.frame().split("\n");
    assert.ok(lines.length <= 24, `frame has ${lines.length} lines`);
    assert.ok(lines.every((line) => line.length <= 80));
    assert.match(app.frame(), /Por serviço/);
  } finally {
    app.unmount();
  }
});

test("a long pasted search keeps the activity header and frame size intact", async () => {
  const app = mount({ size: { columns: 80, rows: 24 } });
  try {
    await app.seen("Consumo diário");
    await app.press("2");
    await app.press("/");
    await app.press(`/Users/synthetic/${"muito-longo/".repeat(8)}fim`);
    const lines = app.frame().split("\n");
    assert.ok(lines.length <= 24, `frame has ${lines.length} lines`);
    assert.ok(lines.every((line) => line.length <= 80));
    assert.match(app.frame(), /Agrupado por Sessão/);
    assert.match(app.frame(), /Busca: .*fim▌/);
  } finally {
    app.unmount();
  }
});

test("cache savings are marked partial when some cache has no tariff", async () => {
  const app = mount();
  try {
    await app.seen("Consumo diário");
    assert.match(app.frame(), /30,8% parcial/);
  } finally {
    app.unmount();
  }
});

test("cache savings and cost show a dash, not zero, without any tariff", async () => {
  const app = mount({
    load: async () => payload({ events: [events[1]] }),
  });
  try {
    await app.seen("Consumo diário");
    assert.match(app.frame(), /Cache sem tarifa/);
    assert.match(app.frame(), /Sem tarifa cadastrada/);
    assert.doesNotMatch(app.frame(), /US\$ 0,00/);
  } finally {
    app.unmount();
  }
});

const english = () => {
  const base = payload();
  return payload({ settings: { ...base.settings, language: "en" } });
};

test("follows the language saved in the web preferences", async () => {
  const app = mount({ load: async () => english() });
  try {
    await app.seen("Daily usage");
    const frame = app.frame();
    assert.match(frame, /Overview/);
    assert.match(
      frame,
      /Channel: Tools · Period: 30 days · Service: All · Project: All/,
    );
    assert.match(frame, /Updated 12:00/);
    assert.match(frame, /Monthly goal/);
    assert.match(frame, /Most used models/);
    assert.match(frame, /Tab screens {2}c channel {2}d period/);
    assert.match(frame, /7\.2K/);
    assert.doesNotMatch(frame, /Visão geral|Período|Consumo diário|Modelos/);
  } finally {
    app.unmount();
  }
});

test("the --lang option wins over the saved preference", async () => {
  const app = mount({
    load: async () => english(),
    options: {
      once: false,
      help: false,
      days: 30,
      channel: "tool",
      lang: "pt-BR",
    },
  });
  try {
    await app.seen("Consumo diário");
    assert.match(app.frame(), /Período: 30 dias/);
  } finally {
    app.unmount();
  }
});

test("activity, sources, help and project picker speak English", async () => {
  const app = mount({ load: async () => english() });
  try {
    await app.seen("Daily usage");
    await app.press("2");
    assert.match(app.frame(), /Grouped by Session \(g\) · 3 items/);
    assert.match(app.frame(), /\/ search/);
    assert.match(
      app.frame(),
      /Project .*Models .*Last .*Tokens .*Cache .*Cost/,
    );
    await app.press("g");
    assert.match(app.frame(), /Grouped by Model/);
    await app.press("g");
    await app.press("g");
    assert.match(app.frame(), /1 session/);
    await app.press("/");
    assert.match(app.frame(), /Type to search · Enter confirms · Esc clears/);
    await app.press(KEYS.escape);
    await app.press("3");
    assert.match(app.frame(), /Data sources/);
    assert.match(app.frame(), /Collecting/);
    assert.match(app.frame(), /Needs attention/);
    assert.match(app.frame(), /files · .* records/);
    await app.press("?");
    assert.match(app.frame(), /Shortcuts/);
    assert.match(app.frame(), /Switch screen/);
    await app.press("x");
    await app.press("p");
    assert.match(app.frame(), /All projects/);
    assert.match(app.frame(), /↑↓ choose · Enter confirm · Esc cancel/);
  } finally {
    app.unmount();
  }
});

test("English covers errors, loading and partial cost states", async () => {
  const loading = mount({
    load: () => new Promise(() => {}),
    options: {
      once: false,
      help: false,
      days: 30,
      channel: "tool",
      lang: "en",
    },
  });
  try {
    assert.match(loading.frame(), /Collecting/);
  } finally {
    loading.unmount();
  }
  const failing = mount({
    load: async () => {
      throw new Error("disk unavailable");
    },
    options: {
      once: false,
      help: false,
      days: 30,
      channel: "tool",
      lang: "en",
    },
  });
  try {
    await failing.seen("Could not read your history.");
    assert.match(failing.frame(), /r retries · q quits/);
  } finally {
    failing.unmount();
  }
  const noTariff = mount({
    load: async () => {
      const base = payload({ events: [events[1]] });
      return {
        ...base,
        settings: { ...base.settings, language: "en" as const },
      };
    },
  });
  try {
    await noTariff.seen("Daily usage");
    assert.match(noTariff.frame(), /Cache without tariff/);
    assert.match(noTariff.frame(), /No tariff set/);
  } finally {
    noTariff.unmount();
  }
});

test("English uses month-first dates, full times and singular counts", async () => {
  const app = mount({ load: async () => english() });
  try {
    await app.seen("Daily usage");
    await app.press("2");
    assert.match(app.frame(), /10\/07 \d{2}:\d{2} [AP]M/);
    await app.press("g");
    await app.press("g");
    await app.press("g");
    assert.match(app.frame(), /10\/07/);
    assert.doesNotMatch(app.frame(), /07\/10/);
    await app.press("3");
    await app.press("c");
    assert.match(app.frame(), /1 file · 1 record /);
  } finally {
    app.unmount();
  }
});
