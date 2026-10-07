import { test, expect } from "@playwright/test";

test("language preferences translate the dashboard, survive reloads and fit mobile", async ({
  page,
}) => {
  const original = (await (await page.request.get("/api/settings")).json())
    .settings;
  const locales = [
    {
      code: "en",
      settings: "Preferences",
      heading: "Tracking preferences",
      save: "Save preferences",
      saved: "Preferences saved",
      overview: "Overview",
      activity: "Activity",
      sources: "Data sources",
      sourceHeading: "Your usage sources",
    },
    {
      code: "es",
      settings: "Preferencias",
      heading: "Preferencias de seguimiento",
      save: "Guardar preferencias",
      saved: "Preferencias guardadas",
      overview: "Resumen",
      activity: "Actividad",
      sources: "Fuentes de datos",
      sourceHeading: "Tus fuentes de consumo",
    },
    {
      code: "it",
      settings: "Preferenze",
      heading: "Preferenze di monitoraggio",
      save: "Salva preferenze",
      saved: "Preferenze salvate",
      overview: "Panoramica",
      activity: "Attività",
      sources: "Fonti dei dati",
      sourceHeading: "Le tue fonti di consumo",
    },
    {
      code: "fr",
      settings: "Préférences",
      heading: "Préférences de suivi",
      save: "Enregistrer les préférences",
      saved: "Préférences enregistrées",
      overview: "Vue d’ensemble",
      activity: "Activité",
      sources: "Sources de données",
      sourceHeading: "Vos sources de consommation",
    },
    {
      code: "zh-CN",
      settings: "偏好设置",
      heading: "用量跟踪偏好",
      save: "保存偏好设置",
      saved: "偏好设置已保存",
      overview: "概览",
      activity: "活动",
      sources: "数据来源",
      sourceHeading: "你的用量来源",
    },
    {
      code: "pt-BR",
      settings: "Preferências",
      heading: "Preferências de acompanhamento",
      save: "Salvar preferências",
      saved: "Preferências salvas",
      overview: "Visão geral",
      activity: "Atividade",
      sources: "Fontes de dados",
      sourceHeading: "Suas fontes de consumo",
    },
  ];
  let previous = locales.at(-1)!;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto("/");
    await page
      .getByRole("button", { name: "Preferências", exact: true })
      .click();
    for (const locale of locales) {
      await page.locator(".language-field select").selectOption(locale.code);
      await page
        .getByRole("button", { name: previous.save, exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: locale.saved, exact: true }),
      ).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", locale.code);
      await expect(
        page.getByRole("heading", { name: locale.heading, exact: true }),
      ).toBeVisible();
      await page.reload();
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        locale.overview,
      );
      await page
        .getByRole("button", { name: locale.sources, exact: false })
        .first()
        .click();
      await expect(
        page.getByRole("heading", { name: locale.sourceHeading, exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: locale.activity, exact: true })
        .click();
      await expect(page.getByRole("searchbox")).toBeVisible();
      await page
        .getByRole("button", { name: locale.settings, exact: true })
        .click();
      await expect(page.locator(".language-field select")).toHaveValue(
        locale.code,
      );
      if (locale.code === "fr" || locale.code === "zh-CN") {
        await page.screenshot({
          path: `artifacts/languages-${locale.code}-desktop-synthetic.png`,
          fullPage: true,
        });
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(
          page.locator('[data-slot="sidebar-container"]'),
        ).toHaveCount(0);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          path: `artifacts/languages-${locale.code}-mobile-synthetic.png`,
          fullPage: true,
        });
        await page.setViewportSize({ width: 1280, height: 720 });
      }
      previous = locale;
    }
    expect(errors).toEqual([]);
  } finally {
    await page.request.put("/api/settings", {
      headers: { Origin: "http://127.0.0.1:3101" },
      data: original,
    });
  }
});
