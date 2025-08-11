"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ToolCall from "./tool-call";
import Message from "./message";
import Annotations from "./annotations";
import McpToolsList from "./mcp-tools-list";
import McpApproval from "./mcp-approval";
import { Item, McpApprovalRequestItem } from "@/lib/assistant";
import { TextShimmerWave } from "./loading-message";
import useConversationStore from "@/stores/useConversationStore";
import Image from "next/image";

import {
  TrendingUp,
  Ban,
  BarChart2,
  AlertCircle,
  Clock,
  CalendarDays,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DateInput from "./date-input";
import MonthInput from "./month-input";

interface ChatProps {
  items: Item[];
  onSendMessage: (message: string) => void;
  onApprovalResponse: (approve: boolean, id: string) => void;
}

const Chat: React.FC<ChatProps> = ({
  items,
  onSendMessage,
  onApprovalResponse,
}) => {
  const itemsEndRef = useRef<HTMLDivElement>(null);
  const [inputMessageText, setinputMessageText] = useState<string>("");
  // This state is used to provide better user experience for non-English IMEs such as Japanese
  const [isComposing, setIsComposing] = useState(false);
  const { isAssistantLoading } = useConversationStore();
  const suggestions: { title: string; message: string; Icon: LucideIcon }[] = [
    {
      title: "Descubra o Top 10 Produtos Mais Vendidos",
      message: "Liste os 10 produtos mais vendidos.",
      Icon: TrendingUp,
    },
    {
      title: "Produtos Sem Vendas Desde uma Data",
      message: "Liste os produtos sem vendas desde [DATA].",
      Icon: Ban,
    },
    {
      title: "Compare Vendas Entre Semanas",
      message: "Apresente um comparativo de vendas por semana.",
      Icon: BarChart2,
    },
    {
      title: "Títulos a Pagar Vencidos",
      message: "Liste os títulos a pagar vencidos.",
      Icon: AlertCircle,
    },
    {
      title: "Títulos a Pagar: Próximos 7 Dias",
      message: "Liste os títulos a pagar com vencimento nos próximos 7 dias.",
      Icon: Clock,
    },
    {
      title: "Aniversariantes por Mês",
      message: "Liste os clientes que fazem aniversário no mês de [MÊS].",
      Icon: CalendarDays,
    },
  ];

  const scrollToBottom = () => {
    itemsEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey && !isComposing) {
        event.preventDefault();
        onSendMessage(inputMessageText);
        setinputMessageText("");
      }
    },
    [onSendMessage, inputMessageText, isComposing]
  );

  useEffect(() => {
    scrollToBottom();
  }, [items]);

  return (
    <div className="flex justify-center items-center size-full">
      <div className="flex grow flex-col h-full w-full">
        <div className="flex flex-col items-center justify-center gap-2 h-20 border-b border-gray-200">
          <div className="mx-auto w-full max-w-[750px] flex items-center justify-center">
            <Image
              src="/sifat_logo/sifat_logo_horizontal_azul.svg"
              alt="logo"
              width={100}
              height={100}
              className="cursor-pointer"
              onClick={() => {
                const { reset } = useConversationStore.getState();
                reset();
              }}
            />
          </div>
        </div>

        <div className="h-full overflow-y-auto px-4 flex flex-col subtle-scrollbar">
          {items.length === 0 ? (
            <div className="mx-auto w-full max-w-[750px] mt-8 space-y-8">
              {/* Header sem box */}
              <div className="text-center space-y-3">
                <h1 className="text-2xl md:text-3xl font-bold text-[#0f67b2]">
                  Olá! Eu sou o chatbot oficial da SIFAT
                </h1>
                <p className="text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
                  Estou aqui para ajudar você a explorar seus dados, responder dúvidas e agilizar tarefas do dia a dia. Selecione uma sugestão abaixo ou digite sua pergunta.
                </p>
              </div>

              {/* Sugestões */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-stone-700 text-center">
                  Como posso te ajudar?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suggestions.map(({ title, message, Icon }, idx) => (
                    <button
                      key={idx}
                      className="group flex items-start gap-4 rounded-2xl border border-[#0f67b2]/15 bg-white/80 backdrop-blur-sm p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[#0f67b2]/30"
                      onClick={() => onSendMessage(message)}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f67b2]/10 text-[#0f67b2] group-hover:bg-[#0f67b2] group-hover:text-white transition-all duration-200 group-hover:scale-110">
                        <Icon size={20} />
                      </div>
                      <span className="text-sm font-medium text-stone-800 leading-6 text-left">
                        {title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Powered by */}
              <div className="flex justify-center items-center mt-12 pt-8 border-t border-stone-200">
                <div className="flex items-center gap-2 opacity-20 hover:opacity-60 transition-opacity duration-200 cursor-pointer">
                  <span className="text-xs text-stone-800 font-medium">Powered by</span>
                  <Image
                    src="/sifat_logo/sifat_logo_horizontal_preto.svg"
                    alt="SIFAT Logo"
                    width={100}
                    height={100}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-[750px] mt-auto space-y-5 pt-4 pb-48">
              {items.map((item, index) => (
                <React.Fragment key={index}>
                  {item.type === "tool_call" ? (
                    <ToolCall toolCall={item} />
                  ) : item.type === "message" ? (
                    <div className="flex flex-col gap-1">
                      <Message message={item} />
                      {item.content &&
                        item.content[0].annotations &&
                        item.content[0].annotations.length > 0 && (
                          <Annotations
                            annotations={item.content[0].annotations}
                          />
                        )}
                    </div>
                  ) : item.type === "mcp_list_tools" ? (
                    <McpToolsList item={item} />
                  ) : item.type === "mcp_approval_request" ? (
                    <McpApproval
                      item={item as McpApprovalRequestItem}
                      onRespond={onApprovalResponse}
                    />
                  ) : (item as any).type === "date_input_request" ? (
                    <div className="flex w-full justify-start pl-10">
                      <DateInput
                        prompt={(item as any).prompt}
                        placeholder={(item as any).placeholder}
                      />
                    </div>
                  ) : (item as any).type === "month_input_request" ? (
                    <div className="flex w-full justify-start pl-10">
                      <MonthInput
                        prompt={(item as any).prompt}
                        placeholder={(item as any).placeholder}
                      />
                    </div>
                  ) : null}
                </React.Fragment>
              ))}
              {isAssistantLoading && <TextShimmerWave>Pensando...</TextShimmerWave>}
              <div ref={itemsEndRef} />
            </div>
          )}
        </div>

        <div className="flex-1 flex justify-center p-4 pt-0 fixed bottom-0 left-0 right-0">
          <div className="flex items-center w-full md:max-w-[750px]">
            <div className="flex w-full items-center pb-4 md:pb-1">
              <div className="flex w-full flex-col gap-1.5 rounded-[20px] p-2.5 pl-1.5 transition-colors bg-white border border-stone-200 shadow-lg">
                <div className="flex items-end gap-1.5 md:gap-2 pl-4">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <textarea
                      id="prompt-textarea"
                      tabIndex={0}
                      dir="auto"
                      rows={2}
                      placeholder="Sua mensagem aqui..."
                      className="mb-2 resize-none border-0 focus:outline-none text-base bg-transparent px-0 pb-6 pt-2"
                      value={inputMessageText}
                      onChange={(e) => setinputMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={() => setIsComposing(false)}
                    />
                  </div>
                  <button
                    disabled={!inputMessageText}
                    data-testid="send-button"
                    className="flex size-8 items-end justify-center rounded-full bg-[#0c64b4] text-white transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:bg-[#9dc5e3] disabled:text-[#f4f4f4] disabled:hover:opacity-100"
                    onClick={() => {
                      onSendMessage(inputMessageText);
                      setinputMessageText("");
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      fill="none"
                      viewBox="0 0 32 32"
                      className="icon-2xl"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M15.192 8.906a1.143 1.143 0 0 1 1.616 0l5.143 5.143a1.143 1.143 0 0 1-1.616 1.616l-3.192-3.192v9.813a1.143 1.143 0 0 1-2.286 0v-9.813l-3.192 3.192a1.143 1.143 0 1 1-1.616-1.616z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
