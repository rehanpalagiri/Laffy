import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";

export default function NotFound() {
  return (
    <Layout>
      <section className="container-prose py-24 text-center">
        <div className="text-eyebrow">404</div>
        <h1 className="font-display text-4xl mt-2">Page not found</h1>
        <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground">Back home</Link>
      </section>
    </Layout>
  );
}
