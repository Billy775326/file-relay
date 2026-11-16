import { initTheme, responseError } from './common.js';
import { initI18n, onLangChange } from './i18n.js';
import { createSecurityFeedback } from './security-feedback.js';

initTheme(); initI18n();
document.documentElement.classList.add('ui-enhanced', 'ui-soft');
const data = JSON.parse(document.querySelector('#security-data').textContent);
const feedback = createSecurityFeedback(document.querySelector('#download-feedback'), 'download', () => location.reload());
feedback.show(responseError(data, 403));
const translate = () => {
  const en = document.documentElement.lang === 'en';
  document.title = en ? 'File download · File relay' : '文件下载 · 文件中转站';
  document.querySelector('#back-pickup').textContent = en ? 'Back to pickup' : '返回取件页';
};
onLangChange(translate); translate();
