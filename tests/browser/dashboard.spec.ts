import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";

test("shows local metrics, filters, session search, diagnostic and filtered CSV", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByText("3 de 4 fontes locais com histórico", { exact: false }),
  ).toBeVisible();
  await expect(
    page.locator('[data-metric="tokens"] [data-slot="card-title"]'),
  ).toHaveText("3,6 mil");
  await page.getByLabel("Serviço", { exact: true }).selectOption("codex");
  await expect(
    page.locator('[data-metric="tokens"] [data-slot="card-title"]'),
  ).toHaveText("1,2 mil");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar CSV" }).click();
  const file = await download;
  const csv = await fs.readFile((await file.path())!, "utf8");
  expect(csv).toContain("gpt-test");
  expect(csv).not.toContain("claude-test");
  await page.getByRole("button", { name: "Atividade", exact: true }).click();
  await page.getByLabel("Buscar atividade").fill("não-existe");
  await expect(
    page.getByRole("heading", { name: "Nenhum registro encontrado" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Fontes de dados", exact: false })
    .click();
  await expect(
    page.getByText("Gemini CLI · histórico local", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Sem contadores", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("imports API logs without duplicate consumption and persists settings", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByText("3 de 4 fontes locais com histórico", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Fontes de dados", exact: false })
    .click();
  const log = [
    {
      provider: "gemini",
      id: "api-browser-test",
      timestamp: new Date().toISOString(),
      model: "gemini-api-test",
      usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20 },
    },
  ];
  const upload = () =>
    page.getByLabel("Arquivo de consumo de API").setInputFiles({
      name: "usage.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(log)),
    });
  await upload();
  await expect(page.getByRole("status")).toContainText("processados");
  await upload();
  await expect(page.getByRole("status")).toContainText("0 novos registros");
  await page.getByRole("button", { name: "Visão geral", exact: true }).click();
  await page.getByRole("tab", { name: "APIs", exact: true }).click();
  await expect(
    page.locator('[data-metric="tokens"] [data-slot="card-title"]'),
  ).toHaveText("120");
  await page.getByRole("button", { name: "Preferências", exact: true }).click();
  await page.getByLabel("Codex", { exact: false }).fill("99.90");
  await page
    .getByLabel("Meta mensal de tokens", { exact: false })
    .fill("100000");
  await page.getByRole("button", { name: "Salvar preferências" }).click();
  await expect(
    page.getByRole("button", { name: "Preferências salvas" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("3 de 4 fontes locais com histórico", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Preferências", exact: true }).click();
  await expect(page.getByLabel("Codex", { exact: false })).toHaveValue("99.9");
  const forged = await page.request.put("/api/settings", {
    headers: { Origin: "https://evil.example" },
    data: {},
  });
  expect(forged.status()).toBe(403);
});

test("mobile navigation fits the viewport and the dashboard has no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByText("3 de 4 fontes locais com histórico", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Alternar menu lateral" }).click();
  await page
    .getByRole("button", { name: "Fontes de dados", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "Suas fontes de consumo" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Alternar menu lateral" }).click();
  await page.getByRole("button", { name: "Visão geral", exact: true }).click();
  await page.screenshot({
    path: "artifacts/dashboard-mobile-synthetic.png",
    fullPage: true,
  });
});

test("toggles light and dark themes and displays cache savings and cost metrics", async ({
  page,
}) => {
  await page.goto("/");

  // Verify theme switcher
  const darkBtn = page.getByRole("button", { name: "Tema escuro" });
  const lightBtn = page.getByRole("button", { name: "Tema claro" });
  await expect(darkBtn).toBeVisible();

  await darkBtn.click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await lightBtn.click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  // Verify Cache Savings and Cost cards
  await expect(
    page.getByText("Economia por cache", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Custo no período", { exact: true }),
  ).toBeVisible();

  await page.emulateMedia({ colorScheme: "dark" });
  await page.getByRole("button", { name: "Tema do sistema" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Tema do sistema" }),
  ).toHaveAttribute("aria-pressed", "true");

  // Verify pricing configuration in settings
  await page.getByRole("button", { name: "Preferências", exact: true }).click();
  await expect(
    page.getByLabel("Cotação do Dólar", { exact: false }),
  ).toBeVisible();
  const generalTab = page.getByRole("tab", { name: "Geral", exact: true });
  await generalTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Tabela de preços" }),
  ).toBeFocused();
  await expect(
    page.getByText("Tabela de Preços por Modelo", { exact: false }),
  ).toBeVisible();
});

test("edits and persists model prices and exchange rate, updating costs immediately", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Fontes de dados", exact: false })
    .click();
  await page.getByLabel("Arquivo de consumo de API").setInputFiles({
    name: "pricing.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify([
        {
          provider: "codex",
          id: "pricing-estimated",
          model: "gpt-4o",
          project: "pricing-synthetic",
          timestamp: new Date().toISOString(),
          usage: {
            prompt_tokens: 1000000,
            completion_tokens: 100000,
            prompt_tokens_details: { cached_tokens: 400000 },
          },
        },
        {
          provider: "codex",
          id: "pricing-real",
          model: "gpt-4o",
          project: "pricing-synthetic",
          timestamp: new Date().toISOString(),
          costUSD: 0.42,
          usage: { prompt_tokens: 1000, completion_tokens: 200 },
        },
      ]),
    ),
  });
  await expect(page.getByRole("status")).toContainText("processados");
  await page.getByRole("button", { name: "Visão geral", exact: true }).click();
  await page.getByRole("tab", { name: "APIs", exact: true }).click();
  await page
    .getByLabel("Projeto", { exact: true })
    .selectOption("pricing-synthetic");
  await page.getByRole("button", { name: "Preferências", exact: true }).click();
  await page.getByLabel("Cotação do Dólar", { exact: false }).fill("6");
  await page.getByRole("tab", { name: "Tabela de preços" }).click();
  await page.getByLabel("Entrada de gpt-4o", { exact: true }).fill("4");
  await page.getByLabel("Saída de gpt-4o", { exact: true }).fill("10");
  await page.getByLabel("Cache de gpt-4o", { exact: true }).fill("1");
  await page
    .getByLabel("Nome do modelo", { exact: true })
    .fill("custom-browser");
  await page
    .getByRole("button", { name: "Adicionar modelo", exact: true })
    .click();
  await page.getByLabel("Entrada de custom-browser", { exact: true }).fill("7");
  await page.getByRole("button", { name: "Salvar preferências" }).click();
  await expect(
    page.getByRole("button", { name: "Preferências salvas" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Visão geral", exact: true }).click();
  const costCard = page.locator('[data-metric="cost"]');
  await expect(costCard).toContainText(/25,32/);
  await expect(costCard).toContainText(/4,22/);
  await expect(costCard).toContainText(/0,42/);
  const savingsCard = page.locator('[data-metric="savings"]');
  await expect(savingsCard).toContainText(/1,20/);
  await page.getByRole("button", { name: "Atividade", exact: true }).click();
  await expect(page.locator("main")).toContainText(/3,80/);
  await expect(page.locator("main")).toContainText(/0,42/);
  await page.reload();
  await page.getByRole("button", { name: "Preferências", exact: true }).click();
  await expect(
    page.getByLabel("Cotação do Dólar", { exact: false }),
  ).toHaveValue("6");
  await page.getByRole("tab", { name: "Tabela de preços" }).click();
  await expect(
    page.getByLabel("Entrada de custom-browser", { exact: true }),
  ).toHaveValue("7");
  await expect(
    page.getByLabel("Entrada de gpt-4o", { exact: true }),
  ).toHaveValue("4");
  const settings = (await (await page.request.get("/api/usage")).json())
    .settings;
  const invalid = await page.request.put("/api/settings", {
    headers: { Origin: "http://127.0.0.1:3101" },
    data: { ...settings, usdToBrlRate: 0 },
  });
  expect(invalid.status()).toBe(400);
  expect(
    (await (await page.request.get("/api/usage")).json()).settings.usdToBrlRate,
  ).toBe(6);
  await page.getByRole("button", { name: "Tema escuro" }).click();
  await page.screenshot({
    path: "artifacts/pricing-dark-synthetic.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/pricing-mobile-synthetic.png",
    fullPage: true,
  });
  await page
    .getByRole("button", {
      name: "Remover modelo de custom-browser",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Entrada de custom-browser", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Restaurar padrão de gpt-4o", exact: true })
    .click();
  await expect(
    page.getByLabel("Entrada de gpt-4o", { exact: true }),
  ).toHaveValue("2.5");
  await page.getByRole("button", { name: "Salvar preferências" }).click();
  await expect(
    page.getByRole("button", { name: "Preferências salvas" }),
  ).toBeVisible();
  const restored = await (await page.request.get("/api/settings")).json();
  expect(restored.settings.customPricing["custom-browser"]).toBeUndefined();
  expect(restored.settings.customPricing["gpt-4o"]).toBeUndefined();
});

test("cache percentage uses model tariffs even for native zero costs and unknown models stay uncovered", async ({
  page,
}) => {
  const result = await page.request.post("/api/import", {
    headers: { Origin: "http://127.0.0.1:3101" },
    data: [
      {
        provider: "claude",
        id: "native-zero-pricing",
        project: "native-zero-synthetic",
        model: "claude-3-7-sonnet",
        timestamp: new Date().toISOString(),
        costUSD: 0,
        usage: {
          input_tokens: 0,
          cache_read_input_tokens: 1000000,
          output_tokens: 100000,
        },
      },
      {
        provider: "claude",
        id: "unknown-pricing",
        project: "unknown-synthetic",
        model: "unknown-model-synthetic",
        timestamp: new Date().toISOString(),
        usage: { input_tokens: 100, output_tokens: 20 },
      },
    ],
  });
  expect(result.ok()).toBe(true);
  await page.goto("/");
  await page.getByRole("tab", { name: "APIs", exact: true }).click();
  await page
    .getByLabel("Projeto", { exact: true })
    .selectOption("native-zero-synthetic");
  await expect(page.locator('[data-metric="savings"]')).toContainText("60,0%");
  await expect(page.locator('[data-metric="cost"]')).toContainText("0,00");
  await page
    .getByLabel("Projeto", { exact: true })
    .selectOption("unknown-synthetic");
  await expect(page.locator('[data-metric="cost"]')).toContainText(
    "1 de 1 registros sem estimativa",
  );
  await expect(page.locator('[data-metric="savings"]')).toContainText("0,00");
  await page.getByRole("button", { name: "Tema claro" }).click();
  await page.screenshot({
    path: "artifacts/dashboard-light-synthetic.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Tema escuro" }).click();
  await page.screenshot({
    path: "artifacts/dashboard-dark-synthetic.png",
    fullPage: true,
  });
});
