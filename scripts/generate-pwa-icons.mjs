import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const projectRoot = process.cwd();

const publicDirectory =
  path.join(projectRoot, "public");

const sourceIcon =
  path.join(
    publicDirectory,
    "favicon.svg"
  );

const iconBackground = "#2563eb";

const outputs = [
  {
    filename: "pwa-192x192.png",
    size: 192,
    padding: 36
  },
  {
    filename: "pwa-512x512.png",
    size: 512,
    padding: 96
  },
  {
    filename: "pwa-maskable-512x512.png",
    size: 512,
    padding: 128
  },
  {
    filename: "apple-touch-icon.png",
    size: 180,
    padding: 30
  },
  {
    filename: "favicon-32x32.png",
    size: 32,
    padding: 5
  },
  {
    filename: "favicon-16x16.png",
    size: 16,
    padding: 2
  }
];

async function ensureSourceIconExists() {
  try {
    await fs.access(sourceIcon);
  } catch {
    throw new Error(
      [
        "Source icon was not found.",
        `Expected file: ${sourceIcon}`
      ].join("\n")
    );
  }
}

async function createIcon({
  filename,
  size,
  padding
}) {
  const innerSize =
    size - padding * 2;

  if (innerSize <= 0) {
    throw new Error(
      `Invalid padding for ${filename}`
    );
  }

  const logoBuffer =
    await sharp(sourceIcon)
      .resize(
        innerSize,
        innerSize,
        {
          fit: "contain"
        }
      )
      .png()
      .toBuffer();

  const outputPath =
    path.join(
      publicDirectory,
      filename
    );

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: iconBackground
    }
  })
    .composite([
      {
        input: logoBuffer,
        gravity: "center"
      }
    ])
    .png()
    .toFile(outputPath);

  console.log(
    `Created: public/${filename}`
  );
}

async function createMaskedSvg() {
  const svg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 512 512"
>
  <rect
    width="512"
    height="512"
    rx="96"
    fill="${iconBackground}"
  />

  <image
    href="/favicon.svg"
    x="112"
    y="112"
    width="288"
    height="288"
    preserveAspectRatio="xMidYMid meet"
  />
</svg>
`.trim();

  await fs.writeFile(
    path.join(
      publicDirectory,
      "masked-icon.svg"
    ),
    svg,
    "utf8"
  );

  console.log(
    "Created: public/masked-icon.svg"
  );
}

async function main() {
  await ensureSourceIconExists();

  await Promise.all(
    outputs.map(createIcon)
  );

  await createMaskedSvg();

  console.log(
    "\nPWA icon generation completed."
  );
}

main().catch((error) => {
  console.error(
    "\nPWA icon generation failed:"
  );

  console.error(error);

  process.exitCode = 1;
});