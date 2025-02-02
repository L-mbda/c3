/*
    Authentication source file for c3
*/

// Libraries
import { db } from "@/db/db";
import { user } from "@/db/schema";
import { redirect } from "next/navigation";
import * as crypto from 'crypto';
import { eq } from 'drizzle-orm';
import * as jwt from 'jose';
import { cookies } from "next/headers";

// Authentication Class for beautiful authentication
export class Authentication {
    // Function to register
    public static async register(formData: FormData) {
        "use server"
        let data = formData;
        // Create the salting variables
        const salt1 = crypto.randomBytes(256).toString('hex');
        const salt2 = crypto.randomBytes(256).toString('hex');
        let password = (await crypto.createHash("sha3-256").update(data.get('password') + "").digest('hex'))
        password = await crypto.createHash("sha3-512").update(salt1 + password + salt2).digest("hex")
        if ((await (await db()).select().from(user)).length == 0) {
            await (await db()).insert(user).values({
                // @ts-expect-error I would say expect because overload issues lmao
                "name": data.get("name"),
                "password": password,
                "salt1": salt1,
                "salt2": salt2,
                "email": data.get("email"),
                "role": "user"
            })
        // @ts-expect-error because of there being email, ofc it would raise
        } else if ((await (await db()).select().from(user).where(eq(data.get("email"), user.email))).length == 0) {
            await (await db()).insert(user).values({
                // @ts-expect-error I would say expect because overload issues lmao
                "name": data.get("name"),
                "password": password,
                "salt1": salt1,
                "salt2": salt2,
                "email": data.get("email"),
                "role": "owner"
            })
        } else {
            return redirect('/?action=register&message=Email is already used.')
        }
        return redirect('/');
    }

    /*
        Beautiful login function for beautiful people
    */
    public static async login(formData: FormData) {
        "use server"
        // Grab formData
        let data = formData;
        // Self explanatory code that checks the database using our primary key of username and email
        // @ts-expect-error always causes issues that we can't solve with equals
        if ((await (await db()).select().from(user).where(eq(user.email, data.get("email")))).length > 0) {
            // User
            // @ts-expect-error always causes issues that we can't solve with equals
            let credentials = await (await db()).select().from(user).where(eq(user.email, data.get("email")))
            // Password generation
            let password = (await crypto.createHash("sha3-256").update(data.get('password') + "").digest('hex'))
            password = await crypto.createHash("sha3-512").update(credentials[0].salt1 + password + credentials[0].salt2).digest("hex")

            // Validation and login
            if (password == credentials[0].password) {
                // TODO: SET ID TO WORK WITH A DATABASE TABLE
                const token = await new jwt.SignJWT({'id': credentials[0].id}).setAudience('hyperion-c3')
                // @ts-expect-error will always raise about JWT
                .setProtectedHeader({alg: 'HS256'}).setExpirationTime("1d").sign(crypto.createSecretKey(process.env?.JWT_SECRET, "utf-8"));
                await (await cookies()).set("header", token, {'sameSite': 'strict'});
                // Redirect to dashboard
                return redirect('/dashboard')
            }
            return redirect("/?message=Incorrect email or password.")
        }
        return redirect("/?message=Incorrect email or password.")
    }
}