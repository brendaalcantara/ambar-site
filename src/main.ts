import "./style.css";
import { mountCandle3D } from "./candle3d";
import { mountBurnCandle3D } from "./burnCandle3d";
import { mountRitual3D } from "./ritual3d";

type Product = {
  name: string;
  mood: "acolhimento" | "leveza" | "energia" | "natureza";
  moodLabel: string;
  notes: string;
  image: string;
  imagePosition: string;
  accent: string;
  description: string;
  formats: string;
};

type Spray = {
  name: string;
  profile: string;
  image: string;
  imagePosition: string;
};

const assetUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

const WHATSAPP_NUMBER = "5573999303454";
const whatsappUrl = (product = "os produtos da Ámbar Essence") =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá! Vim pelo catálogo da Ámbar Essence e gostaria de saber mais sobre ${product}.`)}`;
const SALES_URL = whatsappUrl();

const products: Product[] = [
  {
    name: "Black Vanilla",
    mood: "acolhimento",
    moodLabel: "Acolhimento",
    notes: "Baunilha · Madeiras nobres · Âmbar",
    image: assetUrl("products/black-vanilla-candle.jpg"),
    imagePosition: "center 61%",
    accent: "#A65D45",
    description: "Marcante, quente e sofisticada. Um convite ao descanso e ao conforto.",
    formats: "Vela 100g · Home spray 200ml",
  },
  {
    name: "Chá Branco",
    mood: "leveza",
    moodLabel: "Leveza",
    notes: "Floral limpo · Musk · Folhas suaves",
    image: assetUrl("products/cha-branco-spray.jpg"),
    imagePosition: "center 55%",
    accent: "#C9A96A",
    description: "Delicada e refinada, cria uma atmosfera tranquila e elegante.",
    formats: "Vela 100g · Home spray 200ml",
  },
  {
    name: "Cereja e Avelã",
    mood: "acolhimento",
    moodLabel: "Doçura",
    notes: "Cereja · Avelã · Notas cremosas",
    image: assetUrl("products/cereja-avela-candle.jpg"),
    imagePosition: "center 64%",
    accent: "#A65D45",
    description: "Frutada e cremosa, transforma o ambiente em uma memória acolhedora.",
    formats: "Vela 100g · Home spray 200ml",
  },
  {
    name: "Capim-Limão",
    mood: "energia",
    moodLabel: "Energia",
    notes: "Cítrico · Folhas frescas · Verbena",
    image: assetUrl("products/capim-limao-candle.jpg"),
    imagePosition: "center 62%",
    accent: "#8FA06E",
    description: "Refrescante e revigorante, ideal para renovar as energias da casa.",
    formats: "Vela 100g · Home spray 200ml",
  },
  {
    name: "Bambu",
    mood: "natureza",
    moodLabel: "Equilíbrio",
    notes: "Notas verdes · Madeira clara · Orvalho",
    image: assetUrl("products/bambu-duo.jpg"),
    imagePosition: "center 58%",
    accent: "#A3B18A",
    description: "Leve e contemporânea, equilibra frescor natural e sofisticação.",
    formats: "Vela 100g · Home spray 200ml",
  },
  {
    name: "Cascas e Folhas",
    mood: "natureza",
    moodLabel: "Natureza",
    notes: "Verde · Cítrico · Amadeirado",
    image: assetUrl("products/cascas-folhas-duo.jpg"),
    imagePosition: "center 59%",
    accent: "#8A5A3B",
    description: "Verde e amadeirada, traz para dentro de casa a sensação de natureza viva.",
    formats: "Vela 100g · Home spray 200ml",
  },
  {
    name: "Lavanda Francesa",
    mood: "leveza",
    moodLabel: "Serenidade",
    notes: "Lavanda · Ervas · Flores brancas",
    image: assetUrl("products/lavanda-duo.jpg"),
    imagePosition: "center 60%",
    accent: "#8A5A3B",
    description: "Floral e serena, desacelera o ambiente e transforma a rotina em ritual.",
    formats: "Vela 100g · Home spray 200ml",
  },
];

const sprays: Spray[] = [
  { name: "Bambu", profile: "Sofisticado · Verde · Equilibrado", image: assetUrl("products/bambu-spray.jpg"), imagePosition: "center 58%" },
  { name: "Capim-Limão", profile: "Cítrico · Verde · Refrescante", image: assetUrl("products/capim-limao-spray.jpg"), imagePosition: "center 56%" },
  { name: "Cascas e Folhas", profile: "Verde · Cítrico · Amadeirado", image: assetUrl("products/cascas-folhas-spray.jpg"), imagePosition: "center 55%" },
  { name: "Cereja e Avelã", profile: "Frutal · Adocicado · Aveludado", image: assetUrl("products/cereja-avela-spray.jpg"), imagePosition: "center 54%" },
  { name: "Chá Branco", profile: "Floral · Cítrico · Musk", image: assetUrl("products/cha-branco-spray.jpg"), imagePosition: "center 55%" },
  { name: "Lavanda Francesa", profile: "Floral · Aromática · Relaxante", image: assetUrl("products/lavanda-spray.jpg"), imagePosition: "center 56%" },
  { name: "Vanilla", profile: "Envolvente · Âmbar · Notas quentes", image: assetUrl("products/vanilla-spray.jpg"), imagePosition: "center 55%" },
];

const brandLogo = `
  <span class="brand-lockup" aria-hidden="true">
    <img src="${assetUrl("brand/ambar-brandboard.jpg")}" alt="">
  </span>
`;

const flameIcon = `
  <svg class="brand-icon brand-icon--flame" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12.7 2.8c.7 3.4-2.9 5.5-2.9 9 0 2.1 1.1 3.7 2.8 4.6"/>
    <path d="M13.4 7.4c2.5 2.1 4 4.6 3.5 7.3-.5 3-2.5 5-5.3 5-3.2 0-5.6-2.3-5.6-5.7 0-2.2 1-4.2 3-6.2"/>
    <path d="M11.6 14.1c1.3 1 1.4 2.2.3 3.3"/>
  </svg>`;
const sparkIcon = `
  <svg class="brand-icon brand-icon--spark" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="2.2"/>
    <path d="M12 3.2v4M12 16.8v4M3.2 12h4M16.8 12h4M5.8 5.8l2.7 2.7M15.5 15.5l2.7 2.7"/>
  </svg>`;
const matchIcon = `
  <svg class="brand-icon brand-icon--match" viewBox="0 0 32 24" aria-hidden="true">
    <path d="M4 20 20.2 6.1"/>
    <ellipse cx="22.2" cy="4.6" rx="3.1" ry="2.5" transform="rotate(-38 22.2 4.6)"/>
    <path d="M25.5 8.4l2.2 1.2M27 4.5h2.5M24.7 11l.7 2.2"/>
  </svg>`;
const orbitIcon = `
  <svg class="brand-icon brand-icon--orbit" viewBox="0 0 28 24" aria-hidden="true">
    <path d="M4.2 13.7c2-5.8 10.9-9.2 17.3-5.9M23.8 10.3c-2 5.8-10.9 9.2-17.3 5.9"/>
    <circle cx="4" cy="14.2" r="1.4"/><circle cx="24" cy="9.8" r="1.4"/><circle cx="14" cy="12" r="2"/>
  </svg>`;
const scentIcon = `
  <svg class="brand-icon brand-icon--scent" viewBox="0 0 28 24" aria-hidden="true">
    <path d="M4 17.5c4-3 5.7 2.1 9.8-.8 3.2-2.3 5.7-1 9.8-3.8M5.5 11.2c3-2.3 5 1.2 8-.9 2.5-1.8 4.7-.9 8-3.2"/>
    <circle cx="4" cy="17.5" r="1.2"/><circle cx="5.5" cy="11.2" r="1.2"/>
  </svg>`;
const candleIcon = `
  <svg class="brand-icon brand-icon--candle" viewBox="0 0 24 28" aria-hidden="true">
    <path d="M8 13.5h8v10H8zM6 23.5h12M12 13.5v-2.2"/>
    <path d="M12 3.2c2.2 2.3 2.7 4.2 1.5 5.8-.8 1.1-2.4 1.2-3.3.2-1.4-1.5-.7-3.6 1.8-6z"/>
  </svg>`;

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <div class="site-shell">
    <section class="ritual" id="ritual" aria-label="Ritual de entrada">
      <div class="ritual-noise"></div>
      <div class="ritual-glow"></div>
      <div class="ritual-copy">
        <span class="eyebrow">Ambar Essence</span>
        <h1>Faça uma pausa.</h1>
        <p>Risque o fósforo.</p>
      </div>
      <div class="ritual-stage">
        <div class="ritual3d" id="ritual3d" role="button" tabindex="0" aria-label="Arraste o fósforo 3D até o pavio; pressione Enter ou Espaço para acender"></div>
        <div class="drag-hint"><span>arraste o fósforo até o pavio</span><i>${matchIcon}</i></div>
      </div>
      <button class="skip" id="skipIntro" type="button">Entrar sem acender <span>${sparkIcon}</span></button>
      <p class="sr-only" id="ritualStatus" aria-live="polite"></p>
    </section>

    <div class="announcement">
      <span>Feito à mão na Bahia</span>
      <span>Cera vegetal</span>
      <span>Queima limpa</span>
      <span>Aromas que transformam</span>
    </div>

    <header class="topbar">
      <a class="brand-link" href="#top" aria-label="Ambar Essence - início">${brandLogo}</a>
      <nav class="nav" aria-label="Navegação principal">
        <a href="#colecao">Velas</a>
        <a href="#home-sprays">Home sprays</a>
        <a href="#rituais">Rituais</a>
        <a href="#sobre">Nossa história</a>
      </nav>
      <div class="top-actions">
        <a class="sales-channel" href="${SALES_URL}" target="_blank" rel="noreferrer">Comprar <span>${flameIcon}</span></a>
        <button class="menu-button" aria-label="Abrir menu" aria-expanded="false">Menu</button>
      </div>
    </header>

    <main id="top">
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow accent">Velas aromáticas artesanais</p>
          <h2>A casa acesa<br>por <em>dentro.</em></h2>
          <p class="hero-text">Aromas que acolhem, despertam memórias e transformam momentos simples em experiências memoráveis.</p>
          <div class="hero-actions">
            <a class="primary-link" href="#colecao">Conhecer a coleção <span>${flameIcon}</span></a>
            <a class="quiet-link" href="#intencoes">Escolher por intenção</a>
          </div>
          <div class="hero-signatures">
            <span><b>100%</b> cera vegetal</span>
            <span><b>25–30h</b> de queima</span>
            <span><b>100g</b> feitos à mão</span>
          </div>
        </div>
        <div class="hero-art">
          <div class="hero-organic-shape"></div>
          <svg class="hero-botanical" viewBox="0 0 180 420" aria-hidden="true">
            <path d="M132 407C86 330 104 252 62 177C42 142 23 96 31 20"/>
            <path d="M76 207c-38-5-53-27-58-51M96 268c35-15 51-42 53-75M48 137c30-12 42-31 45-58"/>
            <circle cx="31" cy="20" r="8"/><circle cx="18" cy="156" r="6"/><circle cx="149" cy="193" r="7"/><circle cx="93" cy="79" r="5"/>
          </svg>
          <span class="hero-edition">Coleção 01<br><b>Presença</b></span>
          <div class="hero-candle" id="candle3d"></div>
          <div class="hero-sensory-note">
            <span>01</span>
            <p>Black Vanilla</p>
            <small>doce · ambarada · envolvente</small>
          </div>
          <span class="rotate-note">arraste para sentir<br>em todos os ângulos ${orbitIcon}</span>
        </div>
      </section>

      <section class="brand-principles" aria-label="Compromissos da marca">
        <article><span>01</span><h3>Feita lentamente</h3><p>Produção artesanal, cuidado em cada detalhe.</p></article>
        <article><span>02</span><h3>Natureza em casa</h3><p>Cera vegetal e essências premium selecionadas.</p></article>
        <article><span>03</span><h3>Presença que fica</h3><p>Frascos reutilizáveis e uma queima limpa e uniforme.</p></article>
      </section>

      <section class="intent-section" id="intencoes">
        <div class="intent-heading">
          <p class="eyebrow">Comece pelo que você sente</p>
          <h3>Qual atmosfera<br><em>você quer criar?</em></h3>
        </div>
        <div class="intent-list" id="intentList">
          <button class="intent active" data-filter="todos">Todos <span>07</span></button>
          <button class="intent" data-filter="acolhimento">Aconchego <span>02</span></button>
          <button class="intent" data-filter="leveza">Leveza <span>02</span></button>
          <button class="intent" data-filter="energia">Energia <span>01</span></button>
          <button class="intent" data-filter="natureza">Natureza <span>02</span></button>
        </div>
      </section>

      <section class="collection" id="colecao">
        <div class="section-heading">
          <div>
            <p class="eyebrow accent">Catálogo de fragrâncias</p>
            <h3>Um aroma para<br><em>cada estado de alma.</em></h3>
          </div>
          <div class="section-heading-aside">
            <span>7 aromas · 2 formatos</span>
            <p>Conheça as fragrâncias e escolha entre vela artesanal ou home spray. A compra é concluída no canal oficial da marca.</p>
          </div>
        </div>
        <div class="product-grid" id="productGrid"></div>
      </section>

      <section class="home-spray-section" id="home-sprays">
        <div class="home-spray">
          <div class="catalog-scene catalog-scene--spray">
            <img src="${assetUrl("products/collection-detail.jpg")}" alt="Coleção de velas e home sprays Ámbar Essence">
            <span class="scene-caption">7 aromas<br>para a casa</span>
          </div>
          <div class="home-spray-copy">
            <p class="eyebrow">Home spray · 200ml</p>
            <h3>O aroma chega<br><em>antes de você.</em></h3>
            <p>Para ambientes, cortinas, roupas de cama e tecidos. Uma perfumação prática e duradoura nas fragrâncias da coleção.</p>
            <ul>
              <li><span>01</span> Essências exclusivas</li>
              <li><span>02</span> Válvula de névoa fina</li>
              <li><span>03</span> Frasco reutilizável</li>
            </ul>
            <a class="primary-link primary-link--light" href="${whatsappUrl("os home sprays")}" target="_blank" rel="noreferrer">Comprar <span>${flameIcon}</span></a>
          </div>
        </div>
        <div class="spray-catalog">
          <div class="spray-catalog-heading">
            <p class="eyebrow accent">Catálogo de home sprays</p>
            <h3>Uma névoa para<br><em>cada atmosfera.</em></h3>
            <p>Todos em frascos de 200ml. Escolha o aroma e continue o atendimento pelo canal oficial da marca.</p>
          </div>
          <div class="spray-grid" id="sprayGrid"></div>
        </div>
      </section>

      <section class="special-section" id="especiais">
        <div class="special-heading">
          <p class="eyebrow">Pequenas séries</p>
          <h3>Edições <em>especiais.</em></h3>
          <p>Criações sazonais e recipientes que transformam o aroma em objeto de presença.</p>
        </div>
        <div class="special-grid">
          <article class="special-card">
            <div class="special-photo"><img src="${assetUrl("products/moscow-mule.jpg")}" alt="Vela Moscow Mule Ámbar Essence" loading="lazy"></div>
            <div class="special-info"><span>Edição especial · 150g</span><h4>Moscow Mule</h4><p>Limão siciliano e baunilha em cera de coco. Aproximadamente 30 horas de queima.</p><a href="${whatsappUrl("a vela Moscow Mule")}" target="_blank" rel="noreferrer">Comprar ${flameIcon}</a></div>
          </article>
          <article class="special-card special-card--reverse">
            <div class="special-photo"><img src="${assetUrl("products/coconut-candle.jpg")}" alt="Vela artesanal em casca de coco Ámbar Essence" loading="lazy"></div>
            <div class="special-info"><span>Edição especial · artesanal</span><h4>Vela em casca de coco</h4><p>Recipiente natural, dois pavios e uma presença tropical para composições especiais.</p><a href="${whatsappUrl("a vela em casca de coco")}" target="_blank" rel="noreferrer">Comprar ${flameIcon}</a></div>
          </article>
        </div>
      </section>

      <section class="burn-section" id="rituais">
        <div class="burn-copy">
          <p class="eyebrow accent">O tempo também é aroma</p>
          <h3>Quanto tempo<br>você tem <em>para si?</em></h3>
          <p>Deslize e veja o ritual acontecer. A chama acompanha o seu ritmo, do primeiro fósforo ao último sopro.</p>
          <div class="burn-time"><strong id="burnValue">30 min</strong><span>de presença</span></div>
        </div>
        <div class="burn-visual">
          <div class="burn-candle-wrap">
            <div class="burn-candle-3d" id="burnCandle3d"></div>
            <div class="burn-smoke" id="burnSmoke" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
          </div>
          <input id="burnSlider" type="range" min="30" max="300" step="30" value="30" aria-label="Tempo de queima demonstrado">
          <div class="slider-labels"><span>30 min</span><span>5 horas</span></div>
        </div>
      </section>

      <section class="story-section" id="sobre">
        <div class="story-copy">
          <p class="eyebrow">Nossa marca</p>
          <div class="brand-emblem">${brandLogo}</div>
          <blockquote>“Transformar momentos simples em experiências memoráveis.”</blockquote>
          <p>A Ámbar Essence nasceu da paixão pelo universo dos aromas e pelo poder que eles têm de despertar emoções. Cada produto é feito com carinho, dedicação e intenção.</p>
          <div class="story-values"><span>Artesanal</span><span>Vegetal</span><span>Reutilizável</span></div>
        </div>
        <div class="catalog-scene catalog-scene--story">
          <img src="${assetUrl("products/editorial-event.jpg")}" alt="Exposição artesanal da Ámbar Essence">
          <span class="scene-stamp">Feito com carinho<br>na Bahia</span>
        </div>
      </section>

      <section class="kit-section">
        <div class="kit-copy">
          <p class="eyebrow accent">Ámbar Experience</p>
          <h3>Um presente.<br><em>Dois rituais.</em></h3>
          <p>Combine uma vela aromática de 100g com um home spray de 200ml na fragrância que mais conversa com quem vai receber.</p>
          <div class="kit-meta"><span>Vela + Home spray</span><strong>7 aromas</strong></div>
          <a class="primary-link kit-button" href="${whatsappUrl("as combinações de kits")}" target="_blank" rel="noreferrer">Comprar <span>${flameIcon}</span></a>
        </div>
        <div class="catalog-scene catalog-scene--kit">
          <img src="${assetUrl("products/black-vanilla-duo.jpg")}" alt="Kit Black Vanilla com vela aromática e home spray">
        </div>
      </section>

      <section class="contact-section" id="contato">
        <div class="contact-heading">
          <p class="eyebrow">Faça sua encomenda</p>
          <h3>Seu aroma,<br><em>do seu jeito.</em></h3>
        </div>
        <div class="contact-panel">
          <p>Conte qual ambiente ou momento você deseja perfumar. Ajudamos a escolher a fragrância e confirmamos a disponibilidade diretamente pelo WhatsApp.</p>
          <a class="primary-link contact-button" href="${SALES_URL}" target="_blank" rel="noreferrer">Conversar pelo WhatsApp <span>${flameIcon}</span></a>
          <small>Atendimento e encomendas pelo canal oficial da marca.</small>
        </div>
      </section>
    </main>

    <footer id="footer">
      <div class="footer-brand">
        <a class="brand-link footer-brand-link" href="#top" aria-label="Ámbar Essence - voltar ao topo">${brandLogo}</a>
        <p>Velas e aromas artesanais para transformar a casa em um lugar de presença.</p>
      </div>
      <div class="footer-column"><span>Explorar</span><a href="#colecao">Velas</a><a href="#home-sprays">Home sprays</a><a href="#rituais">Rituais</a></div>
      <div class="footer-column"><span>Conversar</span><a href="${SALES_URL}" target="_blank" rel="noreferrer">Comprar pelo WhatsApp</a><a href="#contato">Atendimento</a><a href="#contato">Como comprar</a></div>
      <div class="footer-note"><span>Feito à mão na Bahia</span><strong>Presença<br>que fica.</strong></div>
      <div class="footer-bottom"><span>© 2026 Ámbar Essence</span><span>Bahia · Brasil</span><a href="#top">Voltar ao topo ${candleIcon}</a></div>
    </footer>
  </div>
`;

const productGrid = document.querySelector<HTMLDivElement>("#productGrid")!;
function renderProducts(filter = "todos") {
  const visibleProducts = products.filter((product) => filter === "todos" || product.mood === filter);
  productGrid.innerHTML = visibleProducts.map((product, index) => `
    <article class="product-card" style="--delay:${index * 70}ms;--product-accent:${product.accent};--image-position:${product.imagePosition}">
      <div class="product-visual">
        <div class="catalog-photo">
          <img src="${product.image}" alt="Vela aromática ${product.name} da Ámbar Essence" loading="lazy">
        </div>
        <div class="product-topline"><span>0${products.indexOf(product) + 1}</span><span>${product.moodLabel}</span></div>
        <a class="quick-view" href="${whatsappUrl(product.name)}" target="_blank" rel="noreferrer" aria-label="Comprar ${product.name} pelo WhatsApp">${flameIcon}</a>
      </div>
      <div class="product-info">
        <div><p class="product-mood">${product.moodLabel}</p><h4>${product.name}</h4></div>
        <strong>${product.formats}</strong>
      </div>
      <p class="notes">${product.notes}</p>
      <div class="product-foot"><span>${product.description}</span><a class="catalog-cta" href="${whatsappUrl(product.name)}" target="_blank" rel="noreferrer">Comprar ${flameIcon}</a></div>
    </article>
  `).join("");
}

const sprayGrid = document.querySelector<HTMLDivElement>("#sprayGrid")!;
sprayGrid.innerHTML = sprays.map((spray, index) => `
  <article class="spray-card" style="--spray-position:${spray.imagePosition};--delay:${index * 55}ms">
    <div class="spray-photo"><img src="${spray.image}" alt="Home spray ${spray.name} da Ámbar Essence" loading="lazy"></div>
    <span class="spray-number">${String(index + 1).padStart(2, "0")}</span>
    <div class="spray-info"><h4>${spray.name}</h4><p>${spray.profile}</p><a href="${whatsappUrl(`o home spray ${spray.name}`)}" target="_blank" rel="noreferrer">Comprar ${flameIcon}</a></div>
  </article>
`).join("");

renderProducts();
document.querySelectorAll<HTMLButtonElement>(".intent").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll(".intent").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  renderProducts(button.dataset.filter ?? "todos");
}));

const candleMount = document.querySelector<HTMLElement>("#candle3d");
let disposeHero: (() => void) | undefined;
const startHero = () => {
  if (candleMount && !disposeHero) disposeHero = mountCandle3D(candleMount);
};

const ritual = document.querySelector<HTMLElement>("#ritual")!;
let ritual3d: ReturnType<typeof mountRitual3D> | undefined;
function enterSite() {
  if (ritual.classList.contains("lit")) return;
  const from = ritual3d?.getCandleScreenPosition();
  const target = candleMount?.getBoundingClientRect();
  if (from && target) {
    ritual.style.setProperty("--ritual-slide-x", `${target.left + target.width * .5 - from.x}px`);
    ritual.style.setProperty("--ritual-slide-y", `${target.top + target.height * .54 - from.y}px`);
    ritual.style.setProperty("--ritual-slide-scale", window.matchMedia("(max-width: 760px)").matches ? ".82" : ".9");
  }
  ritual.classList.add("lit");
  localStorage.setItem("ambar-intro-seen", "true");
  window.setTimeout(() => {
    ritual3d?.dispose();
    startHero();
  }, 1200);
  window.setTimeout(() => ritual.remove(), 2050);
}

const ritual3dMount = document.querySelector<HTMLElement>("#ritual3d");
if (ritual3dMount) ritual3d = mountRitual3D(ritual3dMount, enterSite);
ritual3dMount?.addEventListener("keydown", (event) => {
  const keyEvent = event as KeyboardEvent;
  if (keyEvent.key === "Enter" || keyEvent.key === " ") {
    keyEvent.preventDefault();
    ritual3d?.ignite();
  }
});
document.querySelector("#skipIntro")!.addEventListener("click", enterSite);
const forceRitual = new URLSearchParams(window.location.search).has("ritual");
if (localStorage.getItem("ambar-intro-seen") && !forceRitual) {
  ritual3d?.dispose();
  ritual.remove();
  startHero();
}

const burnSlider = document.querySelector<HTMLInputElement>("#burnSlider")!;
const burnCandleMount = document.querySelector<HTMLElement>("#burnCandle3d")!;
const burnSmoke = document.querySelector<HTMLElement>("#burnSmoke")!;
const burnCandle3d = mountBurnCandle3D(burnCandleMount);
let burnWasExtinguished = false;
const updateBurnDemo = () => {
  const value = Number(burnSlider.value);
  const progress = (value - Number(burnSlider.min)) / (Number(burnSlider.max) - Number(burnSlider.min));
  const extinguished = progress >= .995;
  document.querySelector("#burnValue")!.textContent = value < 60 ? `${value} min` : `${value / 60} h`;
  burnCandle3d.setProgress(progress);
  if (extinguished && !burnWasExtinguished) {
    burnSmoke.classList.remove("is-active");
    void burnSmoke.offsetWidth;
    burnSmoke.classList.add("is-active");
  } else if (!extinguished) {
    burnSmoke.classList.remove("is-active");
  }
  burnWasExtinguished = extinguished;
};
burnSlider.addEventListener("input", updateBurnDemo);
updateBurnDemo();

const menuButton = document.querySelector<HTMLButtonElement>(".menu-button");
const mainNav = document.querySelector<HTMLElement>(".nav");
menuButton?.addEventListener("click", () => {
  const isOpen = mainNav?.classList.toggle("is-open") ?? false;
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.textContent = isOpen ? "Fechar" : "Menu";
});
mainNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  mainNav.classList.remove("is-open");
  menuButton?.setAttribute("aria-expanded", "false");
  if (menuButton) menuButton.textContent = "Menu";
}));
