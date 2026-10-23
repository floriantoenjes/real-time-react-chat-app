import { expect, Locator, Page } from "@playwright/test";

/** The app-wide MUI snackbar renders its message inside an `Alert` (role="alert"). */
export function snackbar(page: Page, text: string | RegExp): Locator {
    return page.getByRole("alert").filter({ hasText: text });
}

export async function expectSnackbar(page: Page, text: string | RegExp) {
    await expect(snackbar(page, text)).toBeVisible();
}
