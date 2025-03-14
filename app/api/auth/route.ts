import { NextRequest, NextResponse } from "next/server";

interface User {
  username: string;
  password: string;
}

// 模拟数据库中的用户数据
const users: User[] = [{ username: "admin", password: "123456" }];

export async function POST(req: NextRequest) {
  try {
    const { username, password, type } = await req.json();

    if (type === "login") {
      // 验证用户名和密码
      const user = users.find(
        (u) => u.username === username && u.password === password,
      );

      if (user) {
        return NextResponse.json({
          success: true,
          message: "登录成功",
          data: {
            username: user.username,
          },
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "用户名或密码错误！",
          },
          { status: 401 },
        );
      }
    } else if (type === "register") {
      // 检查用户名是否已存在
      if (users.some((u) => u.username === username)) {
        return NextResponse.json(
          {
            success: false,
            message: "该用户名已存在！",
          },
          { status: 400 },
        );
      }

      // 添加新用户
      users.push({ username, password });

      return NextResponse.json({
        success: true,
        message: "注册成功",
      });
    }
  } catch (error) {
    console.error("[Auth API Error]", error);
    return NextResponse.json(
      {
        success: false,
        message: "请求失败",
      },
      { status: 500 },
    );
  }
}
