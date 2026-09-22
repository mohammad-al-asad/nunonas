import { LoginServer } from "@/components/auth/login/server";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-[960px]">
        <LoginServer />
      </div>
    </div>
  );
}
