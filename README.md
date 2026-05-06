# vibe-verse-web

React + TypeScript 管理端前端。

## 本地启动

```bash
npm install
npm run dev
```

默认通过 Vite proxy 将 `/api` 转发到 `http://localhost:8080`。如需调整后端地址，复制 `.env.example` 为 `.env` 并修改 `VITE_PROXY_TARGET`。

## 当前范围

- 登录、注册、退出
- 路由鉴权和 403 / 404
- 工作台
- 个人资料和修改密码
- 用户管理
- 角色权限
- 字典管理
