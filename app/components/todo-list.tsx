// 引入组件
import { ErrorBoundary } from "./error"; // 错误边界
import styles from "./todo-list.module.scss";
// 语言包
import { IconButton } from "./button"; // 按钮
import CloseIcon from "../icons/close.svg"; // 关闭图标
import { useNavigate } from "react-router-dom"; // 路由
import { useState, useEffect } from "react";
// 如果有添加图标
// 如果有删除图标

// 定义待办事项类型
interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  dueDate: string; // 添加截止日期字段
}

// todo
export function TodoList() {
  const navigate = useNavigate(); // 路由：用于返回

  // 添加待办事项状态管理
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [dueDate, setDueDate] = useState("");

  // 1. 首先从localStorage加载数据，只在组件挂载时执行一次
  useEffect(() => {
    const savedTodos = localStorage.getItem("todos");
    if (savedTodos && savedTodos !== "[]") {
      try {
        const parsedTodos = JSON.parse(savedTodos);
        setTodos(parsedTodos);
      } catch (error) {
        console.error("解析待办事项出错:", error);
      }
    }
  }, []); // 空依赖数组确保只执行一次

  // 2. 当todos变化时保存到localStorage
  useEffect(() => {
    // 跳过组件初始挂载时的保存操作
    if (todos.length > 0 || localStorage.getItem("todos") === "[]") {
      // console.log("保存到localStorage:", todos);
      localStorage.setItem("todos", JSON.stringify(todos));
    }
  }, [todos]);

  // 3. 检查过期待办
  useEffect(() => {
    const checkExpiredTodos = () => {
      const currentTime = new Date().getTime();

      setTodos((prevTodos) => {
        // 找出未过期的待办事项
        const validTodos = prevTodos.filter((todo) => {
          if (!todo.dueDate) return true; // 没有设置截止日期的保留
          const dueTime = new Date(todo.dueDate).getTime();
          return dueTime > currentTime; // 只保留未过期的待办
        });

        // 如果有待办事项被过滤掉，则返回新数组
        if (validTodos.length !== prevTodos.length) {
          console.log(
            `已删除 ${prevTodos.length - validTodos.length} 个过期待办事项`,
          );
          return validTodos;
        }

        // 否则保持不变
        return prevTodos;
      });
    };

    // 一旦页面加载就检查一次
    checkExpiredTodos();

    // // 设置分钟检查一次（这里是组件启动后开始计时轮巡）
    // const intervalId = setInterval(checkExpiredTodos, 60 * 1000);

    // // 组件卸载时清除定时器
    // return () => clearInterval(intervalId);
  }, []); // 只在组件挂载时设置一次定时器

  // 添加新待办事项
  const addTodo = () => {
    if (newTodo.trim() === "") return;

    const newTodoItem: TodoItem = {
      id: Date.now(),
      text: newTodo,
      completed: false,
      dueDate: dueDate, // 设置截止日期
    };

    setTodos([...todos, newTodoItem]);
    setNewTodo("");
    setDueDate("");
  };

  // 切换待办事项状态
  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  // 删除待办事项
  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  // 改进日期格式化函数
  const formatDueDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";

      // 日期格式化
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      // 时间格式化
      const hours = date.getHours();
      const minutes = date.getMinutes();

      // 上午/下午显示
      const ampm = hours >= 12 ? "下午" : "上午";
      const displayHours = hours % 12 || 12;

      // 分别返回日期和时间，可以在样式中分行显示
      const dateFormatted = `${year}年${month}月${day}日`;
      const timeFormatted = `${ampm}${displayHours}:${
        minutes < 10 ? "0" + minutes : minutes
      }`;

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
    if (!a.dueDate) return 1; // 没有日期的放后面
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <ErrorBoundary>
      <div className={styles["mask-page"]}>
        {/* 窗口头部 */}
        <div className="window-header">
          <div className="window-header-title">
            <div className="window-header-main-title">待办</div>
            <div className="window-header-sub-title">
              管理您的日常任务和计划
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
            <div className={styles["todo-input-wrapper"]}>
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
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
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
                    添加
                  </button>
                </div>
              </div>
            </div>

            {/* 待办事项列表 */}
            <div className={styles["todo-list-section"]}>
              <div className={styles["todo-list-header"]}>
                <div className={styles["task-column"]}>任务</div>
                <div className={styles["time-column"]}>截止时间</div>
                <div className={styles["action-column"]}>操作</div>
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
                            checked={todo.completed}
                            onChange={() => toggleTodo(todo.id)}
                            className={styles["todo-checkbox"]}
                          />
                          <label htmlFor={`todo-${todo.id}`}></label>
                        </div>
                        <span
                          className={`${styles["todo-text"]} ${
                            todo.completed ? styles["completed"] : ""
                          }`}
                        >
                          {todo.text}
                        </span>
                      </div>

                      <div
                        className={styles["todo-date"]}
                        style={{
                          color:
                            new Date(todo.dueDate).getTime() - Date.now() <=
                            5 * 60 * 1000
                              ? "red"
                              : "inherit",
                        }}
                      >
                        {todo.dueDate ? formatDueDate(todo.dueDate) : ""}
                      </div>

                      <div className={styles["todo-action-wrapper"]}>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className={styles["todo-delete-button"]}
                          aria-label="删除"
                        >
                          ×
                        </button>
                      </div>
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
