// Picks dark or light text for a coloured background, using WCAG relative luminance.

function luminance(hex: string): number {
  const value = parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

const DARK = "#0b0d12";

export function textOn(background: string): string {
  const bg = luminance(background);
  const onDark = (bg + 0.05) / (luminance(DARK) + 0.05);
  return onDark >= 4.5 ? DARK : "#ffffff";
}
