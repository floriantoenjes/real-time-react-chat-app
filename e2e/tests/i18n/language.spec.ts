import { expect, test } from "../../support/test";
import { Page } from "@playwright/test";
import { LanguageModal } from "../../pages/dashboard.page";

/**
 * Workaround: the user menu stays open after the language modal closes (see
 * validation.md → Bugs Found). Escape is a no-op once that is fixed.
 */
async function closeUserMenu(page: Page) {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toBeHidden();
}

test.describe("Language", () => {
    test("switches the dashboard to German and keeps it after a reload", async ({
        actor,
    }) => {
        const { page } = actor;
        await actor.dashboard.sidebar.openUserMenuItem("Change language");

        // The modal is re-rendered in the new language right away.
        await new LanguageModal(page).choose("Deutsch", "Schließen");
        await closeUserMenu(page);

        const germanSearch = page.getByRole("combobox", {
            name: "Kontakte filtern oder hinzufügen",
        });
        await expect(germanSearch).toBeVisible();
        await expect(
            page.getByRole("button", { name: "Benutzermenü" }),
        ).toBeVisible();

        await page.reload();
        await expect(germanSearch).toBeVisible();

        await page.getByRole("button", { name: "Benutzermenü" }).click();
        await page.getByRole("menuitem", { name: "Sprache wechseln" }).click();
        await new LanguageModal(page).choose("English", "Close");
        await closeUserMenu(page);
        await expect(actor.dashboard.sidebar.contactSearch).toBeVisible();
    });

    test("switches the login page to German", async ({ page }) => {
        await page.goto("");

        await page.getByRole("button", { name: "Change language" }).click();
        await new LanguageModal(page).choose("Deutsch", "Schließen");

        await expect(
            page.getByRole("button", { name: "Einloggen" }),
        ).toBeVisible();
        await expect(page.getByLabel(/^Passwort/)).toBeVisible();
    });

    test.fixme(
        "closes the user menu when the language modal is opened",
        // Bug: useSidebarTopSectionUI.showLanguageModal() doesn't call handleClose(),
        // unlike the drawer items, so the menu stays open behind the modal.
        async ({ actor }) => {
            await actor.dashboard.sidebar.openUserMenuItem("Change language");
            await new LanguageModal(actor.page).choose("English", "Close");

            await expect(actor.page.getByRole("menu")).toBeHidden();
        },
    );
});
