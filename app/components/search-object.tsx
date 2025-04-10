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

const BaseUrl = BASE_URL;

const apiUrl = {
  images: "/api/v1/osearch",
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

  const Search = async () => {
    try {
      setLoadingImages(true);
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
          // 确保 URL 处理正确
          url: item.url.startsWith("http") ? item.url : `${BaseUrl}${item.url}`,
          // 确保 create_time 是字符串格式，如果是数字则转换
          create_time:
            typeof item.create_time === "number"
              ? new Date(item.create_time).toISOString()
              : item.create_time,
        }));

        // 数据已经按照相关性排序，我们只需要确保每组内部按时间排序
        setImages(processedData);
      } else {
        throw new Error("返回数据格式错误");
      }
    } catch (err: any) {
      setError("检索失败：" + err.message);
    } finally {
      setLoadingImages(false);
    }
  };

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

            {/* 添加错误信息显示 */}
            {error && (
              <div className={searchStyle["error-message"]}>{error}</div>
            )}

            {/* 添加加载状态或图片列表显示 */}
            {loadingImages ? (
              <div className={searchStyle["loading-container"]}>
                <LoadingOutlined />
                <span>正在检索...</span>
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
