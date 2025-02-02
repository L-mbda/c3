"use client";

import { logout } from "@/actions/logout";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Logout() {
  // Use effect as bypass
  useEffect(() => {
    // Logout then redirect
    logout().then(() => {
      return redirect("/");
    });
  });
}
