import { LoginForm } from "@/components/login-form";

export default async function LoginPage(props: { searchParams: Promise<{ message?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center p-6">
      <LoginForm searchParams={searchParams} />
    </div>
  );
}