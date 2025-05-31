import { ReactNode } from "react";
import Navigation from "./Navigation";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen bg-[#F7F8FA]">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="md:pt-0 pt-16"> {/* 移动端顶部导航栏空间 */}
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
