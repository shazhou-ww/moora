/**
 * 任务面板组件
 * 
 * 展示当前进行中的顶层任务列表
 */

import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassEmptyIcon,
  PlayArrow as PlayArrowIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";

import type { TaskInfo, TaskStatus } from "@/types";

/**
 * 任务面板属性
 */
type TaskPanelProps = {
  tasks: TaskInfo[];
};

/**
 * 获取任务状态对应的图标
 */
function getStatusIcon(status: TaskStatus): JSX.Element {
  switch (status) {
    case "ready":
      return <ScheduleIcon fontSize="small" />;
    case "pending":
      return <HourglassEmptyIcon fontSize="small" />;
    case "processing":
      return <PlayArrowIcon fontSize="small" />;
    case "succeeded":
      return <CheckCircleIcon fontSize="small" />;
    case "failed":
      return <ErrorIcon fontSize="small" />;
    default:
      return <ScheduleIcon fontSize="small" />;
  }
}

/**
 * 获取任务状态对应的颜色
 */
function getStatusColor(status: TaskStatus): "default" | "primary" | "success" | "error" | "warning" {
  switch (status) {
    case "ready":
      return "default";
    case "pending":
      return "warning";
    case "processing":
      return "primary";
    case "succeeded":
      return "success";
    case "failed":
      return "error";
    default:
      return "default";
  }
}

/**
 * 获取任务状态对应的文本
 */
function getStatusText(status: TaskStatus): string {
  switch (status) {
    case "ready":
      return "就绪";
    case "pending":
      return "等待中";
    case "processing":
      return "进行中";
    case "succeeded":
      return "已完成";
    case "failed":
      return "失败";
    default:
      return status;
  }
}

/**
 * 任务面板组件
 */
export function TaskPanel({ tasks }: TaskPanelProps) {
  const ongoingTasks = tasks.filter(
    (task) => task.status !== "succeeded" && task.status !== "failed"
  );

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: 1,
        borderColor: "divider",
        backgroundColor: "background.paper",
      }}
    >
      {/* 面板标题 */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" component="h2">
          进行中的任务
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {ongoingTasks.length} 个任务
        </Typography>
      </Box>

      {/* 任务列表 */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {ongoingTasks.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              p: 3,
            }}
          >
            <Typography variant="body2" color="text.secondary" align="center">
              暂无进行中的任务
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {ongoingTasks.map((task, index) => (
              <Box key={task.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    py: 2,
                    px: 2,
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  {/* 任务标题 */}
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          mb: 0.5,
                        }}
                      >
                        {task.title}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ID: {task.id.slice(0, 8)}...
                      </Typography>
                    }
                    sx={{ m: 0, mb: 1 }}
                  />

                  {/* 任务状态 */}
                  <Chip
                    icon={getStatusIcon(task.status)}
                    label={getStatusText(task.status)}
                    color={getStatusColor(task.status)}
                    size="small"
                    sx={{
                      height: 24,
                      "& .MuiChip-icon": {
                        marginLeft: "8px",
                      },
                    }}
                  />

                  {/* 任务结果（如果有） */}
                  {task.result && (
                    <Typography
                      variant="caption"
                      color={task.result.success ? "success.main" : "error.main"}
                      sx={{
                        mt: 1,
                        display: "block",
                      }}
                    >
                      {task.result.success
                        ? `✓ ${task.result.conclusion}`
                        : `✗ ${task.result.error}`}
                    </Typography>
                  )}

                  {/* 进行中动画 */}
                  {task.status === "processing" && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mt: 1,
                        gap: 1,
                      }}
                    >
                      <CircularProgress size={16} />
                      <Typography variant="caption" color="text.secondary">
                        正在处理...
                      </Typography>
                    </Box>
                  )}
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
}
