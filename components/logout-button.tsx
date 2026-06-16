import { signOut } from "@/app/auth/actions";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="text-xs font-semibold text-[#61616A] hover:text-red-400 transition">
        Disconnect Session &rarr;
      </button>
    </form>
  );
}