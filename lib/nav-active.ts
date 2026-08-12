/**
 * Welk menu-item hoort bij dit pad.
 *
 * De langste match wint, anders licht "Klanten" ook op als je op "Nieuwe klant"
 * staat. Paden in `exactOnly` matchen alleen zichzelf — nodig voor het dashboard
 * op /admin, dat anders het voorvoegsel is van elke andere pagina.
 */
export function activeHref(
  pathname: string,
  hrefs: readonly string[],
  exactOnly: readonly string[] = []
): string | undefined {
  return hrefs
    .filter((href) =>
      exactOnly.includes(href)
        ? pathname === href
        : pathname === href || pathname.startsWith(`${href}/`)
    )
    .sort((a, b) => b.length - a.length)[0];
}
