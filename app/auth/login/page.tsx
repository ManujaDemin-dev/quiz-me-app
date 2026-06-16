import { LoginForm } from "@/components/login-form";
import { Suspense, use } from "react";

function LoginFormWrapper({ searchParamsPromise }: { searchParamsPromise: Promise<{ message?: string }> }) {
  const searchParams = use(searchParamsPromise);
  return <LoginForm searchParams={searchParams} />;
}

export default function LoginPage(props: { searchParams: Promise<{ message?: string }> }) {
  return (
    <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center p-6">
      <Suspense fallback={null}>
        <LoginFormWrapper searchParamsPromise={props.searchParams} />
      </Suspense>
    </div>
  );
}