/*
    Authentication source file for c3
*/

// Libraries
import { db } from "@/db/db";
import { session, user } from "@/db/schema";
import { redirect } from "next/navigation";
import * as crypto from "crypto";
import { eq } from "drizzle-orm";
import * as jwt from "jose";
import { cookies } from "next/headers";

// Authentication Class for beautiful authentication
export class Authentication {
  // Function to register
  public static async register(formData: FormData) {
    "use server";
    const data = formData;
    // Create the salting variables
    const salt1 = crypto.randomBytes(256).toString("hex");
    const salt2 = crypto.randomBytes(256).toString("hex");
    let password = await crypto
      .createHash("sha3-256")
      .update(data.get("password") + "")
      .digest("hex");
    password = await crypto
      .createHash("sha3-512")
      .update(salt1 + password + salt2)
      .digest("hex");
    if ((await (await db()).select().from(user)).length == 0) {
      await (await db()).insert(user).values({
        // @ts-expect-error I would say expect because overload issues lmao
        name: data.get("name"),
        password: password,
        salt1: salt1,
        salt2: salt2,
        email: data.get("email"),
        role: "user",
      });
    } else if (
      (
        await (
          await db()
        )
          .select()
          .from(user)
          // @ts-expect-error because of there being email, ofc it would raise
          .where(eq(data.get("email"), user.email))
      ).length == 0
    ) {
      await (await db()).insert(user).values({
        // @ts-expect-error I would say expect because overload issues lmao
        name: data.get("name"),
        password: password,
        salt1: salt1,
        salt2: salt2,
        email: data.get("email"),
        role: "owner",
      });
    } else {
      return redirect("/?action=register&message=Email is already used.");
    }
    return redirect("/");
  }

  /*
        Beautiful login function for beautiful people
    */
  public static async login(formData: FormData) {
    "use server";
    // Grab formData
    const data = formData;
    // Self explanatory code that checks the database using our primary key of username and email
    if (
      (
        await (
          await db()
        )
          .select()
          .from(user)
          // @ts-expect-error always causes issues that we can't solve with equals
          .where(eq(user.email, data.get("email")))
      ).length > 0
    ) {
      // User
      const credentials = await (
        await db()
      )
        .select()
        .from(user)
        // @ts-expect-error always causes issues that we can't solve with equals
        .where(eq(user.email, data.get("email")));
      // Password generation
      let password = await crypto
        .createHash("sha3-256")
        .update(data.get("password") + "")
        .digest("hex");
      password = await crypto
        .createHash("sha3-512")
        .update(credentials[0].salt1 + password + credentials[0].salt2)
        .digest("hex");

      // Validation and login
      if (password == credentials[0].password) {
        // Create ID
        const identity = crypto
          .createHash("sha3-512")
          .update(crypto.randomBytes(200).toString("hex"))
          .digest("hex");

        await (await db()).insert(session).values({
          // @ts-expect-error because it is expiration, expect
          expirationTime: new Date(
            new Date().getTime() / 1000 + 60 * 60 * 24,
          ).getTime(),
          userID: credentials[0].id,
          token: crypto.createHash("sha3-512").update(identity).digest("hex"),
          expired: false,
        });
        // TODO: SET ID TO WORK WITH A DATABASE TABLE
        const token = await new jwt.SignJWT({ info: identity })
          .setAudience("hyperion-c3")
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("1d")
          // @ts-expect-error will always raise about JWT
          .sign(crypto.createSecretKey(process.env?.JWT_SECRET, "utf-8"));
        (await cookies()).set("header", token, { sameSite: "strict" });
        // Redirect to dashboard
        return redirect("/dashboard");
      }
      return redirect("/?message=Incorrect email or password.");
    }
    return redirect("/?message=Incorrect email or password.");
  }

  /*
    Static raster authentication verification
  */
  public static async verifySession() {
    // setting cookies
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
        const sessionID = await (
          await db()
        )
          .select()
          .from(session)
          .where(
            eq(
              session.token,
              crypto
                .createHash("sha3-512")
                // @ts-expect-error expected a we have a payload and eq() always causes errors
                .update(jwtVerification.payload?.info)
                .digest("hex"),
            ),
          );
        // Get user account
        const userAccount = await (
          await db()
        )
          .select({
            email: user.email,
            role: user.role,
            name: user.name,
          })
          .from(user)
          // @ts-expect-error since it is a file that needs it because of the eq() operator.
          .where(eq(user.id, sessionID[0].userID));
        if (userAccount.length != 0) {
          return { action: "continue", credentials: userAccount[0] };
        }
      } catch {}
    }
    return { action: "logout" };
  }
}
