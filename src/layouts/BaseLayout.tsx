import { useEffect, type ReactNode } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import "../styles/global.css";

type BaseLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

function PageMetadata({ title, description }: Pick<BaseLayoutProps, "title" | "description">) {
  useEffect(() => {
    document.title = title;
    const existing = document.querySelector('meta[name="description"]');
    const descriptionMeta = existing ?? document.head.appendChild(document.createElement("meta"));
    descriptionMeta.setAttribute("name", "description");
    descriptionMeta.setAttribute("content", description);
  }, [description, title]);

  return null;
}

export default function BaseLayout({ title, description, children }: BaseLayoutProps) {
  return (
    <>
      <PageMetadata description={description} title={title} />
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Header />
      <main className="site-main" id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}
