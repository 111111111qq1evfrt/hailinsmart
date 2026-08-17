# 智慧体育评测教学系统

> 基于人工智能的智慧体育评测教学平台，提供全面的学生体测管理、成绩分析、运动推荐等功能。

---

## 一、项目概述

### 1.1 项目定位

智慧体育评测教学系统是一个面向中小学体育教学场景的智能化管理平台，旨在通过 AI 技术提升体育教学质量和学生运动水平。

### 1.2 核心功能

| 模块 | 功能描述 |
|------|----------|
| **用户认证** | JWT Token 认证、角色权限管理（管理员/校领导/教师/班主任） |
| **仪表盘** | 教师工作台、校领导数据总览 |
| **体测模块** | 国家体测、体育中考、自由练习、考试终端、教学视频 |
| **评价分析** | 学生综合评价（多维 Tab）、成绩诊断、AI 点评、投票分析、作业发布 |
| **教学管理** | 教学管理、公开课管理、课堂回顾、直播回放 |
| **数据平台** | 数据总览、统计报告、可视化分析 |
| **系统管理** | 用户管理、工作流、系统设置、报表 |

---

## 二、技术栈

### 2.1 前端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.4+ | 前端框架（Composition API） |
| Element Plus | 2.6+ | UI 组件库 |
| Vite | 5.2+ | 构建工具 |
| ECharts | 5.5+ | 数据可视化 |
| Vue Router | 4.3+ | 路由管理 |
| Pinia | 3.0+ | 状态管理（含持久化插件） |
| Axios | 1.17+ | HTTP 请求 |
| video.js | 8.23+ | 视频播放器（含逐帧/热键/标记插件） |
| GSAP | 3.15+ | 动画库 |
| xlsx | 0.18+ | Excel 导入/导出 |

### 2.2 本地服务端（Node.js）

| 技术 | 版本 | 说明 |
|------|------|------|
| Express | 5.2+ | 轻量 HTTP 服务 |
| mysql2 | 3.23+ | MySQL 数据库驱动 |
| multer | 2.2+ | 文件上传处理 |
| cors | 2.8+ | 跨域支持 |

> 本地服务端 (`server/`) 承担文件上传、运动数据推送等辅助功能，支持 MySQL 数据库或纯内存模式运行。

### 2.3 后端技术（生产环境）

| 技术 | 版本 | 说明 |
|------|------|------|
| Java | 21 | 编程语言 |
| Spring Boot | 3.2.0 | 后端框架 |
| Spring Security | 6.2.0 | 安全框架 |
| MyBatis-Plus | 3.5.5 | ORM 框架 |
| MySQL | 8.0+ | 数据库 |
| Redis | 7.0+ | 缓存 |
| JWT | 0.12.5 | 认证令牌 |
| WebSocket | - | 实时通信 |

### 2.4 文件存储

| 技术 | 说明 |
|------|------|
| MinIO / OSS | 视频文件存储 |

---

## 三、快速开始

### 3.1 环境要求

- **Node.js**: 18+
- **Java**: 21+（生产后端）
- **MySQL**: 8.0+（可选，本地服务端支持无数据库运行）

### 3.2 前端启动

```bash
# 安装依赖
npm install

# 仅启动前端开发服务器
npm run dev

# 同时启动前端 + 本地服务端
npm run dev:all

# 构建生产版本
npm run build
```

### 3.3 本地服务端启动

```bash
# 初始化数据库（可选）
npm run server:init-db

# 单独启动本地服务端（端口见 server/config.js）
npm run server
```

### 3.4 生产后端启动

```bash
cd smartpe-backend/backend
mvn clean compile
mvn spring-boot:run
```

### 3.5 数据库配置

在 `backend/src/main/resources/application.yml` 中配置：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/smartpe?useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver
```

---

## 四、项目结构

### 4.1 前端结构

```
src/
├── views/                        # 页面视图
│   ├── auth/                     # 认证（登录）
│   ├── dashboard/                # 仪表盘
│   ├── profile/                  # 个人中心
│   ├── evaluation/               # 评价分析
│   │   ├── assessment/           # 评价管理（作业、投票分析）
│   │   ├── student-evaluation/   # 学生综合评价（多 Tab 拆分）
│   │   │   ├── index.vue         # Tab 容器（provide evalContext）
│   │   │   ├── components/       # 公共子组件（预留）
│   │   │   └── tabs/             # 7个 Tab 组件
│   │   │       ├── OverviewTab.vue    # 综合评价
│   │   │       ├── DiagnosisTab.vue   # 成绩诊断
│   │   │       ├── FocusTab.vue       # 专注力
│   │   │       ├── TeacherTab.vue     # 教师评分
│   │   │       ├── PortraitTab.vue    # 数字画像
│   │   │       ├── ParentTab.vue      # 家长评价
│   │   │       └── GrowthTab.vue      # 成长日志
│   │   ├── teaching/             # 教学管理（公开课、课堂回顾、直播）
│   │   ├── ai/                   # AI 点评
│   │   └── LeaderDashboard.vue   # 校领导看板
│   ├── testing/                  # 体测模块
│   │   ├── NationalTest.vue      # 国家体测
│   │   ├── SportsExam.vue        # 体育中考
│   │   ├── FreePractice.vue      # 自由练习
│   │   ├── TestTerminal.vue      # 考试终端
│   │   └── TeachingVideos.vue    # 教学视频
│   ├── data-platform/            # 数据平台
│   │   ├── overview/             # 数据总览
│   │   ├── reports/              # 统计报告
│   │   └── visualization/        # 可视化分析
│   └── system/                   # 系统管理
│       ├── user/                 # 用户管理
│       ├── workflow/             # 工作流
│       ├── settings/             # 系统设置
│       └── reports/              # 系统报表
├── components/                   # 公共组件
│   ├── charts/                   # 图表组件
│   ├── common/                   # 通用 UI 组件
│   ├── config/                   # 配置组件
│   ├── export/                   # 导出组件
│   ├── media/                    # 媒体组件
│   └── table/                    # 表格组件
├── composables/                  # 组合式函数
├── router/                       # 路由配置
├── store/                        # Pinia 状态管理
├── mock/                         # Mock 数据
├── utils/                        # 工具函数
├── styles/                       # 全局样式
├── config/                       # 前端配置
├── types/                        # TypeScript 类型声明
└── main.js                       # 应用入口
```

### 4.2 本地服务端结构

```
server/
├── controllers/      # 请求控制器
├── services/         # 业务逻辑
├── dao/              # 数据访问层
├── routes/           # 路由注册
├── middleware/       # 中间件
├── database/         # 数据库连接与初始化
├── config/           # 服务端配置
├── scripts/          # 工具脚本
├── storage/          # 本地文件存储
├── config.js         # 主配置文件
└── index.js          # 服务端入口
```

### 4.3 生产后端结构

```
backend/
├── src/main/java/com/smartpe/backend/
│   ├── controller/   # REST API 控制器
│   ├── service/      # 业务逻辑层
│   ├── repository/   # 数据访问层
│   ├── entity/       # 数据库实体
│   ├── dto/          # 请求/响应对象
│   ├── vo/           # 视图对象
│   ├── config/       # 配置类
│   └── common/       # 公共工具
└── src/main/resources/
    ├── application.yml  # 应用配置
    └── mapper/          # MyBatis 映射文件
```

---

## 五、API 接口

### 5.1 基础信息

- **本地服务端**: `http://localhost:<port>/api/sports`
- **生产后端**: `http://localhost:8080`
- **认证方式**: JWT Token（Bearer Token）
- **请求格式**: `application/json`

### 5.2 接口分类

| 模块 | 接口前缀 | 说明 |
|------|----------|------|
| 用户认证 | `/api/auth` | 登录、登出、Token 刷新 |
| 用户管理 | `/api/users` | 用户 CRUD 操作 |
| 学生管理 | `/api/students` | 学生信息管理 |
| 测试模块 | `/api/test` | 测试任务、成绩记录 |
| 运动数据 | `/api/sports` | 运动数据推送（本地服务端） |
| 文件上传 | `/api/sports/files` | 文件上传（本地服务端） |
| 智能助手 | `/api/ai/assistant` | AI 问答、运动推荐 |
| 健康检查 | `/api/health` | 服务/数据库状态检测 |

---

## 六、数据库表结构

### 6.1 核心表清单

| 模块 | 表名 | 说明 |
|------|------|------|
| 用户权限 | `sys_user`, `sys_role`, `sys_permission` | 用户、角色、权限管理 |
| 学生信息 | `student_info`, `class_info`, `grade_info` | 学生、班级、年级信息 |
| 测试模块 | `test_project`, `test_task`, `test_record` | 测试项目、任务、记录 |
| 评价分析 | `evaluation_record`, `warning_info` | 评价记录、预警信息 |
| 数据平台 | `school_statistics`, `student_statistics` | 统计数据 |

---

## 七、安全规范

### 7.1 注意事项

- 所有接口均需 JWT Token 认证
- 密码采用 BCrypt 加密存储
- 敏感数据传输使用 HTTPS
- SQL 查询使用预编译防止注入

### 7.2 角色权限

| 角色 | 权限范围 |
|------|----------|
| 超级管理员 | 全部权限 |
| 校领导 | 数据查看、统计分析 |
| 教师 | 学生管理、成绩录入、教学管理 |
| 班主任 | 班级管理、评价管理 |

---

## 八、开发规范

### 8.1 目录命名规范

- **视图目录**: kebab-case（如 `student-evaluation/`, `data-platform/`）
- **Vue 组件**: PascalCase（如 `OverviewTab.vue`, `NationalTest.vue`）
- **工具/配置**: camelCase（如 `useEvaluation.js`, `chartConfig.js`）

### 8.2 组件设计规范

- 大型页面按业务 Tab 拆分为独立组件（位于 `tabs/` 目录）
- 跨 Tab 共享状态通过 `provide('evalContext', reactive({...}))` + `inject` 传递
- 公共 UI 元素抽取至 `components/common/`

### 8.3 代码风格

- Vue 3 Composition API（`<script setup>` 语法）
- 遵循 Java 编码规范（Google Style）（后端）
- 关键逻辑添加注释说明
- 异常处理使用统一异常处理器

---

## 九、测试

```bash
# 运行单元测试
npm run test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

测试框架：**Vitest** + **@vue/test-utils** + **jsdom**

---

## 十、部署说明

### 10.1 生产环境部署

```bash
# 前端构建
npm run build
# 将 dist/ 目录部署到 Nginx

# 后端打包
cd smartpe-backend/backend
mvn clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### 10.2 Docker 部署（预留）

```yaml
# docker-compose.yml（示例）
version: '3.8'
services:
  backend:
    image: smartpe-backend:latest
    ports:
      - "8080:8080"
    depends_on:
      - mysql
      - redis
```

---

## 十一、联系方式

- **项目地址**: -
- **开发团队**: -
- **版本**: v1.0.0

---

**文档版本**: v2.0
**更新日期**: 2026-08-17
