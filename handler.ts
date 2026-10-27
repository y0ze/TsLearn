import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { OrderSchema, type Order } from "./order.schema.ts";

// --- Shape of what API Gateway sends a Lambda ---

interface LambdaEvent {
  body: string; // API Gateway sends the JSON body as a raw string
}

interface LambdaResponse {
  statusCode: number;
  body: string;
}

// --- Storage: write locally (Lambda's /tmp, or your own machine) or to S3 ---
// Controlled by env var so the SAME code works locally and on real AWS.
// Read fresh on every call (not cached at import) so the test runner below
// can set it interactively after the module has already loaded.

async function storeOrder(order: Order): Promise<string> {
  const fileName = `order-${Date.now()}.json`;
  const body = JSON.stringify(order, null, 2);
  const S3_BUCKET = process.env.ORDERS_BUCKET;

  if (S3_BUCKET) {
    const s3 = new S3Client({});
    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: fileName,
        Body: body,
        ContentType: "application/json",
      })
    );
    return `s3://${S3_BUCKET}/${fileName}`;
  }

  const localDir = process.env.LAMBDA_TASK_ROOT ? "/tmp" : "./storage";
  mkdirSync(localDir, { recursive: true });
  const fullPath = join(localDir, fileName);
  writeFileSync(fullPath, body);
  return fullPath;
}

// --- The actual Lambda entry point ---

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  try {
    const parsedBody: unknown = JSON.parse(event.body);
    const order = OrderSchema.parse(parsedBody);
    const storedAt = await storeOrder(order);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Order accepted", storedAt, order }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid order", error: String(error) }),
    };
  }
};

// --- Local test runner: simulates AWS invoking this handler ---
// Asks you each time: store the order locally, or in S3?

async function askStorageChoice(): Promise<void> {
  if (process.env.ORDERS_BUCKET) return; // already set outside, skip the prompt

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(
    "Where should this order be stored?\n  1) Local\n  2) Cloud (S3)\nChoose 1 or 2: "
  );

  if (answer.trim() === "2") {
    const bucket = await rl.question("S3 bucket name: ");
    process.env.ORDERS_BUCKET = bucket.trim();
  }

  rl.close();
}

if (process.argv[1]?.endsWith("handler.ts")) {
  await askStorageChoice();

  const sampleEvent: LambdaEvent = {
    body: JSON.stringify({
      name: "Ion Popescu",
      delivery: { street: "Flower St.", number: 12, city: "Cluj-Napoca", postalCode: "400001" },
      products: [{ productId: "P-100", name: "Mechanical keyboard", quantity: 1, unitPrice: 350 }],
    }),
  };

  const result = await handler(sampleEvent);
  console.log(result);
}
