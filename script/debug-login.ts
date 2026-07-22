/** Temporary debug script — run once, then delete. */
import bcrypt from "bcryptjs";
import { storage } from "../server/storage";

async function main() {
  const email = "test-live@proxy.test";
  const password = "test1234";

  const customer = await storage.getCustomerByEmail(email);
  console.log("customer found:", !!customer);
  if (!customer) {
    process.exit(0);
  }
  console.log("email in row:", JSON.stringify(customer.email));
  console.log("emailVerified:", customer.emailVerified);
  console.log("passwordHash length:", customer.passwordHash?.length);

  const valid = await bcrypt.compare(password, customer.passwordHash);
  console.log("bcrypt.compare result:", valid);

  process.exit(0);
}

main().catch((err) => {
  console.error("Debug error:", err);
  process.exit(1);
});
