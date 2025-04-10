import { ErrorBoundary } from "./error"; // 错误边界
// import styles from "./search-object.module.scss";
import Locale from "../locales"; // 语言包
import { IconButton } from "./button"; // 按钮
import { useState } from "react";
import { useNavigate } from "react-router-dom"; // 路由
import CloseIcon from "../icons/close.svg"; // 关闭图标
import { Image, Result } from "antd"; // 图片卡片组件,卡片:布局组件,空状态
import { LoadingOutlined } from "@ant-design/icons"; // 加载图标
import { BASE_URL } from "../constant";
import searchStyle from "./search-object.module.scss";
import { useEffect } from "react";

// 修改 BaseUrl 的值
const BaseUrl = BASE_URL;

const apiUrl = {
  images: "/v1/osearch",
};

// 定义图片接口
interface ImageItem {
  id: string; // 图片id
  url: string; // 图片路径
  name: string; // 图片名称
  place: string; // 物品地点
  create_time: string | number; // 创建时间
  score?: number; // 相关性得分
}

// 图片展示接口
interface ImageGalleryProps {
  images: ImageItem[];
  loading: boolean;
}

// 在ImageGallery组件中修改行渲染部分
const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  if (images.length) {
    // 将图片按每行3个分组
    const rows = [];
    for (let i = 0; i < images.length; i += 3) {
      rows.push(images.slice(i, i + 3));
    }

    return (
      <div className={searchStyle.ImageGallery}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className={searchStyle.ImageRow}>
            {/* 添加蛇形连接线 */}
            <div className={searchStyle.snakeConnector}>
              {rowIndex < rows.length - 1 && (
                <div
                  className={`${searchStyle.connector} ${
                    rowIndex % 2 === 0
                      ? searchStyle.rightDown
                      : searchStyle.leftDown
                  }`}
                ></div>
              )}
            </div>

            {row.map((image, index) => {
              const date = new Date(image.create_time);
              const formattedDate = `${
                date.getMonth() + 1
              }/${date.getDate()} ${date.getHours()}:${date
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;

              return (
                <div key={index} className={searchStyle.ImageWrapper}>
                  <div className={searchStyle.ImageTime}>{formattedDate}</div>
                  <div className={searchStyle.ImageContent}>
                    <Image
                      src={image.url}
                      alt={`Image ${index}`}
                      className={searchStyle.Image}
                      preview={{
                        src: image.url,
                        scaleStep: 0.3,
                      }}
                      placeholder={
                        <div className={searchStyle.ImagePlaceholder}>
                          <LoadingOutlined />
                        </div>
                      }
                    />
                    <div className={searchStyle.ImageInfo}>
                      <div className={searchStyle.ImagePlace}>
                        位置: {image.place}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  } else {
    return <Result status="404" subTitle="暂无数据" />;
  }
};

export function SearchObject() {
  const navigate = useNavigate(); // 路由：用于返回
  const [Object, setObject] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 进度条相关状态
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [shouldCompleteAnimation, setShouldCompleteAnimation] = useState(false);

  const Search = async () => {
    try {
      setLoadingImages(true);
      // 新检索时清空错误信息
      setError(null);
      setCurrentStep(0);
      setProgress(0);
      setShouldCompleteAnimation(false);

      const url = `${BaseUrl}${apiUrl.images}?query=${encodeURIComponent(
        Object,
      )}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error("检索失败");
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        const processedData = data.map((item) => ({
          ...item,
          url: item.url.startsWith("http") ? item.url : `${BaseUrl}${item.url}`,
          create_time:
            typeof item.create_time === "number"
              ? new Date(item.create_time).toISOString()
              : item.create_time,
        }));

        // 数据处理成功，触发动画完成
        setShouldCompleteAnimation(true);

        setTimeout(() => {
          setImages(processedData); // 更新图片数据
          setLoadingImages(false); // 加载状态结束
        }, 1000); // 延迟1秒，让动画完成
      } else {
        throw new Error("返回数据格式错误");
      }
    } catch (err: any) {
      setError("ERROR:" + err.message);
      setLoadingImages(false);
    }
  };

  useEffect(() => {
    if (loadingImages) {
      if (!shouldCompleteAnimation) {
        setProgress(0);
        setCurrentStep(0);
        setShouldCompleteAnimation(false);
      }

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (shouldCompleteAnimation) {
            // true=请求到了
            return Math.min(prev + 2, 100); // 加快完成速度
          }
          if (prev >= 70) {
            // 进度达到100%
            // clearInterval(progressInterval); // 清除定时器
            return 70; // 进度设置为100%
          } // 否则
          return prev + 1; // 进度加1
        });
      }, 50); // 50ms更新一次进度

      // 模拟步骤更新
      let stepTimeouts: NodeJS.Timeout[] = []; // 用于存储每个步骤的定时器

      if (!shouldCompleteAnimation) {
        // 如果没有请求到才执行
        const stepTimes = [1000, 2000, 3000]; // 每个步骤的时间点
        stepTimeouts = stepTimes.map((time, index) => {
          return setTimeout(() => {
            setCurrentStep(index);
          }, time);
        });
      } else {
        // 请求到了，为true, to the last step
        setCurrentStep(3);
        setProgress(100);
      }

      return () => {
        clearInterval(progressInterval); // 清除定时器
        stepTimeouts.forEach((timeout) => clearTimeout(timeout)); // 遍历 stepTimeouts 数组，清除所有步骤定时器，确保定时器不会继续执行
      };
    }
  }, [loadingImages, shouldCompleteAnimation]); // 当 loadingImages 变化时，重新运行 useEffect

  return (
    <ErrorBoundary>
      <div className={searchStyle["mask-page"]}>
        <div className="window-header">
          <div className="window-header-title">
            <div className="window-header-main-title">
              {Locale.SearchObject.Page.Title}
            </div>
            <div className="window-header-submai-title">
              {Locale.SearchObject.Page.SubTitle(images.length)}
            </div>
          </div>
          <div className="window-actions">
            <div className="window-action-button">
              <IconButton
                icon={<CloseIcon />}
                bordered // 边框
                onClick={() => navigate(-1)} // 返回上一页
              />
            </div>
          </div>
        </div>

        {/* 窗口内容 */}
        <div className={searchStyle["mask-page-body"]}>
          <div className={searchStyle["search-container"]}>
            {/* 搜索框包装器 */}
            <div className={searchStyle["search-input-wrapper"]}>
              <div className={searchStyle["search-input-container"]}>
                <div className={searchStyle["input-row"]}>
                  <input
                    type="text"
                    value={Object}
                    onChange={(e) => setObject(e.target.value)}
                    placeholder={Locale.SearchObject.Page.Search}
                    className={searchStyle["search-input"]}
                    onKeyDown={(e) =>
                      e.key === "Enter" && Object.trim() !== "" && Search()
                    }
                  />
                </div>
                <div className={searchStyle["input-row"]}>
                  <button
                    onClick={Search}
                    className={`${searchStyle["search-button"]} ${
                      Object.trim() === "" ? searchStyle["button-disabled"] : ""
                    }`}
                    disabled={Object.trim() === ""}
                  >
                    检索
                  </button>
                </div>
              </div>
            </div>

            {error && <div className={searchStyle.errorMessage}>{error}</div>}

            {loadingImages ? (
              <div className={searchStyle["ai-search-process"]}>
                <div className={searchStyle["search-visual"]}>
                  <div className={searchStyle["brain-container"]}>
                    <div className={searchStyle["brain-pulse"]}></div>
                    <div className={searchStyle["brain-network"]}></div>
                    <div className={searchStyle["data-particles"]}></div>
                  </div>
                  <div className={searchStyle["processing-steps"]}>
                    {[
                      "下发query指令",
                      "分析图像特征",
                      "匹配检索物体",
                      "生成结果",
                    ].map((label, index) => (
                      <div
                        key={index}
                        className={`${searchStyle["step"]} ${
                          index === currentStep
                            ? searchStyle["processing"]
                            : index < currentStep
                            ? searchStyle["completed"]
                            : ""
                        }`}
                      >
                        <div className={searchStyle["step-dot"]}></div>
                        <div className={searchStyle["step-label"]}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={searchStyle["search-status"]}>
                  <div className={searchStyle["status-text"]}>
                    {
                      [
                        "Agent正在下发query指令...",
                        "Agent正在分析图像特征...",
                        "Agent正在匹配检索物体...",
                        "Agent正在生成检索结果...",
                      ][currentStep]
                    }
                  </div>
                  <div className={searchStyle["progress-bar"]}>
                    <div
                      className={searchStyle["progress-fill"]}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={searchStyle["search-result-section"]}>
                <ImageGallery images={images} loading={loadingImages} />
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
