import { cache } from "react";
import { Authentication } from "@/actions/authentication";

export const getSessionData = cache(async () => {
  return await Authentication.verifySession();
});
