import { ImageResponse } from "next/og";
import { BOW_DATA_URI } from "@/lib/bow-svg";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fdf2f5" }}>
        <img src={BOW_DATA_URI} width={140} height={88} alt="" />
      </div>
    ),
    size,
  );
}
