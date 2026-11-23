import ImageColors from "react-native-image-colors";

export type ImageGradient = {
  start: string;
  end: string;
  colors: [string, string];
};

const FALLBACK_GRADIENT: ImageGradient = {
  start: "#1f1f1c",
  end: "#3c3c35",
  colors: ["#1f1f1c", "#3c3c35"],
};

const normalizeHexColor = (value?: string | null): string | null => {
  if (!value) return null;

  const color = value.trim();
  const hex3 = /^#([0-9a-fA-F]{3})$/;
  const hex6 = /^#([0-9a-fA-F]{6})$/;

  if (hex6.test(color)) return color.toLowerCase();

  const match3 = color.match(hex3);
  if (match3?.[1]) {
    const expanded = match3[1]
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
    return `#${expanded.toLowerCase()}`;
  }

  return null;
};

const getColorCandidates = (
  result: Awaited<ReturnType<typeof ImageColors.getColors>>,
) => {
  // if (result.platform === "android") {
  //   return [
  //     result.dominant,
  //     result.vibrant,
  //     result.average,
  //     result.darkVibrant,
  //     result.darkMuted,
  //     result.lightVibrant,
  //     result.lightMuted,
  //     result.muted,
  //   ];
  // }

  if (result.platform === "ios") {
    return [result.background, result.quality];
  }

  return [
    result.darkVibrant,
    result.muted,
    result.dominant,
    result.lightVibrant,
    result.vibrant,
  ];
};

export async function generateGradientFromImageUrl(
  imageUrl: string,
): Promise<ImageGradient> {
  if (!imageUrl?.trim()) {
    return FALLBACK_GRADIENT;
  }

  try {
    const result = await ImageColors.getColors(imageUrl, {
      cache: true,
      key: imageUrl,
      fallback: FALLBACK_GRADIENT.start,
    });

    const uniqueColors = Array.from(
      new Set(
        getColorCandidates(result).map(normalizeHexColor).filter(Boolean),
      ),
    ) as string[];

    if (uniqueColors.length === 0) {
      return FALLBACK_GRADIENT;
    }

    const start = uniqueColors[0] ?? FALLBACK_GRADIENT.start;
    const end = uniqueColors[1] ?? FALLBACK_GRADIENT.end;

    return {
      start,
      end,
      colors: [start, end],
    };
  } catch {
    return FALLBACK_GRADIENT;
  }
}
