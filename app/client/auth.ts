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
