// 引入组件
import { ErrorBoundary } from "./error"; // 错误边界
import styles from "./todo-list.module.scss";
import Locale from "../locales"; // 语言包
import { IconButton } from "./button"; // 按钮
import CloseIcon from "../icons/close.svg"; // 关闭图标
import { useNavigate } from "react-router-dom"; // 路由
import { useState, useEffect } from "react";
import { OPENAI_BASE_URL } from "../constant";

// 定义待办事项类型

// todo
// 修改接口定义以匹配后端
interface TodoItem {
  id: string;
  task: string;
  completed: boolean;
  start_time: string;
  end_time: string;
}

// 添加API基础URL和端点
// const BaseUrl = "http://127.0.0.1:8000/api";
const BaseUrl = OPENAI_BASE_URL;

// 添加默认请求数量
const DEFAULT_LIMIT = 10;

const apiUrl = {
  todos: "/v1/todolist",
};

// 添加本地存储键名常量
const COMPLETED_TODOS_KEY = "completed_todos";

export function TodoList() {
  const navigate = useNavigate();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedTodos, setCompletedTodos] = useState<Set<string>>(new Set());

  // 获取待办事项数据
  useEffect(() => {
    const savedCompletedTodos = localStorage.getItem(COMPLETED_TODOS_KEY);
    if (savedCompletedTodos) {
      setCompletedTodos(new Set(JSON.parse(savedCompletedTodos)));
    }
    const fetchTodos = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${BaseUrl}${apiUrl.todos}?n=${DEFAULT_LIMIT}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
            mode: "cors",
            // 移除 credentials: "include"
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setTodos(data);
        } else {
          throw new Error("返回数据格式错误");
        }
      } catch (err: any) {
        console.error("获取待办事项失败:", err);
        setError(err instanceof Error ? err.message : "未知错误");
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, []);
  // toggleTodo 函数
  // const toggleTodo = async (id: string) => {
  //   try {
  //     // 找到当前待办事项
  //     const todoToToggle = todos.find((todo) => todo.id === id);
  //     if (!todoToToggle) return;

  //     // 创建更新后的待办事项对象
  //     const updatedTodo = {
  //       ...todoToToggle,
  //       completed: !todoToToggle.completed,
  //     };

  //     // 发送更新请求
  //     const response = await fetch(`${BaseUrl}${apiUrl.todos}/${id}`, {
  //       method: "PUT",
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem("token")}`,
  //         "Content-Type": "application/json",
  //       },
  //       mode: "cors",
  //       body: JSON.stringify(updatedTodo),
  //     });

  //     if (!response.ok) {
  //       throw new Error("更新待办事项状态失败");
  //     }

  //     // 更新本地状态
  //     setTodos(
  //       todos.map((todo) =>
  //         todo.id === id ? { ...todo, completed: !todo.completed } : todo,
  //       ),
  //     );
  //   } catch (err: any) {
  //     console.error("更新待办事项状态失败:", err);
  //     setError(err instanceof Error ? err.message : "未知错误");
  //   }
  // };
  // toggleTodo 函数
  const toggleTodo = async (id: string) => {
    try {
      const newCompletedTodos = new Set(completedTodos);
      if (completedTodos.has(id)) {
        newCompletedTodos.delete(id);
      } else {
        newCompletedTodos.add(id);
      }

      // 更新本地存储
      localStorage.setItem(
        COMPLETED_TODOS_KEY,
        JSON.stringify([...newCompletedTodos]),
      );
      setCompletedTodos(newCompletedTodos);
    } catch (err: any) {
      console.error("更新待办事项状态失败:", err);
      setError(err instanceof Error ? err.message : "未知错误");
    }
  };

  // 添加新待办事项
  const addTodo = async () => {
    if (newTodo.trim() === "") return;

    try {
      const startTime = new Date();
      let defaultEndTime = new Date(startTime);
      defaultEndTime.setDate(defaultEndTime.getDate() + 1);

      const response = await fetch(`${BaseUrl}${apiUrl.todos}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        mode: "cors",
        body: JSON.stringify({
          id: crypto.randomUUID(), // 添加 id 字段
          task: newTodo,
          completed: false, // 添加 completed 字段
          start_time: new Date().toISOString(),
          end_time: endTime || defaultEndTime.toISOString(), // 确保 end_time 有值
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("服务器响应:", errorData);
        throw new Error(`添加待办事项失败: ${response.status}`);
      }

      const newTodoItem = await response.json();
      setTodos([...todos, newTodoItem]);
      setNewTodo("");
      setEndTime("");
    } catch (err: any) {
      console.error("添加待办事项失败:", err);
      setError(err instanceof Error ? err.message : "未知错误");
    }
  };

  // 删除待办事项
  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`${BaseUrl}${apiUrl.todos}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error("删除待办事项失败");
      }

      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (err: any) {
      console.error("删除待办事项失败:", err);
      setError(err instanceof Error ? err.message : "未知错误");
    }
  };

  // 修改日期格式化函数，添加默认截止时间处理
  const formatDateTime = (
    dateString: string,
    isEndTime = false,
    startTime?: string,
  ) => {
    try {
      let date = new Date(dateString);

      // 如果是截止时间且为空，则使用开始时间加一天
      if (isEndTime && !dateString && startTime) {
        date = new Date(startTime);
        // 使用 setDate 会自动处理月份和年份的进位
        date.setDate(date.getDate() + 1);
      }

      if (isNaN(date.getTime())) return "";

      const dateFormatted = date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const timeFormatted = date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return (
        <>
          <span>{dateFormatted}</span>
          <span>{timeFormatted}</span>
        </>
      );
    } catch (error) {
      return "";
    }
  };

  // 按截止日期对待办事项进行排序
  const sortedTodos = [...todos].sort((a, b) => {
    if (!a.end_time) return 1; // 没有日期的放后面
    if (!b.end_time) return -1;
    return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
  });

  return (
    <ErrorBoundary>
      <div className={styles["mask-page"]}>
        {/* 窗口头部 */}
        <div className="window-header">
          <div className="window-header-title">
            <div className="window-header-main-title">待办</div>
            <div className="window-header-submai-title">
              {Locale.TodoList.Page.SubTitle(sortedTodos.length)}
            </div>
          </div>
          <div className="window-actions">
            <div className="window-action-button">
              <IconButton
                icon={<CloseIcon />}
                bordered
                onClick={() => navigate(-1)}
              />
            </div>
          </div>
        </div>

        {/* 窗口内容 */}
        <div className={styles["mask-page-body"]}>
          <div className={styles["todo-container"]}>
            {/* 待办事项输入区域 */}
            {/* <div className={styles["todo-input-wrapper"]}>
              <div className={styles["todo-input-container"]}>
                <div className={styles["input-row"]}>
                  <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="输入添加新的待办"
                    className={styles["todo-input"]}
                    onKeyDown={(e) =>
                      e.key === "Enter" && newTodo.trim() !== "" && addTodo()
                    }
                  />
                </div>

                <div className={styles["input-row"]}>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={styles["todo-date-input"]}
                  />
                </div>

                <div className={styles["input-row"]}>
                  <button
                    onClick={addTodo}
                    className={`${styles["todo-add-button"]} ${
                      newTodo.trim() === "" ? styles["button-disabled"] : ""
                    }`}
                    disabled={newTodo.trim() === ""}
                  >
                    添加+
                  </button>
                </div>
              </div>
            </div> */}

            {/* 待办事项列表 */}
            <div className={styles["todo-list-section"]}>
              <div className={styles["todo-list-header"]}>
                <div className={styles["task-column"]}>任务</div>
                <div className={styles["time-column"]}>开始时间</div>
                <div className={styles["time-column"]}>截止时间</div>
                {/* <div className={styles["action-column"]}>操作</div> */}
              </div>

              {sortedTodos.length === 0 ? (
                <div className={styles["todo-empty"]}>
                  <div className={styles["todo-empty-icon"]}>
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M19 3H14.82C14.4 1.84 13.3 1 12 1C10.7 1 9.6 1.84 9.18 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM12 3C12.55 3 13 3.45 13 4C13 4.55 12.55 5 12 5C11.45 5 11 4.55 11 4C11 3.45 11.45 3 12 3ZM19 19H5V5H19V19Z"
                        fill="#E8A95B"
                      />
                    </svg>
                  </div>
                  <div className={styles["todo-empty-text"]}>暂无待办事项</div>
                  <div className={styles["todo-empty-hint"]}>
                    添加一些任务开始规划您的一天
                  </div>
                </div>
              ) : (
                <ul className={styles["todo-list"]}>
                  {sortedTodos.map((todo) => (
                    <li key={todo.id} className={styles["todo-item"]}>
                      <div className={styles["todo-item-left"]}>
                        <div className={styles["todo-checkbox-wrapper"]}>
                          <input
                            type="checkbox"
                            id={`todo-${todo.id}`}
                            checked={completedTodos.has(todo.id)}
                            onChange={() => toggleTodo(todo.id)}
                            className={styles["todo-checkbox"]}
                          />
                          <label htmlFor={`todo-${todo.id}`}></label>
                        </div>
                        <span
                          className={`${styles["todo-text"]} ${
                            completedTodos.has(todo.id)
                              ? styles["completed"]
                              : ""
                          }`}
                        >
                          {todo.task}
                        </span>
                      </div>

                      <div className={styles["todo-date"]}>
                        {formatDateTime(todo.start_time, false)}
                      </div>

                      <div
                        className={styles["todo-date"]}
                        style={{
                          color:
                            new Date(
                              todo.end_time ||
                                new Date(todo.start_time).setDate(
                                  new Date(todo.start_time).getDate() + 1,
                                ),
                            ).getTime() -
                              Date.now() <=
                            5 * 60 * 1000
                              ? "red"
                              : "inherit",
                        }}
                      >
                        {formatDateTime(todo.end_time, true, todo.start_time)}
                      </div>

                      {/* <div className={styles["todo-action-wrapper"]}>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className={styles["todo-delete-button"]}
                          aria-label="删除"
                        >
                          ×
                        </button>
                      </div> */}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
