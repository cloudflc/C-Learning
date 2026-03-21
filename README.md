# C++ Learning Platform

一个有趣的C++学习平台，包含打字练习和OJ编程题目。

## 功能特性

- **打字练习**：输入代码片段，系统自动判定正确性
- **OJ题目**：标准编程题，提交代码后自动判题
- **关卡系统**：通过关卡组织练习，支持解锁条件配置
- **经验值系统**：完成练习获得经验值，累积升级
- **段位系统**：青铜、白银、黄金、铂金、钻石段位
- **排行榜**：经验值、打题数等多个排行榜
- **成就系统**：完成特定任务获得成就徽章

## 技术栈

- **后端**：Node.js + Express + MongoDB + Redis
- **前端**：React + Vite + TailwindCSS + Zustand

## 快速开始

### 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd server && npm install

# 安装前端依赖
cd ../client && npm install
```

### 配置环境

1. 确保MongoDB和Redis服务已启动
2. 修改 `server/.env` 中的配置（可选）

### 启动开发服务器

```bash
# 同时启动前后端
npm run dev
```

或分别启动：

```bash
# 启动后端 (端口5000)
cd server && npm run dev

# 启动前端 (端口3000)
cd client && npm run dev
```

### 访问

- 前端：http://localhost:3000
- 后端API：http://localhost:5000/api

## 预设账号

首次启动后可注册新账号，教师角色需后台手动修改。

## 项目结构

```
cpp-learning-platform/
├── server/                 # 后端
│   ├── src/
│   │   ├── config/        # 配置文件
│   │   ├── middleware/   # 中间件
│   │   ├── models/       # 数据模型
│   │   ├── routes/       # API路由
│   │   ├── services/     # 业务逻辑
│   │   └── jobs/        # 定时任务
│   └── package.json
├── client/                # 前端
│   ├── src/
│   │   ├── components/   # 组件
│   │   ├── pages/        # 页面
│   │   ├── services/    # API服务
│   │   └── stores/      # 状态管理
│   └── package.json
└── package.json          # 根配置
```

## API 端点

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户

### 关卡
- `GET /api/levels` - 获取所有关卡
- `GET /api/levels/:id` - 获取关卡详情
- `POST /api/levels` - 创建关卡（教师）
- `POST /api/levels/:id/start` - 开始关卡

### 打字练习
- `GET /api/typing` - 获取练习列表
- `GET /api/typing/:id` - 获取练习详情
- `POST /api/typing/:id/submit` - 提交答案
- `POST /api/typing` - 创建练习（教师）

### OJ题目
- `GET /api/oj` - 获取题目列表
- `GET /api/oj/:id` - 获取题目详情
- `POST /api/oj/:id/submit` - 提交代码
- `POST /api/oj` - 创建题目（教师）

### 排行榜
- `GET /api/ranking` - 获取排行榜

## 许可证

MIT
