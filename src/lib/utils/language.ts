function translateLanguage(locale: string, languageCode: string) {
  // Create an Intl.DisplayNames object for language names in English
  const displayNames = new Intl.DisplayNames(locale, { type: "language" });

  // translate the language code to its English name
  return displayNames.of(languageCode) || "";
}
function translateCountry(locale: string, languageCode: string) {
  // Create an Intl.DisplayNames object for language names in English
  const displayNames = new Intl.DisplayNames(locale, { type: "region" });

  // translate the language code to its English name
  return displayNames.of(languageCode) || "";
}

export { translateCountry, translateLanguage };
