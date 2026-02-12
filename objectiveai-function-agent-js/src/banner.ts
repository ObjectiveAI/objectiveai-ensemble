const PURPLE = "\x1b[38;2;107;92;255m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

const LOGO = [
  `  ${PURPLE}╭─╮${RESET}              ${PURPLE}╭─╮${RESET}`,
  ` ${PURPLE}╭╯ │${RESET}   __ _  (_)  ${PURPLE}│ ╰╮${RESET}`,
  `${PURPLE}╭╯  │${RESET}  / _\` | |   ${PURPLE}│  ╰╮${RESET}`,
  `${PURPLE}╰╮  │${RESET}  \\__,_| |   ${PURPLE}│  ╭╯${RESET}`,
  ` ${PURPLE}╰╮ │${RESET}       |_|   ${PURPLE}│ ╭╯${RESET}`,
  `  ${PURPLE}╰─╯${RESET}              ${PURPLE}╰─╯${RESET}`,
];

export function printBanner(): void {
  const title = `${BOLD}ObjectiveAI${RESET}`;
  console.log();
  console.log(`      ${title}`);
  console.log();
  for (const line of LOGO) {
    console.log(line);
  }
  console.log();
}
