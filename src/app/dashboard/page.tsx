import { auth } from "@/auth";
import { SignOut } from "@/components/logout";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await auth();
  // @ts-expect-error Error expected since its user
  if (session === null || session.user.email.split("@")[1] != "irpo.net") {
    return redirect("/");
  }
  return (
    <>
      <SignOut />
    </>
  );
}
