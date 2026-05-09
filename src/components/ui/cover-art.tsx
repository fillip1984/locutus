import React, { useState } from "react";
import { Image } from "expo-image";

export default function CoverArt({
  coverArtPath,
}: {
  coverArtPath: string | null;
}) {
  const [imageDimensions, setImageDimensions] = useState({
    width: 240,
    height: 384,
  });

  const handleImageLoad = (event: {
    source: { width: number; height: number };
  }) => {
    const { width, height } = event.source;
    const isSquare = width === height;
    setImageDimensions(
      isSquare ? { width: 380, height: 380 } : { width: 240, height: 384 },
    );
  };

  return (
    <Image
      source={coverArtPath ? { uri: coverArtPath } : undefined}
      onLoad={handleImageLoad}
      style={{
        marginHorizontal: "auto",
        ...imageDimensions,
        borderRadius: 8,
      }}
      contentFit="contain"
      transition={300}
    />
  );
}
