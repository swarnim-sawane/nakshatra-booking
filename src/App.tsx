import BaseLayout from "./layouts/BaseLayout";

type AppProps = {
  pathname?: string;
};

type PageMetadata = {
  title: string;
  description: string;
};

const homePage: PageMetadata = {
  title: "Celestial Guidance",
  description: "Private one-to-one astrology consultations with a clear route to booking.",
};

const bookingPage: PageMetadata = {
  title: "Book | Celestial Guidance",
  description: "Choose a time for a private one-to-one astrology consultation.",
};

function currentPathname(pathname?: string) {
  return pathname ?? (typeof window === "undefined" ? "/" : window.location.pathname);
}

export function getPageMetadata(pathname: string): PageMetadata {
  return pathname === "/book/" || pathname === "/book" ? bookingPage : homePage;
}

export default function App({ pathname }: AppProps) {
  const activePathname = currentPathname(pathname);
  const isBookingPage = activePathname === "/book/" || activePathname === "/book";
  const page = getPageMetadata(activePathname);

  return (
    <BaseLayout description={page.description} title={page.title}>
      <div className="container">
        <h1>{isBookingPage ? "Book a consultation" : "Celestial Guidance"}</h1>
      </div>
    </BaseLayout>
  );
}
