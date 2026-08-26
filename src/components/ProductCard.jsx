const asset = path => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

const accountingTitles = {
  'Актион Бухгалтерия. Контрагенты': 'Контрагенты',
  'Актион Бухгалтерия. Отраслевой учет': 'Отраслевой учет',
  'Актион Бухгалтерия. ИИ-трансформация. ИИ-компетенции': 'ИИ-компетенции',
  'Актион Бухгалтерия. ИИ-трансформация. БухИИ + ИИ-компетенции': 'БухИИ + ИИ-компетенции',
};

function CardCopy({ product, dark = false, displayTitle }) {
  const target = /^https?:\/\//i.test(product.resource || '') ? product.resource : '#';
  return <div className="catalog-card__copy">
    <div className="catalog-card__heading">
      <h3>{displayTitle || product.title}</h3>
      {product.price && <div className="catalog-card__price">{product.price}</div>}
    </div>
    <p className="catalog-card__description"><span className="catalog-card__lead">{product.lead}</span>{product.details && <> <span className="catalog-card__details"> {product.details}</span></>}</p>
    <a className="catalog-card__link" href={target} target={target === '#' ? undefined : '_blank'} rel={target === '#' ? undefined : 'noreferrer'}>Подробнее <span aria-hidden="true">→</span></a>
  </div>;
}

function AccountingCard({ product, variant }) {
  const displayTitle = accountingTitles[product.title] || product.title;

  if (variant === 'featured' || variant === 'monitor') {
    const image = variant === 'featured' ? 'accounting-platform.png' : 'risk-monitor.png';
    return <article className={`catalog-card catalog-card--wide catalog-card--${variant}`}>
      <div className="catalog-card__wide-media"><img src={asset(`assets/accounting-cards/${image}`)} alt="" /></div>
      <div className="catalog-card__wide-content">
        {variant === 'featured' && <span className="catalog-card__base-badge">База</span>}
        <CardCopy product={product} dark={variant === 'featured'} displayTitle={displayTitle} />
      </div>
    </article>;
  }

  if (variant === 'ai') {
    return <article className="catalog-card catalog-card--ai">
      <span className="catalog-card__ai-badge">ИИ трансформация</span>
      <CardCopy product={product} dark displayTitle={displayTitle} />
    </article>;
  }

  const isCounterparty = variant === 'counterparty';
  return <article className="catalog-card catalog-card--media">
    <div className="catalog-card__media">
      {isCounterparty
        ? <div className="risk-preview">
          <div className="risk-preview__title"><strong>ООО «Ромашка»</strong><span>63% риска</span></div>
          {['Массовый руководитель','Рентабельность низкая','Нет сотрудников'].map(item=><div className="risk-preview__row" key={item}><img src={asset('assets/accounting-cards/close.svg')} alt="" />{item}</div>)}
          <div className="risk-preview__row"><img src={asset('assets/accounting-cards/tick.svg')} alt="" />1 фактор надежности</div>
        </div>
        : <><span className="catalog-card__new">Новинка</span><img className="catalog-card__photo" src={asset('assets/accounting-cards/industry-accounting.png')} alt="" /></>}
    </div>
    <CardCopy product={product} displayTitle={displayTitle} />
  </article>;
}

export default function ProductCard({ product, featured = false, variant }) {
  if (variant) return <AccountingCard product={product} variant={variant} />;
  const isUrl = /^https?:\/\//i.test(product.resource || '');
  const titleParts = product.title.split(/(?<=\.)\s+/);
  const arrowSrc = `${import.meta.env.BASE_URL}assets/arrow.svg`;
  return <article className={`product-card${featured ? ' product-card--featured' : ''}`}>
    {product.badge && <span className={`badge badge--${product.badgeTone || 'red'}`}>{product.badge}</span>}
    <h3>{titleParts.map((part, index) => <span key={`${part}-${index}`}>{part}{index < titleParts.length - 1 && <br />}</span>)}</h3>
    {product.price && <div className="price">{product.price}</div>}
    {product.lead && <p className="lead">{product.lead}</p>}
    {product.details && <p className="details">{product.details}</p>}
    {product.audience && <p className="audience"><span>Кому</span>{product.audience}</p>}
    {product.resource && (isUrl
      ? <a className="resource-link" href={product.resource} target="_blank" rel="noreferrer">Презентация / промосайт</a>
      : <p className="resource-file"><span>Материал</span>{product.resource}</p>)}
    {product.href && <a className="card-link" href={product.href}>Подробнее <img src={arrowSrc} alt="" /></a>}
  </article>;
}
