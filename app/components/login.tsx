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
// 导入API函数
import { loginApi, registerApi } from "../client/auth";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={clsx("no-dark", styles["loading-content"])}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

export function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async () => {
    let isValid = true;

    if (!username.trim()) {
      setUsernameError("请输入用户名!");
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError("请输入密码!");
      isValid = false;
    }

    if (isRegister) {
      if (!confirmPassword.trim()) {
        setConfirmPasswordError("请确认密码!");
        isValid = false;
      } else if (password !== confirmPassword) {
        setConfirmPasswordError("两次输入的密码不一致!");
        isValid = false;
      }
    }

    if (isValid) {
      setIsLoading(true);
      try {
        if (isRegister) {
          // 调用注册API
          const result = await registerApi(username, password);
          if (result.success) {
            setRegisterSuccess(true);
            console.log("注册成功");
            setTimeout(() => {
              setIsRegister(false);
              setIsLoading(false);
              setRegisterSuccess(false);
            }, 1500);
          } else {
            setUsernameError(result.message);
            setIsLoading(false);
          }
        } else {
          // 调用登录API
          const result = await loginApi(username, password);
          if (result.success) {
            login(username);
            console.log("登录成功");
          } else {
            setPasswordError(result.message);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("请求失败:", error);
        setPasswordError("网络请求失败，请稍后重试");
        setIsLoading(false);
      }
    }
  };
  // 在 Login 组件中添加回车键处理函数
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "username" | "password" | "confirmPassword",
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
          // 触发提交
          handleSubmit();
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
        } else if (isRegister) {
          // 如果是注册模式，聚焦确认密码输入框
          const confirmPasswordInput = document.querySelectorAll(
            'input[type="password"]',
          )[1] as HTMLInputElement;
          confirmPasswordInput?.focus();
        } else {
          // 触发提交
          handleSubmit();
        }
      } else if (field === "confirmPassword" && isRegister) {
        if (!confirmPassword.trim()) {
          setConfirmPasswordError("请确认密码!");
        } else {
          // 触发提交
          handleSubmit();
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
          <span>
            {isRegister
              ? "创建您的账户 即刻拥有云记忆增强助理"
              : "登录您的账户 即刻拥有云记忆增强助理"}
          </span>
        </div>
        <div className={style["login-box"]}>
          <div className={style["input-group"]}>
            <div className={style["input-field"]}>
              <FaUser className={style["input-icon"]} />
              <input
                type="text"
                placeholder="用户名"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError("");
                }}
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                onKeyDown={(e) => handleKeyDown(e, "password")}
              />
              {passwordError && (
                <div className={style["error-message"]}>{passwordError}</div>
              )}
            </div>
            {isRegister && (
              <div className={style["input-field"]}>
                <FaLock className={style["input-icon"]} />
                <input
                  type="password"
                  placeholder="确认密码"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordError("");
                  }}
                  onKeyDown={(e) => handleKeyDown(e, "confirmPassword")}
                />
                {confirmPasswordError && (
                  <div className={style["error-message"]}>
                    {confirmPasswordError}
                  </div>
                )}
              </div>
            )}
            <button
              className={style["login-button"]}
              onClick={handleSubmit}
              disabled={isLoading}
            >
              <span>
                {isLoading
                  ? registerSuccess
                    ? "注册成功，正在返回登录..."
                    : isRegister
                    ? "注册中..."
                    : "登录中..."
                  : isRegister
                  ? "注册"
                  : "登录"}
              </span>
            </button>
          </div>
          <div className={style["login-footer"]}>
            <a href="#">忘记密码？</a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsRegister(!isRegister);
                setUsername("");
                setPassword("");
                setConfirmPassword("");
                setUsernameError("");
                setPasswordError("");
                setConfirmPasswordError("");
              }}
            >
              {isRegister ? "返回登录" : "注册账号"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
