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
  await expect(page.locator(".metric-highlight > strong")).toHaveText(
    "3,6 mil",
  );
  await page.getByLabel("Serviço", { exact: true }).selectOption("codex");
  await expect(page.locator(".metric-highlight > strong")).toHaveText(
    "1,2 mil",
  );
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
  await page.getByRole("button", { name: "APIs", exact: true }).click();
  await expect(page.locator(".metric-highlight > strong")).toHaveText("120");
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
  await page.getByRole("button", { name: "Abrir menu" }).click();
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
  await page.getByRole("button", { name: "Abrir menu" }).click();
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
    page.getByText("ECONOMIA POR CACHE", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("CUSTO ESTIMADO / REAL", { exact: false }),
  ).toBeVisible();

  // Verify pricing configuration in settings
  await page.getByRole("button", { name: "Preferências", exact: true }).click();
  await expect(
    page.getByText("Tabela de Preços por Modelo", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Cotação do Dólar", { exact: false }),
  ).toBeVisible();
});
