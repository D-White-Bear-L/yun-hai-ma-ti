// 引入组件
// 1、项目组件
import { ErrorBoundary } from "./error"; // 错误边界
import styles from "./mask.module.scss";
import Locale from "../locales"; // 语言包
import { IconButton } from "./button"; // 按钮
import CloseIcon from "../icons/close.svg"; // 关闭图标
import { useNavigate } from "react-router-dom"; // 路由
// 2、样式组件
import fileStyles from "./file-manage.module.scss"; // 样式
// 3、第三方组件
import { LoadingOutlined } from "@ant-design/icons"; // 加载图标
import { Image, Card, Space, Result, Spin, Typography } from "antd"; // 图片卡片组件,卡片:布局组件,空状态
import { useState, useEffect } from "react"; // React Hooks
// BaseUrl
import { BASE_URL } from "../constant";

// 定义图片和文件的接口
interface ImageItem {
  id: string; // 图片id
  url: string; // 图片地址
  name: string; // 图片名称
  create_time: string; // 创建时间
  score: number; // 得分
}

// 图片展示接口
interface ImageGalleryProps {
  images: ImageItem[];
  loading: boolean;
}

// 修改基础URL
// const BaseUrl = "http://127.0.0.1:8000/api"; //test
const BaseUrl = BASE_URL;

const apiUrl = {
  images: "/v1/snapshot",
};

// 添加默认请求数量
const DEFAULT_LIMIT = 15;

// 引入更多图标和动画组件
import { CameraOutlined, HeartOutlined } from "@ant-design/icons";
import { Badge } from "antd";

// 修改 ImageGallery 组件的加载状态显示
const { Text } = Typography;

// 在 ImageGallery 组件中修改图片展示部分
const ImageGallery: React.FC<ImageGalleryProps> = ({ images, loading }) => {
  if (loading) {
    return (
      <div className={fileStyles.loadingContainer}>
        <Spin
          size="large"
          tip="正在唤醒记忆中..."
          style={{
            margin: "40px auto",
            width: "100%",
            textAlign: "center",
          }}
        />
      </div>
    );
  }

  if (images.length) {
    return (
      <div className={fileStyles.ImageGallery}>
        {images.map((image) => (
          <div key={image.id} className={fileStyles.ImageWrapper}>
            <Badge.Ribbon
              text={`${image.score.toFixed(1)}分`}
              color={image.score > 5 ? "#f50" : "#108ee9"}
              className={fileStyles.ScoreBadge}
            >
              <div className={fileStyles.MemoryCard}>
                <Image
                  src={image.url}
                  alt={image.name}
                  className={fileStyles.Image}
                  preview={{
                    mask: (
                      <div className={fileStyles.PreviewMask}>
                        <CameraOutlined /> 查看记忆
                      </div>
                    ),
                    maskClassName: fileStyles.customPreviewMask,
                    rootClassName: fileStyles.previewRoot,
                  }}
                  placeholder={
                    <div className={fileStyles.ImagePlaceholder}>
                      <LoadingOutlined />
                    </div>
                  }
                />
                <div className={fileStyles.MemoryInfo}>
                  <Text className={fileStyles.MemoryDate}>
                    <span className={fileStyles.MemoryIcon}>📅</span> 记忆于:{" "}
                    {formatCreateTime(image.create_time)}
                  </Text>
                  <Text className={fileStyles.MemoryScore}>
                    <HeartOutlined className={fileStyles.HeartIcon} /> 美观程度:{" "}
                    {image.score.toFixed(1)}
                  </Text>
                </div>
              </div>
            </Badge.Ribbon>
          </div>
        ))}
      </div>
    );
  } else {
    return <Result status="404" subTitle="暂无精彩图像记忆，去记录一些吧！" />;
  }
};

// 添加时间格式化函数
const formatCreateTime = (timeString: string) => {
  try {
    const date = new Date(timeString);
    // 检查是否是有效日期
    if (isNaN(date.getTime())) {
      return "时间未知";
    }
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("时间格式化错误:", error);
    return "时间未知";
  }
};

// 文件管理
export function FileManage() {
  const navigate = useNavigate();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取图片数据
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoadingImages(true);
        const url = `${BaseUrl}${apiUrl.images}?n=${DEFAULT_LIMIT}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          mode: "cors",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          // 检查并处理图片URL
          const processedData = data.map((item) => ({
            ...item,
            url: item.url.startsWith("http")
              ? item.url
              : `${BaseUrl}${item.url}`,
          }));
          setImages(processedData);
          console.log("获取数据成功", processedData);
        } else {
          throw new Error("返回数据格式错误");
        }
      } catch (err: any) {
        console.error("获取图片数据出错:", err);
        setError(
          "获取图片数据出错：" +
            (err instanceof Error ? err.message : "未知错误"),
        );
      } finally {
        setLoadingImages(false);
      }
    };

    fetchImages();
  }, []);

  return (
    <ErrorBoundary>
      {/* 页面 */}
      <div className={styles["mask-page"]}>
        {/* 窗口头部 */}
        <div className="window-header">
          <div className="window-header-title">
            {/* 主标题 */}
            <div className="window-header-main-title">
              {Locale.FileManage.Page.Title}
            </div>
            {/* 副标题 */}
            <div className="window-header-submai-title">
              {Locale.FileManage.Page.SubTitle(images.length)}
            </div>
          </div>
          {/* 窗口操作按钮 */}
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
        <div className={styles["mask-page-body"]}>
          {error && <div className={fileStyles.errorMessage}>{error}</div>}

          {/* 图集展示 */}
          <Space direction="vertical" size="middle" style={{ display: "flex" }}>
            <Card title="图像记忆" size="small">
              <div className="Image">
                <ImageGallery images={images} loading={loadingImages} />
              </div>
            </Card>
          </Space>
        </div>
      </div>
    </ErrorBoundary>
  );
}
