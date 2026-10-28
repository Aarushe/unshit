import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// The share card, drawn like the page: hairline rails, the eyebrow, the serif
// headline and the mark.
export const alt = "New Internet Society: never navigate a shitty website in your life ever again";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (file: string) => readFile(join(process.cwd(), "app/fonts", file));
const [serif, sans, sansMedium, icon] = await Promise.all([
  font("LTSuperiorSerif-Regular.otf"),
  font("InterDisplay-Regular.otf"),
  font("InterDisplay-Medium.otf"),
  readFile(join(process.cwd(), "app/icon.png")),
]);
const mark = `data:image/png;base64,${icon.toString("base64")}`;

const line = "rgba(3, 7, 18, 0.07)";
const hatch = `repeating-linear-gradient(315deg, rgba(3, 7, 18, 0.06) 0, rgba(3, 7, 18, 0.06) 1px, transparent 1px, transparent 10px)`;

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "white", color: "#030712", fontFamily: "Inter Display" }}>
        {/* The column with its side rails, and rules across the full width. */}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 80, width: 1, background: line }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, right: 80, width: 1, background: line }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 96, height: 1, background: line }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 158, height: 1, background: line }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 470, height: 1, background: line }} />
        <div style={{ position: "absolute", left: 81, right: 81, top: 471, bottom: 0, backgroundImage: hatch }} />

        <div style={{ position: "absolute", left: 120, right: 120, top: 36, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mark} width={36} height={36} style={{ borderRadius: 8 }} alt="" />
            <span style={{ letterSpacing: -0.4 }}>New Internet Society</span>
          </div>
          <span style={{ color: "rgba(3, 7, 18, 0.55)" }}>
            Made by <span style={{ color: "#030712", marginLeft: 6 }}>@aarushe_reddy</span>
          </span>
        </div>

        <div style={{ position: "absolute", left: 120, top: 116, fontSize: 22, color: "rgba(3, 7, 18, 0.4)", letterSpacing: 0.5 }}>
          Browser extension · One click · Any site
        </div>

        <div
          style={{
            position: "absolute",
            left: 120,
            right: 120,
            top: 186,
            fontFamily: "LT Superior Serif",
            fontSize: 92,
            lineHeight: 1.08,
            letterSpacing: -4,
          }}
        >
          Never navigate a shitty website in your life ever again
        </div>

        <div
          style={{
            position: "absolute",
            left: 120,
            top: 506,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 26px",
            borderRadius: 999,
            background: "#030712",
            color: "white",
            fontFamily: "Inter Display Medium",
            fontSize: 24,
          }}
        >
          Install the extension →
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "LT Superior Serif", data: serif, style: "normal", weight: 400 },
        { name: "Inter Display", data: sans, style: "normal", weight: 400 },
        { name: "Inter Display Medium", data: sansMedium, style: "normal", weight: 500 },
      ],
    },
  );
}
