import { ActionPlanTask } from '../types';

export const INITIAL_TASKS: ActionPlanTask[] = [
  {
    id: 1,
    role: 'Dev Team',
    task: 'Міграція пікселів з theme.liquid на Web Pixels API',
    why: 'Запобігає втраті даних конверсій на новому Checkout Extensibility',
    estimate: '3–4 год'
  },
  {
    id: 2,
    role: 'Dev Team',
    task: 'Відкладене завантаження сторонніх маркетингових скриптів (defer/async)',
    why: 'Знижує Total Blocking Time (TBT) на мобільних пристроях',
    estimate: '2–3 год'
  },
  {
    id: 3,
    role: 'SEO / Content',
    task: 'Усунення дублювання H1 на головній сторінці (переведення логотипу на div/span)',
    why: 'Фокусує релевантність сторінки для пошукових ботів Google',
    estimate: '1 год'
  },
  {
    id: 4,
    role: 'Design / UX',
    task: 'Впровадження Sticky-кнопки «Додати в кошик» для мобільної картки товару',
    why: 'Збільшує мобільний CTR переходу до оформлення замовлення до +7%',
    estimate: '2 год'
  }
];
