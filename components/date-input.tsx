"use client";

import React, { useState } from "react";
import useConversationStore from "@/stores/useConversationStore";
import { Item } from "@/lib/assistant";
import { processMessages } from "@/lib/assistant";

interface DateInputProps {
    prompt: string;
    placeholder?: string;
}

export default function DateInput({ prompt, placeholder }: DateInputProps) {
    const [date, setDate] = useState<string>("");
    const { addConversationItem, addChatMessage, setAssistantLoading } =
        useConversationStore();

    const submit = async () => {
        if (!date) return;

        const userItem: Item = {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: date }],
        } as any;
        const userMessage: any = {
            role: "user",
            content: date,
        };

        try {
            setAssistantLoading(true);
            addConversationItem(userMessage);
            addChatMessage(userItem);
            await processMessages();
        } catch (error) {
            console.error("Error submitting date:", error);
        }
    };

    return (
        <div className="flex items-center gap-2 rounded-2xl border border-[#0f67b2]/20 bg-white px-4 py-3 shadow-sm">
            <div className="text-sm text-stone-700 mr-2">{prompt}</div>
            <input
                type="date"
                placeholder={placeholder || "YYYY-MM-DD"}
                className="rounded-lg border border-stone-300 px-2 py-1 text-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
            />
            <button
                className="rounded-lg bg-[#0f67b2] text-white text-sm px-3 py-1 disabled:opacity-50"
                disabled={!date}
                onClick={submit}
            >
                Confirmar
            </button>
        </div>
    );
}


