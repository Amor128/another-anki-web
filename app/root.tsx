import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { I18nextProvider } from "react-i18next";
import { createContext, useContext, useState } from "react";
import type { Route } from "./+types/root";
import { Theme, ThemePanel } from "@radix-ui/themes";
import i18n from "./i18n/config";
import { Header } from "./components/Header";
import "./app.css";
import "@radix-ui/themes/styles.css";

interface ThemePanelContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ThemePanelContext = createContext<ThemePanelContextType | undefined>(
  undefined
);

export function useThemePanel() {
  const context = useContext(ThemePanelContext);
  if (!context) {
    throw new Error("useThemePanel must be used within a Layout");
  }
  return context;
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);

  return (
    <ThemePanelContext.Provider
      value={{ isOpen: isThemePanelOpen, setIsOpen: setIsThemePanelOpen }}
    >
      <Header />
      <main>{children}</main>
      <ScrollRestoration />
      {isThemePanelOpen && <ThemePanel />}
      <Scripts />
    </ThemePanelContext.Provider>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <I18nextProvider i18n={i18n}>
          <Theme>
            <LayoutContent>{children}</LayoutContent>
          </Theme>
        </I18nextProvider>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
