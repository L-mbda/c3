import { getSessionData } from "@/lib/session";
export default async function Dashboard() {
  const session = (await getSessionData()).credentials;
  return (
    <div className="bg-black h-full w-full absolute">
      <h1>Welcome back, {session?.name}!</h1>
    </div>
  );
}
