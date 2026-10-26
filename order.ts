import { readFileSync } from "node:fs";
import { OrderSchema, type Order } from "./order.schema.ts";

// --- Get the JSON: from a file path (CLI arg) if given, otherwise from stdin ---

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf-8");
}

const filePath = process.argv[2];
const jsonContent = filePath ? readFileSync(filePath, "utf-8") : await readStdin();

// --- Validate it at runtime ---

const parsedJson: unknown = JSON.parse(jsonContent);
const order: Order = OrderSchema.parse(parsedJson);

// --- Print the validated, typed object ---

console.log(order);
