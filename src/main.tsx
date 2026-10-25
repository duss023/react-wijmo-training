import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setLicenseKey } from "@mescius/wijmo";
import "@mescius/wijmo.styles/wijmo.css";
import "@mescius/wijmo.cultures/wijmo.culture.zh";
import "./style.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";

const key = import.meta.env.VITE_WIJMO_LICENSE_KEY;
if (key) setLicenseKey(key);

// 入口只负责样式、授权与挂载；画面选择在 App.tsx 中管理。
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
