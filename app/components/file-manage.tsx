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

declare const require: {
  context(
    directory: string,
    useSubdirectories: boolean,
    regExp: RegExp,
  ): {
    keys(): string[];
  };
};

const images = require
  .context("../../public/mock/image", true, /\.(png|jpg|jpe?g|svg)$/)
  .keys()
  .map((image) => image.replace("./", "/mock/image/"));

const file: any[] = [
  {
    name: "file1.txt",
    size: "1KB",
    type: "text/plain",
  },
  {
    name: "file2.pdf",
    size: "2MB",
    type: "application/pdf",
  },
  {
    name: "file3.jpg",
    size: "3MB",
    type: "image/jpeg",
  },
];

// 图片展示接口
interface ImageGalleryProps {
  images: string[];
  // style?: React.CSSProperties;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  // console.log(images); // test
  if (images.length) {
    return (
      <div className={fileStyles.ImageGallery}>
        {images.map((image, index) => (
          <div key={index} className={fileStyles.ImageWrapper}>
            <Image
              src={image}
              alt={`Image ${index}`}
              className={fileStyles.Image}
              preview={{
                src: image,
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
    // else 后面有没有{}也可
    return <Result status="404" subTitle="暂无图片诶~" />;
  }
};

const OtherFile = () => {
  if (file.length) {
    return (
      <div className={fileStyles.OtherFile}>
        {file.map((file, index) => (
          <div key={index} className={fileStyles.FileItem}>
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
      <Result
        status="404"
        // title="暂无其他文件"
        subTitle="暂无其他文件诶~"
      />
    </div>
  );
};

// 文件管理
export function FileManage() {
  const navigate = useNavigate(); // 路由：用于返回

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
            {/* <div className="window-header-submai-title">
              {Locale.FileManage.Page.SubTitle(100)}
            </div> */}
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
          {/* 图集展示 */}
          <Space direction="vertical" size="middle" style={{ display: "flex" }}>
            <Card title="图集展示" size="small">
              <div className="Image">
                <ImageGallery images={images} />
              </div>
            </Card>
            <Card title="其他文件" size="small">
              <OtherFile />
            </Card>
          </Space>
        </div>
      </div>
    </ErrorBoundary>
  );
}
