import { SignUpForm } from "@/components/sign-up-form";
import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-4">
            Quiz Me
          </Link>
        </div>

        {/* Form */}
        <SignUpForm />
      </div>
    </div>
  );
}
