/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_LOGIN_DEFAULT_USERNAME: string
    readonly VITE_LOGIN_DEFAULT_PASSWORD: string
    // 可以在这里继续添加其他的环境变量声明
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}