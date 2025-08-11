"use client";

import React, { useState } from "react";
import useConversationStore from "@/stores/useConversationStore";
import { Item } from "@/lib/assistant";
import { processMessages } from "@/lib/assistant";

interface MonthInputProps {
    prompt: string;
    placeholder?: string;
}

export default function MonthInput({ prompt, placeholder }: MonthInputProps) {
    const [value, setValue] = useState<string>("");
    const { addConversationItem, addChatMessage, setAssistantLoading } =
        useConversationStore();

    const submit = async () => {
        if (!value) return;
        const userItem: Item = {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: value }],
        } as any;
        const userMessage: any = { role: "user", content: value };
        try {
            setAssistantLoading(true);
            addConversationItem(userMessage);
            addChatMessage(userItem);
            await processMessages();
        } catch (e) {
            console.error("Error submitting month:", e);
        }
    };

    return (
        <div className="flex items-center gap-2 rounded-2xl border border-[#0f67b2]/20 bg-white px-4 py-3 shadow-sm">
            <div className="text-sm text-stone-700 mr-2">{prompt}</div>
            <input
                type="month"
                placeholder={placeholder || "YYYY-MM"}
                className="rounded-lg border border-stone-300 px-2 py-1 text-sm"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            <button
                className="rounded-lg bg-[#0f67b2] text-white text-sm px-3 py-1 disabled:opacity-50"
                disabled={!value}
                onClick={submit}
            >
                Confirmar
            </button>
        </div>
    );
}


