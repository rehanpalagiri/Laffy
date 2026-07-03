import { Link, NavLink, Outlet } from "react-router-dom";
import { ReactNode } from "react";
import { CustomCursor } from "@/components/CustomCursor";

export function Layout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <CustomCursor />
      <SiteHeader />
      <main className="flex-1">{children ?? <Outlet />}</main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b border-border/60">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <span aria-hidden className="inline-block h-7 w-7 rounded-full bg-gradient-brand" />
          Laffy
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-muted-foreground">
          <NavLink to="/how-it-works" className={({isActive}) => isActive ? "text-foreground" : "hover:text-foreground"}>How It Works</NavLink>
          <a href="/#reviews" className="hover:text-foreground">Reviews</a>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-muted/40">
      <div className="container-page py-12 grid gap-10 md:grid-cols-4 text-sm">
        <div>
          <div className="font-display text-lg">Laffy</div>
          <p className="mt-3 text-muted-foreground max-w-xs">
            AI skin analysis for personalized skincare guidance. Not medical advice.
          </p>
        </div>
        <FooterCol title="Product" links={[
          ["/", "Home"], ["/how-it-works", "How It Works"], ["/pricing", "Pricing"],
        ]} />
        <FooterCol title="Privacy" links={[
          ["/privacy-center", "Data Controls"],
          ["/legal/privacy-notice", "Privacy Policy"],
          ["/legal/consumer-health", "Consumer Health Data Notice"],
          ["/legal/cookie-notice", "Cookie Notice"],
        ]} />
        <FooterCol title="Legal" links={[
          ["/legal/terms", "Terms of Service"],
          ["/legal/subscription-terms", "Bundle Terms"],
          ["/legal/medical-disclaimer", "Medical Disclaimer"],
          ["/legal/accessibility", "Accessibility"],
        ]} />
      </div>
      <div className="border-t border-border/60">
        <div className="container-page py-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} Laffy. Cosmetic guidance only; not a medical service.</div>
          <div>Face photos are used only with explicit scan consent.</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="text-eyebrow mb-3">{title}</div>
      <ul className="space-y-2">
        {links.map(([to, label]) => (
          <li key={to}><Link to={to} className="text-muted-foreground hover:text-foreground">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
