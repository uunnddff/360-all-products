import { useMemo, useRef, useState } from 'react';
import initialCatalog from './catalog.generated.json';
import './admin.css';

const STORAGE_KEY = 'action-360-admin-catalog';

const normalizeProduct = product => ({
  ...product,
  badge: product.badge || '',
  title: product.title || '',
  lead: product.lead || '',
  details: product.details || '',
  linkText: product.linkText || 'Подробнее',
  href: product.href || (/^https?:\/\//i.test(product.resource || '') ? product.resource : ''),
  image: product.image || '',
  cardSize: product.cardSize || 'half',
  cardBackground: product.cardBackground || 'light',
});

const normalizeCatalog = value => value.map(section => ({
  ...section,
  products: section.products.map(normalizeProduct),
}));

const loadCatalog = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeCatalog(JSON.parse(saved)) : normalizeCatalog(initialCatalog);
  } catch {
    return normalizeCatalog(initialCatalog);
  }
};

function Field({ label, children, wide = false }) {
  return <label className={`admin-field${wide ? ' admin-field--wide' : ''}`}><span>{label}</span>{children}</label>;
}

function CardEditor({ product, index, onChange }) {
  const set = (key, value) => onChange({ ...product, [key]: value });
  const uploadImage = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set('image', reader.result);
    reader.readAsDataURL(file);
  };

  return <article className="admin-card">
    <div className="admin-card__number">Карточка {index + 1}</div>
    <div className="admin-card__grid">
      <Field label="Бейдж"><input value={product.badge} onChange={e => set('badge', e.target.value)} placeholder="Например: Новинка" /></Field>
      <Field label="Название"><input value={product.title} onChange={e => set('title', e.target.value)} /></Field>
      <Field label="Лид" wide><textarea rows="3" value={product.lead} onChange={e => set('lead', e.target.value)} /></Field>
      <Field label="Описание" wide><textarea rows="5" value={product.details} onChange={e => set('details', e.target.value)} /></Field>
      <Field label="Текст ссылки"><input value={product.linkText} onChange={e => set('linkText', e.target.value)} /></Field>
      <Field label="URL ссылки"><input type="url" value={product.href} onChange={e => set('href', e.target.value)} placeholder="https://" /></Field>
      <Field label="Тип карточки"><select value={product.cardSize} onChange={e => set('cardSize', e.target.value)}><option value="full">Полная</option><option value="half">Половинка</option></select></Field>
      <Field label="Фон"><select value={product.cardBackground} onChange={e => set('cardBackground', e.target.value)}><option value="light">Светлый</option><option value="contrast">Контрастный</option></select></Field>
      <Field label="Картинка" wide>
        <div className="admin-image-row">
          <input value={product.image} onChange={e => set('image', e.target.value)} placeholder="URL картинки или загрузите файл" />
          <label className="admin-upload">Загрузить<input type="file" accept="image/*" onChange={uploadImage} /></label>
          {product.image && <img src={product.image} alt="Предпросмотр" />}
        </div>
      </Field>
    </div>
  </article>;
}

export default function Admin() {
  const [catalog, setCatalog] = useState(loadCatalog);
  const [activeName, setActiveName] = useState(catalog[0]?.name || '');
  const [notice, setNotice] = useState('');
  const importRef = useRef(null);
  const activeIndex = useMemo(() => Math.max(0, catalog.findIndex(section => section.name === activeName)), [catalog, activeName]);
  const section = catalog[activeIndex];

  const updateProduct = (index, product) => setCatalog(current => current.map((item, sectionIndex) => sectionIndex === activeIndex
    ? { ...item, products: item.products.map((entry, productIndex) => productIndex === index ? product : entry) }
    : item));

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
    setNotice('Черновик сохранён в этом браузере');
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'catalog.json';
    link.click();
    URL.revokeObjectURL(link.href);
    setNotice('Файл catalog.json скачан');
  };

  const importJson = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = normalizeCatalog(JSON.parse(reader.result));
        setCatalog(next);
        setActiveName(next[0]?.name || '');
        setNotice('Каталог импортирован');
      } catch { setNotice('Не удалось прочитать JSON'); }
    };
    reader.readAsText(file);
  };

  return <main className="admin-shell">
    <header className="admin-header"><div><a href="./" className="admin-back">← На лендинг</a><h1>Админка каталога</h1><p>Редактирование направлений и карточек продуктов</p></div><div className="admin-actions"><button onClick={() => importRef.current?.click()}>Импорт</button><button onClick={exportJson}>Экспорт JSON</button><button className="admin-primary" onClick={save}>Сохранить</button><input ref={importRef} hidden type="file" accept="application/json" onChange={importJson} /></div></header>
    <div className="admin-layout">
      <aside className="admin-sidebar"><h2>Направления</h2>{catalog.map(item => <button key={item.name} className={item.name === activeName ? 'is-active' : ''} onClick={() => setActiveName(item.name)}><span>{item.name}</span><small>{item.products.length}</small></button>)}</aside>
      <section className="admin-content"><div className="admin-content__head"><div><span>Направление</span><h2>{section?.name}</h2></div><strong>{section?.products.length || 0} карточек</strong></div>{notice && <div className="admin-notice">{notice}</div>}<div className="admin-cards">{section?.products.map((product, index) => <CardEditor key={`${activeName}-${index}`} product={product} index={index} onChange={value => updateProduct(index, value)} />)}</div></section>
    </div>
  </main>;
}
