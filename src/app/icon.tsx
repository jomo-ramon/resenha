import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #18181b 0%, #3f3f46 100%)",
        color: "#fafafa",
        fontSize: 110,
        fontWeight: 900,
        letterSpacing: -6,
        borderRadius: 36,
      }}
    >
      R
    </div>,
    { ...size },
  );
}
