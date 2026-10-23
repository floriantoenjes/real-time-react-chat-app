import { expect, Locator, Page } from "@playwright/test";

/**
 * The app-wide MUI snackbar renders its message inside an `Alert` (role="alert").
 * `includeHidden`: while a drawer or menu is open, MUI marks the rest of the page
 * (including the snackbar) aria-hidden. `toBeVisible()` still checks it's on screen.
 */
export function snackbar(page: Page, text: string | RegExp): Locator {
    return page
        .getByRole("alert", { includeHidden: true })
        .filter({ hasText: text });
}

export async function expectSnackbar(page: Page, text: string | RegExp) {
    await expect(snackbar(page, text)).toBeVisible();
}
