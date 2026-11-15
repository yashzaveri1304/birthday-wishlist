import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { BOW_DATA_URI } from "@/lib/bow-svg";

// The card people see when the link is shared on WhatsApp, iMessage, etc.
export const alt = "A birthday wishlist";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default async function OpengraphImage() {
  const [bodoni, hanken] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/BodoniModa-Italic.ttf")),
    readFile(join(process.cwd(), "assets/fonts/HankenGrotesk-Regular.ttf")),
  ]);

  const owner = process.env.NEXT_PUBLIC_OWNER_NAME || "Aashni Shah";
  const first = owner.trim().split(/\s+/)[0];
  const parts = (process.env.NEXT_PUBLIC_BIRTHDAY || "2009-12-29").split("-").map(Number);
  const [month, day] = parts.length === 3 ? [parts[1], parts[2]] : [parts[0], parts[1]];
  const dateText = month && day ? `${day} ${MONTHS[month - 1]}` : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #fbe4ea 0%, #ffffff 75%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 118,
            height: 22,
            background: "linear-gradient(180deg, #f9d3de 0%, #eda5ba 45%, #e293ab 55%, #f6c3d1 100%)",
          }}
        />
        <img src={BOW_DATA_URI} width={260} height={163} alt="" style={{ position: "absolute", top: 46 }} />
        <div style={{ display: "flex", marginTop: 150, fontFamily: "Bodoni", fontStyle: "italic", fontSize: 132, color: "#3a1e2c", letterSpacing: -2 }}>
          {`${first}’s wishlist`}
        </div>
        {dateText && (
          <div style={{ display: "flex", marginTop: 18, fontFamily: "Hanken", fontSize: 36, color: "#8a6575" }}>
            {`Birthday on ${dateText}`}
          </div>
        )}
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bodoni", data: bodoni, style: "italic", weight: 500 },
        { name: "Hanken", data: hanken, style: "normal", weight: 400 },
      ],
    },
  );
}
