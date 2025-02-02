"use server";

import { db } from "@/db/db";
import { session } from "@/db/schema";
import { cookies } from "next/headers";
import * as jwt from "jose";
import * as crypto from "crypto";
import { eq } from "drizzle-orm";

// Function to logout basically everybody (sorry!)
export async function logout() {
  const token = (await cookies()).get("header");
  if (token !== undefined) {
    try {
      // Superimported from /L-mbda/Theta
      // Verification of the token utilizing the secret key and stuff
      const jwtVerification = await jwt.jwtVerify(
        token.value,
        // @ts-expect-error Error is expected since we have crypto.createSecretKey
        crypto.createSecretKey(process.env?.JWT_SECRET),
      );
      // Session ID
      await (await db()).delete(session).where(
        eq(
          session.token,
          crypto
            .createHash("sha3-512")
            // @ts-expect-error expected a we have a payload
            .update(jwtVerification.payload?.info)
            .digest("hex"),
        ),
      );
    } catch {}
  }
  // Delete the cookie
  (await cookies()).delete("header");
}
