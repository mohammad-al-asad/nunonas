export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.28),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_55%,_#111827_100%)] px-4 py-10">
      <div className="absolute left-[-5rem] top-12 h-72 w-72 rounded-full bg-[#1d4ed8]/35 blur-3xl" />
      <div className="absolute bottom-0 right-[-5rem] h-80 w-80 rounded-full bg-[#0ea5e9]/15 blur-3xl" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[560px] items-center justify-center">
        {children}
      </div>
    </div>
  );
}
