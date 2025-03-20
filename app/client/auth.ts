export async function loginApi(username: string, password: string) {
  return fetch("/api/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
      type: "login",
    }),
  }).then((res) => res.json());
}

export async function registerApi(username: string, password: string) {
  return fetch("/api/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
      type: "register",
    }),
  }).then((res) => res.json());
}

// 配合JAVA SpringBoot
// export async function loginApi(username: string, password: string) {
//   return fetch("/api/v1/auth/login", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       username,
//       password,
//     }),
//   }).then((res) => {
//     if (res.ok) {
//       // 处理 JWT token
//       const token = res.headers.get('Authorization');
//       if (token) {
//         localStorage.setItem('token', token);
//       }
//     }
//     return res.json();
//   });
// }

// export async function registerApi(username: string, password: string) {
//   return fetch("/api/v1/auth/register", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       username,
//       password,
//     }),
//   }).then((res) => res.json());
// }

// // 添加请求拦截器，自动附加 token
// export function addAuthHeader(headers: HeadersInit = {}) {
//   const token = localStorage.getItem('token');
//   if (token) {
//     return {
//       ...headers,
//       'Authorization': `Bearer ${token}`,
//     };
//   }
//   return headers;
// }
