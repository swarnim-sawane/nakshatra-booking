import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import AdminApp from "./AdminApp";
import { registerAdminServiceWorker } from "./pwa";

function AdminRoot() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const register = () => {
      void registerAdminServiceWorker().then(setRegistration);
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return <AdminApp serviceWorkerRegistration={registration} />;
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Admin root element is missing");
}

createRoot(root).render(
  <StrictMode>
    <AdminRoot />
  </StrictMode>,
);
