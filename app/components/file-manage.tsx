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
import { Image, Card, Space, Result } from "antd"; // 图片卡片组件,卡片:布局组件,空状态
import { useState, useEffect } from "react"; // React Hooks

// 删除 mock 数据相关代码
// declare const require...

// 定义图片和文件的接口
interface ImageItem {
  id: string; // 图片id
  url: string; // 图片地址
  name: string; // 图片名称
  createTime: string; // 创建时间
}

interface FileItem {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  createTime: string;
}

// 图片展示接口
interface ImageGalleryProps {
  images: ImageItem[];
  loading: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, loading }) => {
  if (loading) {
    return (
      <div className={fileStyles.loadingContainer}>
        <LoadingOutlined style={{ fontSize: 24 }} />
        <p>加载中...</p>
      </div>
    );
  }

  if (images.length) {
    return (
      <div className={fileStyles.ImageGallery}>
        {images.map((image) => (
          <div key={image.id} className={fileStyles.ImageWrapper}>
            <Image
              src={image.url}
              alt={image.name}
              className={fileStyles.Image}
              preview={{
                src: image.url,
                scaleStep: 0.3,
              }}
              placeholder={
                <div className={fileStyles.ImagePlaceholder}>
                  <LoadingOutlined />
                </div>
              }
            />
          </div>
        ))}
      </div>
    );
  } else {
    return <Result status="404" subTitle="暂无精彩图像记忆诶~" />;
  }
};

interface OtherFileProps {
  files: FileItem[];
  loading: boolean;
}

const OtherFile: React.FC<OtherFileProps> = ({ files, loading }) => {
  if (loading) {
    return (
      <div className={fileStyles.loadingContainer}>
        <LoadingOutlined style={{ fontSize: 24 }} />
        <p>加载中...</p>
      </div>
    );
  }

  if (files.length) {
    return (
      <div className={fileStyles.OtherFile}>
        {files.map((file) => (
          <div key={file.id} className={fileStyles.FileItem}>
            <div className={fileStyles.FileName}>{file.name}</div>
            <div className={fileStyles.FileSize}>{file.size}</div>
            <div className={fileStyles.FileType}>{file.type}</div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div>
      <Result status="404" subTitle="暂无其他文件记忆诶~" />
    </div>
  );
};

// 文件管理
export function FileManage() {
  const navigate = useNavigate(); // 路由：用于返回
  const [images, setImages] = useState<ImageItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取图片数据
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoadingImages(true);
        const response = await fetch("/api/files/images");
        if (!response.ok) {
          throw new Error("获取图片数据失败");
        }
        const data = await response.json();
        setImages(data);
      } catch (err) {
        console.error("获取图片数据出错:", err);
        setError("获取图片数据失败，请稍后重试");
      } finally {
        setLoadingImages(false);
      }
    };

    fetchImages();
  }, []);

  // 获取其他文件数据
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoadingFiles(true);
        const response = await fetch("/api/files/others");
        if (!response.ok) {
          throw new Error("获取文件数据失败");
        }
        const data = await response.json();
        setFiles(data);
      } catch (err) {
        console.error("获取文件数据出错:", err);
        setError("获取文件数据失败，请稍后重试");
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchFiles();
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
              {Locale.FileManage.Page.SubTitle(images.length + files.length)}
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
            <Card title="其他记忆" size="small">
              <OtherFile files={files} loading={loadingFiles} />
            </Card>
          </Space>
        </div>
      </div>
    </ErrorBoundary>
  );
}
