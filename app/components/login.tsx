"use client";

import React, { useState } from "react";
import style from "./login.module.scss";
// 导入图标
import { FaUser, FaLock } from "react-icons/fa";
import Logo from "../icons/ALogo.svg";
import LoadingIcon from "../icons/three-dots.svg";
import clsx from "clsx";
import BotIcon from "../icons/ALogo.svg";
import styles from "./home.module.scss";
// 导入useAuth
import { useAuth } from "../context/auth-context";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={clsx("no-dark", styles["loading-content"])}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

export function Login() {
  // 移除 onLoginSuccess 属性
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth(); // 使用 auth context

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (usernameError) setUsernameError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError("");
  };

  const handleLogin = () => {
    let isValid = true;

    if (!username.trim()) {
      setUsernameError("请输入用户名!");
      isValid = false;
    } else {
      setUsernameError("");
    }

    if (!password.trim()) {
      setPasswordError("请输入密码!");
      isValid = false;
    } else {
      setPasswordError("");
    }

    if (isValid) {
      if (username === "admin" && password === "123456") {
        setIsLoading(true);

        // 使用 auth context 的 login 方法
        setTimeout(() => {
          login(username); // 这会自动更新登录状态
          console.log("登录成功");
        }, 200);
      } else {
        setPasswordError("用户名或密码错误!");
        console.log("登录失败，用户名或密码错误");
      }
    }
  };

  // 如果正在加载，显示加载组件
  if (isLoading) {
    console.log("显示加载组件");
    return <Loading />;
  }

  // 添加回车键处理函数
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "username" | "password",
  ) => {
    if (e.key === "Enter") {
      if (field === "username") {
        if (!username.trim()) {
          setUsernameError("请输入用户名!");
        } else if (!password.trim()) {
          // 聚焦密码输入框
          const passwordInput = document.querySelector(
            'input[type="password"]',
          ) as HTMLInputElement;
          passwordInput?.focus();
        } else {
          // 触发登录
          handleLogin();
        }
      } else if (field === "password") {
        if (!password.trim()) {
          setPasswordError("请输入密码!");
        } else if (!username.trim()) {
          setUsernameError("请输入用户名!");
          // 聚焦用户名输入框
          const usernameInput = document.querySelector(
            'input[type="text"]',
          ) as HTMLInputElement;
          usernameInput?.focus();
        } else {
          // 触发登录
          handleLogin();
        }
      }
    }
  };

  return (
    <div className={style["login-wrapper"]}>
      <div className={style["login-container"]}>
        <div className={style["login-header"]}>
          <div className={style["logo-title"]}>
            <Logo className={style["logo"]} />
            <h1>云海马体</h1>
          </div>
          <span>您的记忆增强助理</span>
        </div>
        <div className={style["login-box"]}>
          <div className={style["input-group"]}>
            <div className={style["input-field"]}>
              <FaUser className={style["input-icon"]} />
              <input
                type="text"
                placeholder="用户名"
                value={username}
                onChange={handleUsernameChange}
                onKeyDown={(e) => handleKeyDown(e, "username")}
              />
              {usernameError && (
                <div className={style["error-message"]}>{usernameError}</div>
              )}
            </div>
            <div className={style["input-field"]}>
              <FaLock className={style["input-icon"]} />
              <input
                type="password"
                placeholder="密码"
                value={password}
                onChange={handlePasswordChange}
                onKeyDown={(e) => handleKeyDown(e, "password")}
              />
              {passwordError && (
                <div className={style["error-message"]}>{passwordError}</div>
              )}
            </div>
            <button className={style["login-button"]} onClick={handleLogin}>
              <span>登录</span>
            </button>
          </div>
          <div className={style["login-footer"]}>
            <a href="#">忘记密码？</a>
            <a href="#">注册账号</a>
          </div>
        </div>
      </div>
    </div>
  );
}
