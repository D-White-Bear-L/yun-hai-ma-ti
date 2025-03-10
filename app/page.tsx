"use client";

import { Analytics } from "@vercel/analytics/react";
import { Home } from "./components/home";
import { getServerSideConfig } from "./config/server";
import { Login } from "./components/login";
import { AuthProvider, useAuth } from "./context/auth-context";
import { Suspense } from "react";

import clsx from "clsx";
import BotIcon from "./icons/ALogo.svg";
import styles from "./components/home.module.scss";
import LoadingIcon from "./icons/three-dots.svg";

const serverConfig = getServerSideConfig();

function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={clsx("no-dark", styles["loading-content"])}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

// 创建一个内部组件来使用 useAuth
function AppContent() {
  const { isLoading, isLoggedIn } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      {isLoggedIn ? <Home /> : <Login />}
      {serverConfig?.isVercel && <Analytics />}
    </>
  );
}

// 主组件包装 AuthProvider 和 Suspense
export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Suspense>
  );
}
