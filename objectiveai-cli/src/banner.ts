const PURPLE = "\x1b[38;2;107;92;255m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

export const BANNER_LINE = `${PURPLE}${BOLD}{ai} | ObjectiveAI${RESET}`;

export function bannerLines(): string[] {
  return [
    "",
    BANNER_LINE,
    "",
  ];
}

export function printBanner(): void {
  for (const line of bannerLines()) {
    console.log(line);
  }
}
