/**
 * Tool Call 状态渲染组件
 *
 * 显示工具调用的状态，包括正在执行和已完成的工具调用
 */

import {
  Build,
  CheckCircle,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Collapse,
  IconButton,
  CircularProgress,
  Chip,
} from "@mui/material";
import { useState } from "react";

import type { ToolCallRequest, ToolResult } from "@/types";

import {
  toolCallContainerStyles,
  toolCallItemStyles,
  toolCallHeaderStyles,
  toolCallIconStyles,
  toolCallNameStyles,
  toolCallStatusChipStyles,
  toolCallDetailsStyles,
  toolCallCodeBlockStyles,
} from "./ToolCallStatus.styles";


/**
 * 工具调用项，包含请求和可能的结果
 */
export type ToolCallItem = {
  request: ToolCallRequest;
  result?: ToolResult;
};

type ToolCallStatusProps = {
  toolCalls: ToolCallItem[];
};

/**
 * 单个工具调用的渲染
 */
export function ToolCallItemView({ toolCall }: { toolCall: ToolCallItem }) {
  const [expanded, setExpanded] = useState(false);
  const { request, result } = toolCall;
  const isPending = !result;

  // 尝试格式化 JSON
  const formatJSON = (str: string): string => {
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  return (
    <Box sx={toolCallItemStyles}>
      <Box sx={toolCallHeaderStyles} onClick={() => setExpanded(!expanded)}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
          {isPending ? (
            <CircularProgress size={16} sx={{ color: "#D4C5A9" }} />
          ) : (
            <CheckCircle sx={{ ...toolCallIconStyles, color: "#8FA3B5" }} />
          )}
          <Build sx={toolCallIconStyles} />
          <Typography sx={toolCallNameStyles}>{request.name}</Typography>
          <Chip
            label={isPending ? "执行中" : "已完成"}
            size="small"
            sx={toolCallStatusChipStyles(isPending)}
          />
        </Box>
        <IconButton size="small" sx={{ color: "text.secondary" }}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={toolCallDetailsStyles}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
            参数:
          </Typography>
          <Box component="pre" sx={toolCallCodeBlockStyles}>
            <code>{formatJSON(request.arguments)}</code>
          </Box>

          {result && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, mb: 0.5, display: "block" }}>
                结果:
              </Typography>
              <Box component="pre" sx={toolCallCodeBlockStyles}>
                <code>{formatJSON(result.result)}</code>
              </Box>
            </>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

/**
 * Tool Call 状态列表组件
 */
export function ToolCallStatus({ toolCalls }: ToolCallStatusProps) {
  if (toolCalls.length === 0) {
    return null;
  }

  return (
    <Box sx={toolCallContainerStyles}>
      {toolCalls.map((toolCall) => (
        <ToolCallItemView key={toolCall.request.toolCallId} toolCall={toolCall} />
      ))}
    </Box>
  );
}
