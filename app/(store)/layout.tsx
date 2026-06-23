import PageLoader from "@/components/shared/PageLoader";
import CustomCursor from "@/components/shared/CustomCursor";
import Header from "@/components/shared/Header";
import CartDrawer from "@/components/shared/CartDrawer";
import AIChat from "@/components/shared/AIChat";
import Footer from "@/components/shared/Footer";
import PageTransition from "@/components/shared/PageTransition";
import GlobalNavigationLoader from "@/components/shared/GlobalNavigationLoader";
import CartSync from "@/components/shared/CartSync";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--obsidian)] text-[var(--white)] selection:bg-[var(--agni)] selection:text-neutral-50">
      <CartSync />
      <PageLoader />
      <CustomCursor />
      <GlobalNavigationLoader />
      <Header />
      <main className="flex-grow flex flex-col pb-16 md:pb-0">
        <PageTransition>{children}</PageTransition>
      </main>
      <CartDrawer />
      <AIChat />
      <Footer />
    </div>
  );
}
