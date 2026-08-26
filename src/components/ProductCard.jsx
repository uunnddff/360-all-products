export default function ProductCard({ product, featured = false }) {
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
