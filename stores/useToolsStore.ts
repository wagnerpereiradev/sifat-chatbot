import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  defaultVectorStore,
  FILE_SEARCH_ENABLED,
  WEB_SEARCH_ENABLED,
  FUNCTIONS_ENABLED,
  CODE_INTERPRETER_ENABLED,
  MCP_ENABLED,
  WEB_SEARCH_DEFAULT_CONFIG,
  MCP_DEFAULT_CONFIG,
  MCP_DEFAULT_SERVERS,
} from "@/config/constants";

type File = {
  id: string;
  name: string;
  content: string;
};

type VectorStore = {
  id: string;
  name: string;
  files?: File[];
};

export type WebSearchConfig = {
  user_location?: {
    type: "approximate";
    country?: string;
    city?: string;
    region?: string;
  };
};

export type McpConfig = {
  server_label: string;
  server_url: string;
  allowed_tools: string;
  skip_approval: boolean;
};

interface StoreState {
  fileSearchEnabled: boolean;
  //previousFileSearchEnabled: boolean;
  setFileSearchEnabled: (enabled: boolean) => void;
  webSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean) => void;
  functionsEnabled: boolean;
  //previousFunctionsEnabled: boolean;
  setFunctionsEnabled: (enabled: boolean) => void;
  codeInterpreterEnabled: boolean;
  setCodeInterpreterEnabled: (enabled: boolean) => void;
  vectorStore: VectorStore | null;
  setVectorStore: (store: VectorStore) => void;
  webSearchConfig: WebSearchConfig;
  setWebSearchConfig: (config: WebSearchConfig) => void;
  mcpEnabled: boolean;
  setMcpEnabled: (enabled: boolean) => void;
  mcpConfig: McpConfig;
  setMcpConfig: (config: McpConfig) => void;
  mcpServers: McpConfig[];
  setMcpServers: (servers: McpConfig[]) => void;
}

const useToolsStore = create<StoreState>()(
  persist(
    (set) => ({
      vectorStore: defaultVectorStore.id !== "" ? defaultVectorStore : null,
      webSearchConfig: WEB_SEARCH_DEFAULT_CONFIG,
      mcpConfig: MCP_DEFAULT_CONFIG,
      mcpServers: MCP_DEFAULT_SERVERS as unknown as McpConfig[],
      fileSearchEnabled: FILE_SEARCH_ENABLED,
      previousFileSearchEnabled: false,
      setFileSearchEnabled: (enabled) => {
        set({ fileSearchEnabled: enabled });
      },
      webSearchEnabled: WEB_SEARCH_ENABLED,
      setWebSearchEnabled: (enabled) => {
        set({ webSearchEnabled: enabled });
      },
      functionsEnabled: FUNCTIONS_ENABLED,
      previousFunctionsEnabled: true,
      setFunctionsEnabled: (enabled) => {
        set({ functionsEnabled: enabled });
      },
      mcpEnabled: MCP_ENABLED,
      setMcpEnabled: (enabled) => {
        set({ mcpEnabled: enabled });
      },
      codeInterpreterEnabled: CODE_INTERPRETER_ENABLED,
      setCodeInterpreterEnabled: (enabled) => {
        set({ codeInterpreterEnabled: enabled });
      },
      setVectorStore: (store) => set({ vectorStore: store }),
      setWebSearchConfig: (config) => set({ webSearchConfig: config }),
      setMcpConfig: (config) => set({ mcpConfig: config }),
      setMcpServers: (servers) => set({ mcpServers: servers }),
    }),
    {
      name: "tools-store",
    }
  )
);

export default useToolsStore;
