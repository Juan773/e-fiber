import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar />
      <Navbar />
      <main className="ml-[250px] pt-16 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
