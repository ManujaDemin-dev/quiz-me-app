import { signIn } from "@/app/auth/actions";

export function LoginForm({ searchParams }: { searchParams: { message?: string } }) {
  return (
    <div className="w-full max-w-sm bg-[#141416] border border-white/5 rounded-[20px] p-8 shadow-2xl space-y-6 mx-auto">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold tracking-tight text-white">Welcome Back</h1>
        <p className="text-xs text-[#61616A]">Enter your credentials to access the quiz arena</p>
      </div>

      <form action={signIn} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#61616A]">Email Address</label>
          <input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="bg-[#1A1A1E] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#61616A]">Password</label>
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="bg-[#1A1A1E] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition"
          />
        </div>

        {searchParams?.message && (
          <p className="text-xs font-medium text-amber-400 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-center">
            {searchParams.message}
          </p>
        )}

        <button type="submit" className="w-full bg-white text-[#0B0B0C] font-semibold text-sm py-3 rounded-xl hover:bg-white/90 transition active:scale-[0.99]">
          Sign In
        </button>
      </form>
    </div>
  );
}