import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import RemarkMath from "remark-math";
import RemarkBreaks from "remark-breaks";
import RehypeKatex from "rehype-katex";
import RemarkGfm from "remark-gfm";
import RehypeHighlight from "rehype-highlight";
import { useRef, useState, RefObject, useEffect, useMemo } from "react";
import { copyToClipboard, useWindowSize } from "../utils";
import mermaid from "mermaid";
import Locale from "../locales";
import LoadingIcon from "../icons/three-dots.svg";
import ReloadButtonIcon from "../icons/reload.svg";
import React from "react";
import { useDebouncedCallback } from "use-debounce";
import { showImageModal, FullScreen } from "./ui-lib";
import {
  ArtifactsShareButton,
  HTMLPreview,
  HTMLPreviewHander,
} from "./artifacts";
import { useChatStore } from "../store";
import { IconButton } from "./button";

import { useAppConfig } from "../store/config";
import clsx from "clsx";
import styles from "./chat.module.scss";

export function Mermaid(props: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (props.code && ref.current) {
      mermaid
        .run({
          nodes: [ref.current],
          suppressErrors: true,
        })
        .catch((e) => {
          setHasError(true);
          console.error("[Mermaid] ", e.message);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.code]);

  function viewSvgInNewWindow() {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const text = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([text], { type: "image/svg+xml" });
    showImageModal(URL.createObjectURL(blob));
  }

  if (hasError) {
    return null;
  }

  return (
    <div
      className={clsx("no-dark", "mermaid")}
      style={{
        cursor: "pointer",
        overflow: "auto",
      }}
      ref={ref}
      onClick={() => viewSvgInNewWindow()}
    >
      {props.code}
    </div>
  );
}

export function PreCode(props: { children: any }) {
  const ref = useRef<HTMLPreElement>(null);
  const previewRef = useRef<HTMLPreviewHander>(null);
  const [mermaidCode, setMermaidCode] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const { height } = useWindowSize();
  const chatStore = useChatStore();
  const session = chatStore.currentSession();

  const renderArtifacts = useDebouncedCallback(() => {
    if (!ref.current) return;
    const mermaidDom = ref.current.querySelector("code.language-mermaid");
    if (mermaidDom) {
      setMermaidCode((mermaidDom as HTMLElement).innerText);
    }
    const htmlDom = ref.current.querySelector("code.language-html");
    const refText = ref.current.querySelector("code")?.innerText;
    if (htmlDom) {
      setHtmlCode((htmlDom as HTMLElement).innerText);
    } else if (
      refText?.startsWith("<!DOCTYPE") ||
      refText?.startsWith("<svg") ||
      refText?.startsWith("<?xml")
    ) {
      setHtmlCode(refText);
    }
  }, 600);

  const config = useAppConfig();
  const enableArtifacts =
    session.mask?.enableArtifacts !== false && config.enableArtifacts;

  //Wrap the paragraph for plain-text
  useEffect(() => {
    if (ref.current) {
      const codeElements = ref.current.querySelectorAll(
        "code",
      ) as NodeListOf<HTMLElement>;
      const wrapLanguages = [
        "",
        "md",
        "markdown",
        "text",
        "txt",
        "plaintext",
        "tex",
        "latex",
      ];
      codeElements.forEach((codeElement) => {
        let languageClass = codeElement.className.match(/language-(\w+)/);
        let name = languageClass ? languageClass[1] : "";
        if (wrapLanguages.includes(name)) {
          codeElement.style.whiteSpace = "pre-wrap";
        }
      });
      setTimeout(renderArtifacts, 1);
    }
  }, []);

  return (
    <>
      <pre ref={ref}>
        <span
          className="copy-code-button"
          onClick={() => {
            if (ref.current) {
              copyToClipboard(
                ref.current.querySelector("code")?.innerText ?? "",
              );
            }
          }}
        ></span>
        {props.children}
      </pre>
      {mermaidCode.length > 0 && (
        <Mermaid code={mermaidCode} key={mermaidCode} />
      )}
      {htmlCode.length > 0 && enableArtifacts && (
        <FullScreen className="no-dark html" right={70}>
          <ArtifactsShareButton
            style={{ position: "absolute", right: 20, top: 10 }}
            getCode={() => htmlCode}
          />
          <IconButton
            style={{ position: "absolute", right: 120, top: 10 }}
            bordered
            icon={<ReloadButtonIcon />}
            shadow
            onClick={() => previewRef.current?.reload()}
          />
          <HTMLPreview
            ref={previewRef}
            code={htmlCode}
            autoHeight={!document.fullscreenElement}
            height={!document.fullscreenElement ? 600 : height}
          />
        </FullScreen>
      )}
    </>
  );
}

function CustomCode(props: { children: any; className?: string }) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();
  const enableCodeFold =
    session.mask?.enableCodeFold !== false && config.enableCodeFold;

  const ref = useRef<HTMLPreElement>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [showToggle, setShowToggle] = useState(false);

  useEffect(() => {
    if (ref.current) {
      const codeHeight = ref.current.scrollHeight;
      setShowToggle(codeHeight > 400);
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [props.children]);

  const toggleCollapsed = () => {
    setCollapsed((collapsed) => !collapsed);
  };
  const renderShowMoreButton = () => {
    if (showToggle && enableCodeFold && collapsed) {
      return (
        <div
          className={clsx("show-hide-button", {
            collapsed,
            expanded: !collapsed,
          })}
        >
          <button onClick={toggleCollapsed}>{Locale.NewChat.More}</button>
        </div>
      );
    }
    return null;
  };
  return (
    <>
      <code
        className={clsx(props?.className)}
        ref={ref}
        style={{
          maxHeight: enableCodeFold && collapsed ? "400px" : "none",
          overflowY: "hidden",
        }}
      >
        {props.children}
      </code>

      {renderShowMoreButton()}
    </>
  );
}

function escapeBrackets(text: string) {
  const pattern =
    /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g;
  return text.replace(
    pattern,
    (match, codeBlock, squareBracket, roundBracket) => {
      if (codeBlock) {
        return codeBlock;
      } else if (squareBracket) {
        return `$$${squareBracket}$$`;
      } else if (roundBracket) {
        return `$${roundBracket}$`;
      }
      return match;
    },
  );
}

function tryWrapHtmlCode(text: string) {
  // try add wrap html code (fixed: html codeblock include 2 newline)
  // ignore embed codeblock
  if (text.includes("```")) {
    return text;
  }
  return text
    .replace(
      /([`]*?)(\w*?)([\n\r]*?)(<!DOCTYPE html>)/g,
      (match, quoteStart, lang, newLine, doctype) => {
        return !quoteStart ? "\n```html\n" + doctype : match;
      },
    )
    .replace(
      /(<\/body>)([\r\n\s]*?)(<\/html>)([\n\r]*)([`]*)([\n\r]*?)/g,
      (match, bodyEnd, space, htmlEnd, newLine, quoteEnd) => {
        return !quoteEnd ? bodyEnd + space + htmlEnd + "\n```\n" : match;
      },
    );
}

// 自定义组件，用于处理特殊标签
function CustomMarkdownContent({ content }: { content: string }) {
  // 状态用于跟踪每个函数参数标签和思考标签的展开/折叠状态
  const [expandedFunctions, setExpandedFunctions] = useState<
    Record<string, boolean>
  >({});
  const [expandedThinks, setExpandedThinks] = useState<Record<string, boolean>>(
    {},
  );

  // 检查内容中是否包含特殊标签
  const hasThinkTag = content.includes("<thought>");
  const hasFunctionArgumentsTag = content.includes("<tools_arguments>");
  const hasSelfAnswerTag = content.includes("<self_answer>");

  // 如果包含特殊标签，使用自定义渲染
  if (hasThinkTag || hasFunctionArgumentsTag || hasSelfAnswerTag) {
    // 创建一个包含所有处理后内容的数组
    const contentParts: JSX.Element[] = [];

    // 将内容按照特殊标签分割
    const segments = splitContentByTags(content);

    // 处理每个分段
    segments.forEach((segment, index) => {
      if (segment.type === "text") {
        // 普通文本，使用 ReactMarkdown 渲染
        contentParts.push(
          <ReactMarkdown
            key={`text-${index}`}
            remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
            rehypePlugins={[
              RehypeKatex,
              [
                RehypeHighlight,
                {
                  detect: false,
                  ignoreMissing: true,
                },
              ],
            ]}
            components={{
              pre: PreCode,
              code: CustomCode,
              p: (pProps) => <p {...pProps} dir="auto" />,
              a: (aProps) => {
                const href = aProps.href || "";
                if (/\.(aac|mp3|opus|wav)$/.test(href)) {
                  return (
                    <figure>
                      <audio controls src={href}></audio>
                    </figure>
                  );
                }
                if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) {
                  return (
                    <video controls width="99.9%">
                      <source src={href} />
                    </video>
                  );
                }
                const isInternal = /^\/#/i.test(href);
                const target = isInternal ? "_self" : aProps.target ?? "_blank";
                return <a {...aProps} target={target} />;
              },
            }}
          >
            {segment.content}
          </ReactMarkdown>,
        );
      } else if (segment.type === "think") {
        // 思考标签，添加折叠功能
        contentParts.push(
          <div
            key={`think-${index}`}
            className={`special-tag ${styles["think-tag"]}`}
          >
            <div
              className={styles["function-header"]}
              onClick={() => {
                setExpandedThinks((prev) => ({
                  ...prev,
                  [index]: !prev[index],
                }));
              }}
            >
              <span className={styles["function-name"]}>思考过程</span>
              <span className={styles["function-status"]}>
                {expandedThinks[index] ? "折叠" : "展开"}
              </span>
            </div>

            {!expandedThinks[index] ? (
              <div className={styles["function-collapsed"]}>AI 的思考过程</div>
            ) : (
              <div className={styles["function-content"]}>
                <ReactMarkdown
                  remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
                  rehypePlugins={[
                    RehypeKatex,
                    [
                      RehypeHighlight,
                      {
                        detect: false,
                        ignoreMissing: true,
                      },
                    ],
                  ]}
                  components={{
                    pre: PreCode,
                    code: CustomCode,
                    p: (pProps) => <p {...pProps} dir="auto" />,
                    a: (aProps) => {
                      const href = aProps.href || "";
                      if (/\.(aac|mp3|opus|wav)$/.test(href)) {
                        return (
                          <figure>
                            <audio controls src={href}></audio>
                          </figure>
                        );
                      }
                      if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) {
                        return (
                          <video controls width="99.9%">
                            <source src={href} />
                          </video>
                        );
                      }
                      const isInternal = /^\/#/i.test(href);
                      const target = isInternal
                        ? "_self"
                        : aProps.target ?? "_blank";
                      return <a {...aProps} target={target} />;
                    },
                  }}
                >
                  {segment.content}
                </ReactMarkdown>
              </div>
            )}
          </div>,
        );
      } else if (segment.type === "tools_arguments") {
        // 函数参数标签
        let functionName = "函数调用";
        let functionContent = segment.content;
        try {
          const functionData = JSON.parse(segment.content);
          if (functionData.name) {
            functionName = functionData.name;
          }
          // 将 JSON 格式化为更易读的形式
          functionContent = JSON.stringify(functionData, null, 2);
        } catch (e) {
          // 解析失败时使用原始内容
        }

        contentParts.push(
          <div
            key={`function-${index}`}
            className={`special-tag ${styles["function-arguments-tag"]}`}
          >
            <div
              className={styles["function-header"]}
              onClick={() => {
                setExpandedFunctions((prev) => ({
                  ...prev,
                  [index]: !prev[index],
                }));
              }}
            >
              <span className={styles["function-name"]}>{functionName}</span>
              <span className={styles["function-status"]}>
                {expandedFunctions[index] ? "折叠" : "展开"}
              </span>
            </div>

            {!expandedFunctions[index] ? (
              <div className={styles["function-collapsed"]}>函数调用完成</div>
            ) : (
              <div className={styles["function-content"]}>
                <pre>
                  <code>{functionContent}</code>
                </pre>
              </div>
            )}
          </div>,
        );
      } else if (segment.type === "self_answer") {
        // 自答标签，使用 ReactMarkdown 渲染内容
        contentParts.push(
          <div key={`self-answer-${index}`}>
            <ReactMarkdown
              remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
              rehypePlugins={[
                RehypeKatex,
                [
                  RehypeHighlight,
                  {
                    detect: false,
                    ignoreMissing: true,
                  },
                ],
              ]}
              components={{
                pre: PreCode,
                code: CustomCode,
                p: (pProps) => <p {...pProps} dir="auto" />,
                a: (aProps) => {
                  const href = aProps.href || "";
                  if (/\.(aac|mp3|opus|wav)$/.test(href)) {
                    return (
                      <figure>
                        <audio controls src={href}></audio>
                      </figure>
                    );
                  }
                  if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) {
                    return (
                      <video controls width="99.9%">
                        <source src={href} />
                      </video>
                    );
                  }
                  const isInternal = /^\/#/i.test(href);
                  const target = isInternal
                    ? "_self"
                    : aProps.target ?? "_blank";
                  return <a {...aProps} target={target} />;
                },
              }}
            >
              {segment.content}
            </ReactMarkdown>
          </div>,
        );
      } else if (segment.type === "incomplete_think") {
        // 未完成的思考标签，添加折叠功能
        contentParts.push(
          <div
            key={`incomplete-think-${index}`}
            className={`special-tag ${styles["think-tag"]}`}
          >
            <div
              className={styles["function-header"]}
              onClick={() => {
                setExpandedThinks((prev) => ({
                  ...prev,
                  [index]: !prev[index],
                }));
              }}
            >
              <span className={styles["function-name"]}>思考过程</span>
              <span className={styles["function-status"]}>
                {expandedThinks[index] ? "折叠" : "展开"}
              </span>
            </div>

            {!expandedThinks[index] ? (
              <div className={styles["function-collapsed"]}>
                AI 正在思考中...
              </div>
            ) : (
              <div className={styles["function-content"]}>
                <ReactMarkdown
                  remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
                  rehypePlugins={[
                    RehypeKatex,
                    [
                      RehypeHighlight,
                      {
                        detect: false,
                        ignoreMissing: true,
                      },
                    ],
                  ]}
                  components={{
                    pre: PreCode,
                    code: CustomCode,
                    p: (pProps) => <p {...pProps} dir="auto" />,
                    a: (aProps) => {
                      const href = aProps.href || "";
                      if (/\.(aac|mp3|opus|wav)$/.test(href)) {
                        return (
                          <figure>
                            <audio controls src={href}></audio>
                          </figure>
                        );
                      }
                      if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) {
                        return (
                          <video controls width="99.9%">
                            <source src={href} />
                          </video>
                        );
                      }
                      const isInternal = /^\/#/i.test(href);
                      const target = isInternal
                        ? "_self"
                        : aProps.target ?? "_blank";
                      return <a {...aProps} target={target} />;
                    },
                  }}
                >
                  {segment.content}
                </ReactMarkdown>
              </div>
            )}
          </div>,
        );
      } else if (segment.type === "incomplete_function") {
        // 未完成的函数参数标签
        contentParts.push(
          <div
            key={`incomplete-function-${index}`}
            className={`special-tag ${styles["function-arguments-tag"]}`}
          >
            <div className={styles["function-header"]}>
              <span className={styles["function-name"]}>函数调用</span>
              <span className={styles["function-status"]}>生成中...</span>
            </div>
            <div className={styles["function-collapsed"]}>
              函数调用生成中...
            </div>
          </div>,
        );
      } else if (segment.type === "incomplete_self_answer") {
        // 未完成的自答标签，使用 ReactMarkdown 渲染内容
        contentParts.push(
          <div key={`incomplete-self-answer-${index}`}>
            <ReactMarkdown
              remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
              rehypePlugins={[
                RehypeKatex,
                [
                  RehypeHighlight,
                  {
                    detect: false,
                    ignoreMissing: true,
                  },
                ],
              ]}
              components={{
                pre: PreCode,
                code: CustomCode,
                p: (pProps) => <p {...pProps} dir="auto" />,
                a: (aProps) => {
                  const href = aProps.href || "";
                  if (/\.(aac|mp3|opus|wav)$/.test(href)) {
                    return (
                      <figure>
                        <audio controls src={href}></audio>
                      </figure>
                    );
                  }
                  if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) {
                    return (
                      <video controls width="99.9%">
                        <source src={href} />
                      </video>
                    );
                  }
                  const isInternal = /^\/#/i.test(href);
                  const target = isInternal
                    ? "_self"
                    : aProps.target ?? "_blank";
                  return <a {...aProps} target={target} />;
                },
              }}
            >
              {segment.content}
            </ReactMarkdown>
          </div>,
        );
      }
    });

    return <>{contentParts}</>;
  }

  // 如果没有特殊标签，返回 null，让 ReactMarkdown 处理
  return null;
}

// 辅助函数：按照特殊标签分割内容
function splitContentByTags(
  content: string,
): Array<{ type: string; content: string }> {
  const result: Array<{ type: string; content: string }> = [];
  let currentIndex = 0;

  // 正则表达式匹配所有完整的特殊标签
  const tagRegex = /<(thought|tools_arguments|self_answer)>([^]*?)<\/\1>/g;
  let match;

  // 处理所有完整的标签
  while ((match = tagRegex.exec(content)) !== null) {
    const [fullMatch, tagName, tagContent] = match;
    const matchIndex = match.index;

    // 添加标签前的普通文本
    if (matchIndex > currentIndex) {
      result.push({
        type: "text",
        content: content.substring(currentIndex, matchIndex),
      });
    }

    // 添加标签内容
    result.push({
      type: tagName,
      content: tagContent,
    });

    currentIndex = matchIndex + fullMatch.length;
  }

  // 处理剩余的文本，可能包含未闭合的标签
  if (currentIndex < content.length) {
    const remainingContent = content.substring(currentIndex);

    // 检查未闭合的标签
    const incompleteThinkMatch = /<thought>([^]*?)$/.exec(remainingContent);
    const incompleteFunctionMatch = /<tools_arguments>([^]*?)$/.exec(
      remainingContent,
    );
    const incompleteSelfAnswerMatch = /<self_answer>([^]*?)$/.exec(
      remainingContent,
    );

    if (incompleteThinkMatch) {
      // 有未闭合的 <think> 标签
      const matchIndex = incompleteThinkMatch.index;

      // 添加标签前的普通文本
      if (matchIndex > 0) {
        result.push({
          type: "text",
          content: remainingContent.substring(0, matchIndex),
        });
      }

      // 添加未闭合的标签内容
      result.push({
        type: "incomplete_think",
        content: incompleteThinkMatch[1],
      });
    } else if (incompleteFunctionMatch) {
      // 有未闭合的 <tools_arguments> 标签
      const matchIndex = incompleteFunctionMatch.index;

      // 添加标签前的普通文本
      if (matchIndex > 0) {
        result.push({
          type: "text",
          content: remainingContent.substring(0, matchIndex),
        });
      }

      // 添加未闭合的标签内容
      result.push({
        type: "incomplete_function",
        content: incompleteFunctionMatch[1],
      });
    } else if (incompleteSelfAnswerMatch) {
      // 有未闭合的 <self_answer> 标签
      const matchIndex = incompleteSelfAnswerMatch.index;

      // 添加标签前的普通文本
      if (matchIndex > 0) {
        result.push({
          type: "text",
          content: remainingContent.substring(0, matchIndex),
        });
      }

      // 添加未闭合的标签内容
      result.push({
        type: "incomplete_self_answer",
        content: incompleteSelfAnswerMatch[1],
      });
    } else {
      // 没有未闭合的标签，全部作为普通文本
      result.push({
        type: "text",
        content: remainingContent,
      });
    }
  }

  return result;
}

function _MarkDownContent(props: { content: string }) {
  const escapedContent = useMemo(() => {
    return tryWrapHtmlCode(escapeBrackets(props.content));
  }, [props.content]);

  // 检查内容中是否包含特殊标签或标签的开始部分
  const hasSpecialTags =
    props.content.includes("<thought>") ||
    props.content.includes("</thought>") ||
    props.content.includes("<tools_arguments>") ||
    props.content.includes("</tools_arguments>");

  // 如果包含特殊标签，使用自定义渲染
  if (hasSpecialTags) {
    return <CustomMarkdownContent content={props.content} />;
  }

  // 否则使用标准的 ReactMarkdown 渲染
  return (
    <ReactMarkdown
      remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
      rehypePlugins={[
        RehypeKatex,
        [
          RehypeHighlight,
          {
            detect: false,
            ignoreMissing: true,
          },
        ],
      ]}
      components={{
        pre: PreCode,
        code: CustomCode,
        p: (pProps) => <p {...pProps} dir="auto" />,
        a: (aProps) => {
          const href = aProps.href || "";
          if (/\.(aac|mp3|opus|wav)$/.test(href)) {
            return (
              <figure>
                <audio controls src={href}></audio>
              </figure>
            );
          }
          if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) {
            return (
              <video controls width="99.9%">
                <source src={href} />
              </video>
            );
          }
          const isInternal = /^\/#/i.test(href);
          const target = isInternal ? "_self" : aProps.target ?? "_blank";
          return <a {...aProps} target={target} />;
        },
      }}
    >
      {escapedContent}
    </ReactMarkdown>
  );
}

export const MarkdownContent = React.memo(_MarkDownContent);

export function Markdown(
  props: {
    content: string;
    loading?: boolean;
    fontSize?: number;
    fontFamily?: string;
    parentRef?: RefObject<HTMLDivElement>;
    defaultShow?: boolean;
  } & React.DOMAttributes<HTMLDivElement>,
) {
  const mdRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="markdown-body"
      style={{
        fontSize: `${props.fontSize ?? 14}px`,
        fontFamily: props.fontFamily || "inherit",
      }}
      ref={mdRef}
      onContextMenu={props.onContextMenu}
      onDoubleClickCapture={props.onDoubleClickCapture}
      dir="auto"
    >
      {props.loading ? (
        <LoadingIcon />
      ) : (
        <MarkdownContent content={props.content} />
      )}
    </div>
  );
}
