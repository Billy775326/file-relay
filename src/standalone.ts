/**
 * 单文件入口：前端资源与后端一起构建到 dist/worker.js。
 * Pages 使用同一产物的副本 dist/pages/_worker.js。
 * 部署、绑定与清理配置见 docs/deployment.md；英文见 docs/deployment.en.md。
 */
import './inline-assets.gen';
import worker from './index';

export default worker;
