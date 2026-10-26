import { writeFileSync } from "node:fs";
import { z } from "zod";
import { OrderSchema } from "./order.schema.ts";

const jsonSchema = z.toJSONSchema(OrderSchema);

writeFileSync("./order.schema.json", JSON.stringify(jsonSchema, null, 2) + "\n");

console.log("Wrote order.schema.json");
