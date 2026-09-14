/**
 * 单文件部署入口:npm run build:single 产出 dist/worker.js(整个服务 + 前端页面一个文件),
 * 粘贴到 Cloudflare 控制台编辑器即可部署,免 GitHub 连接、免 wrangler、免 Node 环境。
 * 与仓库模式共用同一套代码,仅静态资源来源不同(见 asset-resolver.ts)。
 * 控制台配套设置:Bindings 加 KV(fileKV)/可选 R2(BUCKET)、Secret ADMIN_TOKEN/可选 ADMIN_PATH、
 * Cron Trigger(每 6 小时一次,表达式见 README 方式三);vars 均有代码默认值可不设。
 */
import './inline-assets.gen';
import worker from './index';

export default worker;
