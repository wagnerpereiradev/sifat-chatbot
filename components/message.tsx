import { MessageItem } from "@/lib/assistant";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy } from "react-syntax-highlighter/dist/esm/styles/prism";
import Image from "next/image";

interface MessageProps {
  message: MessageItem;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const markdownComponents: any = {
    a: (props: any) => (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#0f67b2] underline hover:no-underline"
      />
    ),
    code({ inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      if (!inline && match) {
        return (
          <SyntaxHighlighter
            style={coy}
            language={match[1]}
            PreTag="div"
            customStyle={{ borderRadius: 12, margin: 0 }}
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        );
      }
      return (
        <code className="bg-stone-100 rounded px-1.5 py-0.5 text-[0.85em]" {...props}>
          {children}
        </code>
      );
    },
    table: (props: any) => (
      <div className="overflow-x-auto rounded-2xl border border-stone-200">
        <table className="min-w-full text-sm" {...props} />
      </div>
    ),
    th: (props: any) => (
      <th className="px-4 py-2 text-left font-medium bg-stone-50" {...props} />
    ),
    td: (props: any) => (
      <td className="px-4 py-2 align-top" {...props} />
    ),
    ul: (props: any) => <ul className="list-disc ml-6 space-y-1" {...props} />,
    ol: (props: any) => <ol className="list-decimal ml-6 space-y-1" {...props} />,
    blockquote: (props: any) => (
      <blockquote
        className="border-l-4 border-stone-300 pl-4 italic text-stone-700"
        {...props}
      />
    ),
    h1: (props: any) => <h1 className="text-2xl font-semibold" {...props} />,
    h2: (props: any) => <h2 className="text-xl font-semibold" {...props} />,
    h3: (props: any) => <h3 className="text-lg font-semibold" {...props} />,
  };
  return (
    <div className="text-base">
      {message.role === "user" ? (
        <div className="flex justify-end">
          <div>
            <div className="ml-4 rounded-[16px] px-6 py-3 md:ml-24 bg-[#e8f7ff] text-stone-900">
              <div>
                <div>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSlug]}
                    components={markdownComponents}
                  >
                    {message.content[0].text as string}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex items-start">
            <Image
              src="/sifat_logo/sifat_logo_icon_azul.svg"
              alt="SIFAT"
              className="h-6 w-6 mt-0.5"
              width={24}
              height={24}
            />
            <div className="rounded-[16px] px-4 pb-2 md:mr-24 text-black bg-white">
              <div className="flex flex-col gap-4">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSlug]}
                  components={markdownComponents}
                >
                  {message.content[0].text as string}
                </ReactMarkdown>
                {message.content[0].annotations &&
                  message.content[0].annotations
                    .filter(
                      (a) =>
                        a.type === "container_file_citation" &&
                        a.filename &&
                        /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(a.filename)
                    )
                    .map((a, i) => (
                      <Image
                        key={i}
                        src={`/api/container_files/content?file_id=${a.fileId}${a.containerId ? `&container_id=${a.containerId}` : ""}${a.filename ? `&filename=${encodeURIComponent(a.filename)}` : ""}`}
                        alt={a.filename || ""}
                        className="mt-2 max-w-full"
                        width={100}
                        height={100}
                      />
                    ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;
