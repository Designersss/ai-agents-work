export type Rates = Readonly<{ input: number; output: number }>;
const DENOMINATOR = 1_000_000n;

function validInteger(value: number, name: string): bigint {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(name + ' must be a non-negative safe integer');
  return BigInt(value);
}
function asSafeNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('Amount exceeds safe integer');
  return Number(value);
}
export function costKopecks(inputTokens: number, outputTokens: number, rates: Rates): number {
  const input = validInteger(inputTokens, 'inputTokens');
  const output = validInteger(outputTokens, 'outputTokens');
  const inRate = validInteger(rates.input, 'input rate');
  const outRate = validInteger(rates.output, 'output rate');
  const total = input * inRate + output * outRate;
  return asSafeNumber((total + DENOMINATOR - 1n) / DENOMINATOR);
}
export const OUTPUT_LIMIT = 256;
/** Conservative spike-only estimate; not a guaranteed provider billing ceiling. */
export function reserveKopecks(prompt: string, rates: Rates): number {
  const conservativeInputTokens = Buffer.byteLength(prompt, 'utf8') + 2048;
  return Math.max(1, costKopecks(conservativeInputTokens, OUTPUT_LIMIT, rates));
}
export function parseRate(value: string | undefined, label: string): number {
  if (!value || !/^[1-9]\d*$/.test(value)) throw new Error(label + ' must be a positive integer in kopecks per million tokens');
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > 2_147_483_647) throw new Error(label + ' out of range');
  return parsed;
}
