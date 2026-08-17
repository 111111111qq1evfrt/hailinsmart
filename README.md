# 智慧体育评测教学系统

> 基于人工智能的智慧体育评测教学平台，提供全面的学生体测管理、成绩分析、运动推荐等功能。

---

## 一、项目概述

### 1.1 项目定位

智慧体育评测教学系统是一个面向中小学体育教学场景的智能化管理平台，旨在通过AI技术提升体育教学质量和学生运动水平。

### 1.2 核心功能

| 模块 | 功能描述 |
|------|----------|
| **用户认证** | JWT Token认证、角色权限管理 |
| **学生管理** | 学生信息管理、人脸录入、智能分班 |
| **测试模块** | 体测任务管理、成绩录入、视频关联 |
| **评价分析** | 学生评价、预警信息、资源推送 |
| **数据平台** | 数据可视化、统计分析、决策支持 |
| **智能助手** | AI问答、成绩查询、运动推荐 |
| **助手软件** | 请假申请、报修管理、作业发布 |

---

## 二、技术栈

### 2.1 前端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.4+ | 前端框架 |
| Element Plus | 2.6+ | UI组件库 |
| Vite | 5.2+ | 构建工具 |
| ECharts | 5.5+ | 数据可视化 |
| Vue Router | 4.3+ | 路由管理 |

### 2.2 后端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| Java | 21 | 编程语言 |
| Spring Boot | 3.2.0 | 后端框架 |
| Spring Security | 6.2.0 | 安全框架 |
| MyBatis-Plus | 3.5.5 | ORM框架 |
| MySQL | 8.0+ | 数据库 |
| Redis | 7.0+ | 缓存 |
| JWT | 0.12.5 | 认证令牌 |
| WebSocket | - | 实时通信 |

### 2.3 文件存储

| 技术 | 说明 |
|------|------|
| MinIO / OSS | 视频文件存储 |

---

## 三、快速开始

### 3.1 环境要求

- **Java**: 21+
- **Node.js**: 18+
- **MySQL**: 8.0+
- **Redis**: 7.0+

### 3.2 后端启动

```bash
# 进入后端目录
cd smartpe-backend/backend

# 编译项目
mvn clean compile

# 运行项目
mvn spring-boot:run
```

### 3.3 前端启动

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build
```

### 3.4 数据库配置

在 `backend/src/main/resources/application.yml` 中配置数据库连接：

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
├── views/                  # 页面视图
│   ├── Public/            # 公共页面（登录、仪表盘）
│   ├── SystemManagement/  # 系统管理
│   ├── TestModule/        # 测试模块
│   ├── Evaluation/        # 评价分析
│   └── DataPlatform/      # 数据平台
├── components/            # 公共组件
│   ├── charts/            # 图表组件
│   ├── config/            # 配置组件
│   ├── export/            # 导出组件
│   └── media/             # 媒体组件
├── router/                # 路由配置
├── utils/                 # 工具函数
└── data/                  # 模拟数据
```

### 4.2 后端结构

```
backend/
├── src/main/java/com/smartpe/backend/
│   ├── controller/        # REST API控制器
│   ├── service/           # 业务逻辑层
│   ├── repository/        # 数据访问层
│   ├── entity/            # 数据库实体
│   ├── dto/               # 请求/响应对象
│   ├── vo/                # 视图对象
│   ├── config/            # 配置类
│   └── common/            # 公共工具
└── src/main/resources/
    ├── application.yml    # 应用配置
    └── mapper/            # MyBatis映射文件
```

---

## 五、API 接口

### 5.1 基础信息

- **服务地址**: `http://localhost:8080`
- **认证方式**: JWT Token（Bearer Token）
- **请求格式**: `application/json`

### 5.2 接口分类

| 模块 | 接口前缀 | 说明 |
|------|----------|------|
| 用户认证 | `/api/auth` | 登录、登出、Token刷新 |
| 用户管理 | `/api/users` | 用户CRUD操作 |
| 学生管理 | `/api/students` | 学生信息管理 |
| 测试模块 | `/api/test` | 测试任务、成绩记录 |
| 智能助手 | `/api/ai/assistant` | AI问答、运动推荐 |

### 5.3 接口文档

完整的接口文档请参考：[API接口文档.md](API接口文档.md)

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
| 教师 | 学生管理、成绩录入 |
| 班主任 | 班级管理、评价管理 |

---

## 八、开发规范

### 8.1 命名规范

- **类名**: PascalCase（如 `UserController`）
- **方法名**: camelCase（如 `getUserById`）
- **变量名**: camelCase（如 `studentName`）
- **常量**: UPPER_SNAKE_CASE（如 `MAX_PAGE_SIZE`）
- **表名**: snake_case（如 `sys_user`）

### 8.2 代码风格

- 遵循 Java 编码规范（Google Style）
- 使用 Lombok 简化代码
- 关键逻辑添加注释说明
- 异常处理使用统一异常处理器

---

## 九、部署说明

### 9.1 生产环境部署

```bash
# 后端打包
cd smartpe-backend/backend
mvn clean package

# 运行打包后的 Jar
java -jar target/backend-0.0.1-SNAPSHOT.jar

# 前端构建
npm run build
# 将 dist 目录部署到 Nginx
```

### 9.2 Docker 部署（预留）

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

## 十、联系方式

- **项目地址**: -
- **开发团队**: -
- **版本**: v1.0.0

---

**文档版本**: v1.0  
**更新日期**: 2026-06-10