import { toolsList } from "../../config/tools-list";
import useToolsStore from "@/stores/useToolsStore";
import { WebSearchConfig } from "@/stores/useToolsStore";

interface WebSearchTool extends WebSearchConfig {
  type: "web_search";
}
export const getTools = () => {
  const {
    webSearchEnabled,
    fileSearchEnabled,
    functionsEnabled,
    codeInterpreterEnabled,
    vectorStore,
    webSearchConfig,
    mcpEnabled,
    mcpConfig,
    mcpServers,
  } = useToolsStore.getState();

  const tools = [];

  if (webSearchEnabled) {
    const webSearchTool: WebSearchTool = {
      type: "web_search",
    };
    if (
      webSearchConfig.user_location &&
      (webSearchConfig.user_location.country !== "" ||
        webSearchConfig.user_location.region !== "" ||
        webSearchConfig.user_location.city !== "")
    ) {
      webSearchTool.user_location = webSearchConfig.user_location;
    }

    tools.push(webSearchTool);
  }

  if (fileSearchEnabled) {
    const fileSearchTool = {
      type: "file_search",
      vector_store_ids: [vectorStore?.id],
    };
    tools.push(fileSearchTool);
  }

  if (codeInterpreterEnabled) {
    tools.push({ type: "code_interpreter", container: { type: "auto" } });
  }

  if (functionsEnabled) {
    tools.push(
      ...toolsList.map((tool) => {
        return {
          type: "function",
          name: tool.name,
          description: tool.description,
          parameters: {
            type: "object",
            properties: { ...tool.parameters },
            required: Object.keys(tool.parameters),
            additionalProperties: false,
          },
          strict: true,
        };
      })
    );
  }

  if (mcpEnabled) {
    const candidates = [] as any[];
    // single config maintained for backward-compat
    if (mcpConfig && mcpConfig.server_url && mcpConfig.server_label) {
      candidates.push(mcpConfig);
    }
    // multiple servers
    if (Array.isArray(mcpServers)) {
      for (const cfg of mcpServers) {
        if (cfg && cfg.server_url && cfg.server_label) {
          candidates.push(cfg);
        }
      }
    }

    for (const cfg of candidates) {
      const mcpTool: any = {
        type: "mcp",
        server_label: cfg.server_label,
        server_url: cfg.server_url,
      };
      if (cfg.skip_approval) {
        mcpTool.require_approval = "never";
      }
      if (typeof cfg.allowed_tools === "string" && cfg.allowed_tools.trim()) {
        mcpTool.allowed_tools = cfg.allowed_tools
          .split(",")
          .map((t: string) => t.trim())
          .filter((t: string) => t);
      }
      tools.push(mcpTool);
    }
  }

  console.log("tools", tools);

  return tools;
};
