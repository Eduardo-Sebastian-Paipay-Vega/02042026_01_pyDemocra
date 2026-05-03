import type {
  IdCardRenderSubject,
  IdCardTemplateFieldRow,
} from "./types";

type QrVersionConfig = {
  version: 1 | 2 | 3 | 4;
  dataCodewords: number;
  ecCodewords: number;
  alignment: number[];
};

export interface IdCardCanvasInput {
  baseImageUrl: string | null;
  templateWidth: number;
  templateHeight: number;
  fields: IdCardTemplateFieldRow[];
  subject: IdCardRenderSubject;
}

const QR_CONFIGS: QrVersionConfig[] = [
  { version: 1, dataCodewords: 19, ecCodewords: 7, alignment: [] },
  { version: 2, dataCodewords: 34, ecCodewords: 10, alignment: [18] },
  { version: 3, dataCodewords: 55, ecCodewords: 15, alignment: [22] },
  { version: 4, dataCodewords: 80, ecCodewords: 20, alignment: [26] },
];

const QR_FORMAT_INFO_L = [
  0b111011111000100,
  0b111001011110011,
  0b111110110101010,
  0b111100010011101,
  0b110011000101111,
  0b110001100011000,
  0b110110001000001,
  0b110100101110110,
];

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

{
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i += 1) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
}

function gfMultiply(a: number, b: number): number {
  if (a === 0 || b === 0) {
    return 0;
  }

  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function polyMultiply(a: number[], b: number[]): number[] {
  const result = Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) {
      result[i + j] ^= gfMultiply(a[i], b[j]);
    }
  }
  return result;
}

function buildGeneratorPolynomial(degree: number): number[] {
  let generator = [1];
  for (let i = 0; i < degree; i += 1) {
    generator = polyMultiply(generator, [1, GF_EXP[i]]);
  }
  return generator;
}

function computeRemainder(data: number[], ecCodewords: number): number[] {
  const generator = buildGeneratorPolynomial(ecCodewords);
  const result = data.concat(Array(ecCodewords).fill(0));

  for (let i = 0; i < data.length; i += 1) {
    const factor = result[i];
    if (factor === 0) {
      continue;
    }

    for (let j = 1; j < generator.length; j += 1) {
      result[i + j] ^= gfMultiply(generator[j], factor);
    }
  }

  return result.slice(-ecCodewords);
}

function chooseQrConfig(byteLength: number): QrVersionConfig {
  const config = QR_CONFIGS.find((item) => byteLength <= item.dataCodewords - 2);
  if (!config) {
    throw new Error("El QR excede la capacidad soportada por el render actual.");
  }

  return config;
}

function appendBits(target: number[], value: number, bitCount: number) {
  for (let i = bitCount - 1; i >= 0; i -= 1) {
    target.push((value >>> i) & 1);
  }
}

function encodeQrPayload(payload: string): { config: QrVersionConfig; codewords: number[] } {
  const bytes = Array.from(new TextEncoder().encode(payload));
  const config = chooseQrConfig(bytes.length);
  const bits: number[] = [];

  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  for (const byte of bytes) {
    appendBits(bits, byte, 8);
  }

  const maxBits = config.dataCodewords * 8;
  appendBits(bits, 0, Math.min(4, maxBits - bits.length));
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const dataCodewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let value = 0;
    for (let j = 0; j < 8; j += 1) {
      value = (value << 1) | (bits[i + j] ?? 0);
    }
    dataCodewords.push(value);
  }

  const padBytes = [0xec, 0x11];
  let padIndex = 0;
  while (dataCodewords.length < config.dataCodewords) {
    dataCodewords.push(padBytes[padIndex % 2]);
    padIndex += 1;
  }

  return {
    config,
    codewords: dataCodewords.concat(computeRemainder(dataCodewords, config.ecCodewords)),
  };
}

function createMatrix(size: number): (boolean | null)[][] {
  return Array.from({ length: size }, () => Array<boolean | null>(size).fill(null));
}

function createFunctionMap(size: number): boolean[][] {
  return Array.from({ length: size }, () => Array<boolean>(size).fill(false));
}

function setModule(
  matrix: (boolean | null)[][],
  functionMap: boolean[][],
  row: number,
  col: number,
  dark: boolean
) {
  matrix[row][col] = dark;
  functionMap[row][col] = true;
}

function drawFinder(
  matrix: (boolean | null)[][],
  functionMap: boolean[][],
  row: number,
  col: number
) {
  for (let dy = -1; dy <= 7; dy += 1) {
    for (let dx = -1; dx <= 7; dx += 1) {
      const currentRow = row + dy;
      const currentCol = col + dx;
      if (
        currentRow < 0 ||
        currentRow >= matrix.length ||
        currentCol < 0 ||
        currentCol >= matrix.length
      ) {
        continue;
      }

      const isBorder = dy >= 0 && dy <= 6 && (dx === 0 || dx === 6);
      const isHorizontal = dx >= 0 && dx <= 6 && (dy === 0 || dy === 6);
      const isCore = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;
      const dark = isBorder || isHorizontal || isCore;
      setModule(matrix, functionMap, currentRow, currentCol, dark);
    }
  }
}

function drawAlignment(
  matrix: (boolean | null)[][],
  functionMap: boolean[][],
  centerRow: number,
  centerCol: number
) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      setModule(
        matrix,
        functionMap,
        centerRow + dy,
        centerCol + dx,
        distance !== 1
      );
    }
  }
}

function maskBit(mask: number, row: number, col: number): boolean {
  switch (mask) {
    case 0:
      return (row + col) % 2 === 0;
    case 1:
      return row % 2 === 0;
    case 2:
      return col % 3 === 0;
    case 3:
      return (row + col) % 3 === 0;
    case 4:
      return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5:
      return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6:
      return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
    case 7:
      return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
    default:
      return false;
  }
}

function addFunctionPatterns(
  matrix: (boolean | null)[][],
  functionMap: boolean[][],
  config: QrVersionConfig
) {
  const size = matrix.length;
  drawFinder(matrix, functionMap, 0, 0);
  drawFinder(matrix, functionMap, 0, size - 7);
  drawFinder(matrix, functionMap, size - 7, 0);

  for (let i = 8; i < size - 8; i += 1) {
    setModule(matrix, functionMap, 6, i, i % 2 === 0);
    setModule(matrix, functionMap, i, 6, i % 2 === 0);
  }

  for (const center of config.alignment) {
    const candidates = [
      [center, center],
      [center, size - 7 - 1],
      [size - 7 - 1, center],
    ];
    for (const [row, col] of candidates) {
      if (functionMap[row][col]) {
        continue;
      }
      drawAlignment(matrix, functionMap, row, col);
    }
  }

  setModule(matrix, functionMap, size - 8, 8, true);

  for (let i = 0; i < 8; i += 1) {
    functionMap[8][i] = true;
    functionMap[i][8] = true;
    functionMap[size - 1 - i][8] = true;
    functionMap[8][size - 1 - i] = true;
  }
  functionMap[8][8] = true;
  functionMap[7][8] = true;
  functionMap[8][7] = true;
}

function placeCodewords(
  matrix: (boolean | null)[][],
  functionMap: boolean[][],
  codewords: number[],
  mask: number
) {
  const size = matrix.length;
  const bits = codewords.flatMap((codeword) =>
    Array.from({ length: 8 }, (_, index) => (codeword >>> (7 - index)) & 1)
  );
  let bitIndex = 0;
  let upward = true;

  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) {
      col -= 1;
    }

    for (let offset = 0; offset < size; offset += 1) {
      const row = upward ? size - 1 - offset : offset;
      for (let c = col; c >= col - 1; c -= 1) {
        if (functionMap[row][c]) {
          continue;
        }

        const bit = bits[bitIndex] === 1;
        bitIndex += 1;
        matrix[row][c] = maskBit(mask, row, c) ? !bit : bit;
      }
    }

    upward = !upward;
  }
}

function addFormatInfo(
  matrix: (boolean | null)[][],
  functionMap: boolean[][],
  mask: number
) {
  const size = matrix.length;
  const formatInfo = QR_FORMAT_INFO_L[mask];

  for (let i = 0; i <= 5; i += 1) {
    matrix[8][i] = ((formatInfo >>> i) & 1) === 1;
    matrix[size - 1 - i][8] = ((formatInfo >>> i) & 1) === 1;
  }

  matrix[8][7] = ((formatInfo >>> 6) & 1) === 1;
  matrix[8][8] = ((formatInfo >>> 7) & 1) === 1;
  matrix[7][8] = ((formatInfo >>> 8) & 1) === 1;

  for (let i = 9; i < 15; i += 1) {
    matrix[14 - i][8] = ((formatInfo >>> i) & 1) === 1;
    matrix[8][size - 15 + i] = ((formatInfo >>> i) & 1) === 1;
  }

  for (let i = 0; i < size; i += 1) {
    functionMap[8][i] = true;
    functionMap[i][8] = true;
  }
}

function evaluatePenalty(matrix: (boolean | null)[][]): number {
  const size = matrix.length;
  let penalty = 0;
  let darkCount = 0;

  for (let row = 0; row < size; row += 1) {
    let runColor = matrix[row][0];
    let runLength = 1;
    for (let col = 0; col < size; col += 1) {
      if (matrix[row][col]) {
        darkCount += 1;
      }

      if (col === 0) {
        continue;
      }

      if (matrix[row][col] === runColor) {
        runLength += 1;
      } else {
        if (runLength >= 5) {
          penalty += runLength - 2;
        }
        runColor = matrix[row][col];
        runLength = 1;
      }
    }
    if (runLength >= 5) {
      penalty += runLength - 2;
    }
  }

  for (let col = 0; col < size; col += 1) {
    let runColor = matrix[0][col];
    let runLength = 1;
    for (let row = 1; row < size; row += 1) {
      if (matrix[row][col] === runColor) {
        runLength += 1;
      } else {
        if (runLength >= 5) {
          penalty += runLength - 2;
        }
        runColor = matrix[row][col];
        runLength = 1;
      }
    }
    if (runLength >= 5) {
      penalty += runLength - 2;
    }
  }

  for (let row = 0; row < size - 1; row += 1) {
    for (let col = 0; col < size - 1; col += 1) {
      const value = matrix[row][col];
      if (
        value === matrix[row][col + 1] &&
        value === matrix[row + 1][col] &&
        value === matrix[row + 1][col + 1]
      ) {
        penalty += 3;
      }
    }
  }

  const pattern1 = [true, false, true, true, true, false, true, false, false, false, false];
  const pattern2 = [false, false, false, false, true, false, true, true, true, false, true];

  function matchesPattern(values: (boolean | null)[], start: number, pattern: boolean[]) {
    return pattern.every((bit, index) => values[start + index] === bit);
  }

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col <= size - 11; col += 1) {
      const line = matrix[row];
      if (matchesPattern(line, col, pattern1) || matchesPattern(line, col, pattern2)) {
        penalty += 40;
      }
    }
  }

  for (let col = 0; col < size; col += 1) {
    const column = matrix.map((row) => row[col]);
    for (let row = 0; row <= size - 11; row += 1) {
      if (matchesPattern(column, row, pattern1) || matchesPattern(column, row, pattern2)) {
        penalty += 40;
      }
    }
  }

  const total = size * size;
  penalty += Math.floor(Math.abs(darkCount * 20 - total * 10) / total) * 10;

  return penalty;
}

function buildQrMatrix(payload: string): boolean[][] {
  const { config, codewords } = encodeQrPayload(payload);
  const size = 21 + (config.version - 1) * 4;
  let bestMatrix: boolean[][] | null = null;
  let bestPenalty = Number.POSITIVE_INFINITY;

  for (let mask = 0; mask < 8; mask += 1) {
    const matrix = createMatrix(size);
    const functionMap = createFunctionMap(size);
    addFunctionPatterns(matrix, functionMap, config);
    placeCodewords(matrix, functionMap, codewords, mask);
    addFormatInfo(matrix, functionMap, mask);
    const penalty = evaluatePenalty(matrix);

    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMatrix = matrix.map((row) => row.map((cell) => cell === true));
    }
  }

  if (!bestMatrix) {
    throw new Error("No se pudo construir el QR.");
  }

  return bestMatrix;
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

async function loadImageSource(source: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!source?.trim()) {
    return null;
  }

  const input = source.trim();
  let safeUrl = input;
  let objectUrl: string | null = null;

  try {
    if (!input.startsWith("data:") && !input.startsWith("blob:")) {
      const response = await fetch(input);
      if (!response.ok) {
        return null;
      }
      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);
      safeUrl = objectUrl;
    }

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
      img.src = safeUrl;
    });
    return image;
  } catch {
    return null;
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

function drawPlaceholderPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fullName: string
) {
  ctx.save();
  ctx.fillStyle = "#E2E8F0";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#64748B";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "ID";
  const fontSize = Math.max(18, Math.floor(Math.min(width, height) * 0.24));
  ctx.font = `700 ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, x + width / 2, y + height / 2);
  ctx.restore();
}

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  preferredSize: number,
  family: string,
  weight: string
): number {
  let size = Math.max(10, preferredSize);
  while (size > 10) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= width) {
      return size;
    }
    size -= 1;
  }
  return 10;
}

function drawTextField(
  ctx: CanvasRenderingContext2D,
  field: IdCardTemplateFieldRow,
  text: string
) {
  const width = field.width ?? 320;
  const family = field.fontFamily || "sans-serif";
  const weight = field.fontWeight || "600";
  const size = fitFont(ctx, text, width, field.fontSize ?? 18, family, weight);

  ctx.save();
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.fillStyle = field.colorHex || "#0F172A";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(text, field.posX, field.posY, width);
  ctx.restore();
}

function drawQrField(
  ctx: CanvasRenderingContext2D,
  field: IdCardTemplateFieldRow,
  payload: string
) {
  const matrix = buildQrMatrix(payload);
  const quietZone = 4;
  const fullSize = matrix.length + quietZone * 2;
  const targetWidth = field.width ?? 120;
  const targetHeight = field.height ?? targetWidth;
  const moduleSize = Math.max(1, Math.floor(Math.min(targetWidth, targetHeight) / fullSize));
  const drawWidth = moduleSize * fullSize;
  const offsetX = field.posX + Math.floor((targetWidth - drawWidth) / 2);
  const offsetY = field.posY + Math.floor((targetHeight - drawWidth) / 2);

  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(field.posX, field.posY, targetWidth, targetHeight);
  ctx.fillStyle = "#111827";
  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix.length; col += 1) {
      if (!matrix[row][col]) {
        continue;
      }
      ctx.fillRect(
        offsetX + (col + quietZone) * moduleSize,
        offsetY + (row + quietZone) * moduleSize,
        moduleSize,
        moduleSize
      );
    }
  }
  ctx.restore();
}

export async function renderIdCardCanvas(
  canvas: HTMLCanvasElement,
  input: IdCardCanvasInput
): Promise<void> {
  const width = Math.max(1, Math.round(input.templateWidth));
  const height = Math.max(1, Math.round(input.templateHeight));
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo obtener el contexto del canvas.");
  }

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  const [baseImage, photoImage] = await Promise.all([
    loadImageSource(input.baseImageUrl),
    loadImageSource(input.subject.photoUrl),
  ]);

  if (baseImage) {
    ctx.drawImage(baseImage, 0, 0, width, height);
  }

  const fields = [...input.fields].sort((left, right) => left.zIndex - right.zIndex);
  for (const field of fields) {
    switch (field.fieldKey) {
      case "foto": {
        const photoWidth = field.width ?? 120;
        const photoHeight = field.height ?? photoWidth;
        if (photoImage) {
          ctx.drawImage(photoImage, field.posX, field.posY, photoWidth, photoHeight);
        } else {
          drawPlaceholderPhoto(
            ctx,
            field.posX,
            field.posY,
            photoWidth,
            photoHeight,
            input.subject.fullName
          );
        }
        break;
      }
      case "nombre":
        drawTextField(ctx, field, input.subject.fullName);
        break;
      case "dni":
        drawTextField(ctx, field, input.subject.documentLabel);
        break;
      case "codigo":
        drawTextField(ctx, field, input.subject.cardCode);
        break;
      case "qr":
        drawQrField(ctx, field, input.subject.qrPayload);
        break;
      default:
        break;
    }
  }
}

export async function exportIdCardPngDataUrl(
  input: IdCardCanvasInput
): Promise<string> {
  const canvas = createCanvas(input.templateWidth, input.templateHeight);
  await renderIdCardCanvas(canvas, input);
  return canvas.toDataURL("image/png");
}

export async function downloadIdCardPng(
  input: IdCardCanvasInput,
  filename: string
): Promise<void> {
  const dataUrl = await exportIdCardPngDataUrl(input);
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  anchor.click();
}
