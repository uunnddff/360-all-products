import ProductCard from './components/ProductCard';
import { useState } from 'react';
import catalog from './catalog.generated.json';

const asset = path => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

const spreadsheetCategories = [
  {label:'Бухгалтерия', icon:'accounting'},
  {label:'Финансы', icon:'finance'},
  {label:'Кадры и HR', icon:'hr'},
  {label:'Право', icon:'law'},
  {label:'Охрана труда, Промбезопасность, Экология', sheet:'ОТ, Промка, Экология', icon:'work-safety'},
  {label:'Бюджет', icon:'budget'},
  {label:'Медицина', icon:'medicine'},
  {label:'Образование', icon:'education'},
  {label:'Лидерство, продажи, маркетинг', icon:'leadership'},
  {label:'Цифровые навыки и ресурс команд', icon:'digital-skills'},
  {label:'Строительство', icon:'construction'},
  {label:'Культура', icon:'culture'}
];

function Logo(){ return <span className="brand" aria-label="Актион 360"><img src={asset('assets/logo-action-part.svg')} alt=""/><img src={asset('assets/logo-360-part.svg')} alt=""/></span> }

function Header(){ return <><div className="utility"><img src={asset('assets/action-mark.svg')} alt="Актион"/><span>Ольга Литенькова</span></div><header><div><Logo/><p>Справочно-образовательная платформа</p></div><nav><a href="#products">Вызовы 2026–2027</a><a href="#accounting">Кейсы внедрения</a><a href="#finance">ИИ-трансформация</a></nav></header></> }

function Section({name,products}){
  const id = `direction-${name.toLowerCase().replace(/[^а-яa-z0-9]+/gi,'-')}`;
  return <section className="section" id={id}><div className="section-heading"><h2>{name}</h2><p>{products.length} {products.length === 1 ? 'продукт' : products.length < 5 ? 'продукта' : 'продуктов'}</p></div><div className="cards">{products.map((product,index)=><ProductCard key={`${product.title}-${index}`} product={product}/>)}</div></section>
}

export default function App(){
  const [active, setActive] = useState(null);
  const [animationKey, setAnimationKey] = useState(0);
  const selectDirection = label => { setActive(label); setAnimationKey(key => key + 1); };
  const visibleSections = active ? catalog.filter(section => section.name === active) : catalog;
  const renderMenu = items => <div className="filters" aria-label="Направления из таблицы">{items.map(({label,sheet=label,icon})=><button key={sheet} className={active===sheet?'is-active':''} aria-pressed={active===sheet} onClick={()=>selectDirection(sheet)}>{icon && <img src={asset(`assets/excel-directions/${icon}.svg`)} alt="" />}{label}</button>)}</div>;
  return <main><Header/><section className="intro" id="products"><h1>Все продукты</h1>{renderMenu(spreadsheetCategories)}</section><div className="direction-content" key={animationKey}>{visibleSections.map(section=><Section key={section.name} {...section}/>)}</div><footer><div><Logo/><nav><a href="#products">Вызовы 2026–2027</a><a href="#products">Кейсы внедрения</a><a href="#products">ИИ-трансформация</a></nav></div><div className="legal"><span>© ООО «Актион-диджитал», ООО «Группа Актион», 2007–2026</span><span>Политика обработки персональных данных · Условия использования</span></div></footer></main>
}
