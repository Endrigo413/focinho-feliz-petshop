// Focinho Feliz — lógica do front-end
// Consome a API Node/Express (/api/products, /api/services, /api/orders, /api/appointments)

const state = {
  products: [],
  services: [],
  cart: [] // { id, nome, preco, quantidade, estoque }
};

const CART_STORAGE_KEY = "focinhofeliz_cart";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.getElementById("anoAtual").textContent = new Date().getFullYear();

/* ---------------------------------------------------------
   Ícones (SVG inline, sem dependências externas)
--------------------------------------------------------- */
const categoryIcons = {
  racao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 10c0-3 3.5-6 8-6s8 3 8 6-3.5 9-8 9-8-6-8-9Z"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/></svg>',
  higiene: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 3v4M12 3v4M17 3v4"/><path d="M5 9h14l-1.2 9.5A2 2 0 0 1 15.8 20H8.2a2 2 0 0 1-2-1.5L5 9Z"/></svg>',
  brinquedo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7" cy="12" r="3.2"/><circle cx="17" cy="12" r="3.2"/><path d="M9.8 10.2 14.2 13.8M9.8 13.8 14.2 10.2"/></svg>',
  acessorio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="10" width="18" height="6" rx="3"/><circle cx="12" cy="13" r="1.4" fill="currentColor" stroke="none"/></svg>',
  petisco: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 9c-2 0-3 2-2 3.5C3 14 4 16 6 16h12c2 0 3-2 2-3.5C21 11 20 9 18 9c-1.6 0-2 1-3 1-2 0-2-2-3-2s-1 2-3 2c-1 0-1.4-1-3-1Z"/></svg>',
  saude: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7-4.35-9.5-8.8C.7 8.7 2.6 5 6.2 5c2 0 3.3 1.1 3.8 2 .5-.9 1.8-2 3.8-2 3.6 0 5.5 3.7 3.7 7.2C19 16.65 12 21 12 21Z"/></svg>'
};

const serviceIcons = {
  bath: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12h16M6 12V7a2 2 0 0 1 2-2h2M4 16c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4"/><path d="M9 5V3M12 5V3M15 5V3"/></svg>',
  scissors: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><path d="M8 7.5 20 18M8 16.5 20 6"/></svg>',
  stethoscope: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 4v6a4 4 0 0 0 8 0V4"/><path d="M10 14v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="10" r="1.6"/></svg>',
  syringe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m18 6-2-2-9 9 2 2Zm-1 3-6 6M4 20l3-3"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/></svg>',
  car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 16V11l2-5h12l2 5v5"/><path d="M4 16h16M7 16v2M17 16v2"/><circle cx="7.5" cy="16" r="1.3" fill="currentColor" stroke="none"/><circle cx="16.5" cy="16" r="1.3" fill="currentColor" stroke="none"/></svg>'
};

const currency = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ---------------------------------------------------------
   Reveal ao rolar a página (com fallback p/ reduced motion)
--------------------------------------------------------- */
let revealObserver = null;
if (!prefersReducedMotion && "IntersectionObserver" in window) {
  revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
}

function observeReveal(el) {
  if (!el) return;
  if (revealObserver) {
    revealObserver.observe(el);
  } else {
    el.classList.add("is-visible");
  }
}

/* ---------------------------------------------------------
   Toasts
--------------------------------------------------------- */
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = type === "warning" ? "toast toast--warning" : "toast";
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("toast--visible"));

  setTimeout(() => {
    toast.classList.remove("toast--visible");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    // Garantia: remove mesmo se a transição não disparar (ex.: reduced motion)
    setTimeout(() => toast.remove(), 400);
  }, 2600);
}

/* ---------------------------------------------------------
   Skeletons de carregamento
--------------------------------------------------------- */
function skeletonCards(count, variant) {
  return Array.from({ length: count })
    .map(
      () => `
      <div class="skeleton-card skeleton-card--${variant}">
        <div class="skeleton-line skeleton-line--thumb"></div>
        <div class="skeleton-line skeleton-line--title"></div>
        <div class="skeleton-line skeleton-line--text"></div>
        <div class="skeleton-line skeleton-line--text short"></div>
      </div>`
    )
    .join("");
}

/* ---------------------------------------------------------
   Produtos
--------------------------------------------------------- */
async function loadProducts() {
  const grid = document.getElementById("productGrid");
  const busca = document.getElementById("searchInput").value.trim();
  const categoria = document.getElementById("categoriaFilter").value;
  const especie = document.getElementById("especieFilter").value;

  const params = new URLSearchParams();
  if (busca) params.set("busca", busca);
  if (categoria) params.set("categoria", categoria);
  if (especie) params.set("especie", especie);

  grid.innerHTML = skeletonCards(6, "product");

  try {
    const res = await fetch(`/api/products?${params.toString()}`);
    const data = await res.json();
    state.products = data.produtos;
    renderProducts(data.produtos);
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
    grid.innerHTML = '<p class="loading">Não foi possível carregar os produtos agora.</p>';
  }
}

function renderProducts(produtos) {
  const grid = document.getElementById("productGrid");
  if (produtos.length === 0) {
    grid.innerHTML = '<p class="loading">Nenhum produto encontrado com esses filtros.</p>';
    return;
  }

  grid.innerHTML = produtos
    .map((p, index) => {
      const outOfStock = p.estoque <= 0;
      const lowStock = !outOfStock && p.estoque <= 10;
      return `
      <article class="product-card reveal" style="transition-delay:${Math.min(index, 8) * 60}ms">
        ${p.destaque ? '<span class="product-card__badge">Destaque</span>' : ""}
        <div class="product-card__thumb">${categoryIcons[p.categoria] || categoryIcons.acessorio}</div>
        <p class="product-card__tag">${labelCategoria(p.categoria)}</p>
        <h3>${p.nome}</h3>
        <p class="desc">${p.descricao}</p>
        <div class="product-card__foot">
          <span class="product-card__price">${currency(p.preco)}</span>
          <span class="product-card__stock ${outOfStock || lowStock ? "product-card__stock--low" : ""}">
            ${outOfStock ? "Esgotado" : lowStock ? `Restam ${p.estoque}` : "Em estoque"}
          </span>
        </div>
        <button class="btn btn--primary btn--small btn--block" data-add="${p.id}" ${outOfStock ? "disabled" : ""}>
          ${outOfStock ? "Esgotado" : "Adicionar ao carrinho"}
        </button>
      </article>`;
    })
    .join("");

  grid.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.dataset.add, btn));
  });

  grid.querySelectorAll(".reveal").forEach((el) => observeReveal(el));
}

function labelCategoria(cat) {
  const nomes = {
    racao: "Ração",
    higiene: "Higiene",
    brinquedo: "Brinquedo",
    acessorio: "Acessório",
    petisco: "Petisco",
    saude: "Saúde"
  };
  return nomes[cat] || cat;
}

["searchInput", "categoriaFilter", "especieFilter"].forEach((id) => {
  const el = document.getElementById(id);
  const evt = id === "searchInput" ? "input" : "change";
  let debounce;
  el.addEventListener(evt, () => {
    clearTimeout(debounce);
    debounce = setTimeout(loadProducts, 200);
  });
});

/* ---------------------------------------------------------
   Serviços
--------------------------------------------------------- */
async function loadServices() {
  const grid = document.getElementById("serviceGrid");
  grid.innerHTML = skeletonCards(4, "service");
  try {
    const res = await fetch("/api/services");
    const data = await res.json();
    state.services = data.servicos;
    renderServices(data.servicos);
  } catch (err) {
    console.error("Erro ao carregar serviços:", err);
    grid.innerHTML = '<p class="loading">Não foi possível carregar os serviços agora.</p>';
  }
}

function renderServices(servicos) {
  const grid = document.getElementById("serviceGrid");
  grid.innerHTML = servicos
    .map(
      (s, index) => `
      <article class="service-card reveal" style="transition-delay:${Math.min(index, 8) * 60}ms">
        <div class="service-card__icon">${serviceIcons[s.icone] || serviceIcons.target}</div>
        <h3>${s.nome}</h3>
        <p class="desc">${s.descricao}</p>
        <div class="service-card__meta">
          <span>${formatDuracao(s.duracaoMin)}</span>
          <span class="service-card__price">${currency(s.preco)}</span>
        </div>
        <button class="btn btn--ghost btn--small btn--block" data-book="${s.id}">Agendar</button>
      </article>`
    )
    .join("");

  grid.querySelectorAll("[data-book]").forEach((btn) => {
    btn.addEventListener("click", () => openBookingModal(btn.dataset.book));
  });

  grid.querySelectorAll(".reveal").forEach((el) => observeReveal(el));
}

function formatDuracao(min) {
  if (min >= 1440) return "Diária";
  if (min >= 60) return `${Math.round(min / 60)}h`;
  return `${min} min`;
}

/* ---------------------------------------------------------
   Carrinho
--------------------------------------------------------- */
function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
  } catch (err) {
    console.warn("Não foi possível salvar o carrinho localmente.", err);
  }
}

function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) state.cart = JSON.parse(raw);
  } catch (err) {
    console.warn("Não foi possível recuperar o carrinho salvo.", err);
    state.cart = [];
  }
}

function bumpCartIcon() {
  const toggle = document.getElementById("cartToggle");
  toggle.classList.remove("bump");
  // força reflow para poder reiniciar a animação em cliques seguidos
  void toggle.offsetWidth;
  toggle.classList.add("bump");
}

function addToCart(id, btnEl) {
  const produto = state.products.find((p) => p.id === id);
  if (!produto || produto.estoque <= 0) return;

  const item = state.cart.find((i) => i.id === id);
  if (item) {
    if (item.quantidade >= item.estoque) {
      showToast("Quantidade máxima em estoque atingida.", "warning");
      return;
    }
    item.quantidade += 1;
  } else {
    state.cart.push({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      quantidade: 1,
      estoque: produto.estoque
    });
  }

  updateCartUI();
  saveCart();
  openCart();
  bumpCartIcon();
  showToast(`${produto.nome} adicionado ao carrinho.`);

  if (btnEl) {
    const original = btnEl.textContent;
    btnEl.textContent = "Adicionado ✓";
    btnEl.classList.add("btn--added");
    setTimeout(() => {
      btnEl.textContent = original;
      btnEl.classList.remove("btn--added");
    }, 1100);
  }
}

function changeQty(id, delta) {
  const item = state.cart.find((i) => i.id === id);
  if (!item) return;
  if (delta > 0 && item.quantidade >= item.estoque) {
    showToast("Quantidade máxima em estoque atingida.", "warning");
    return;
  }
  item.quantidade += delta;
  if (item.quantidade <= 0) {
    state.cart = state.cart.filter((i) => i.id !== id);
  }
  updateCartUI();
  saveCart();
}

function removeFromCart(id) {
  state.cart = state.cart.filter((i) => i.id !== id);
  updateCartUI();
  saveCart();
}

function updateCartUI() {
  const itemsEl = document.getElementById("cartItems");
  const totalCount = state.cart.reduce((sum, i) => sum + i.quantidade, 0);
  const totalPrice = state.cart.reduce((sum, i) => sum + i.quantidade * i.preco, 0);

  document.getElementById("cartCount").textContent = totalCount;
  document.getElementById("cartTotal").textContent = currency(totalPrice);
  document.getElementById("checkoutBtn").disabled = state.cart.length === 0;

  if (state.cart.length === 0) {
    itemsEl.innerHTML = '<p class="cart-empty">Seu carrinho está vazio.</p>';
    return;
  }

  itemsEl.innerHTML = state.cart
    .map(
      (i) => `
      <div class="cart-item">
        <div class="cart-item__info">
          <strong>${i.nome}</strong>
          <span>${currency(i.preco)} cada</span>
        </div>
        <div class="cart-item__qty">
          <button data-dec="${i.id}" aria-label="Diminuir quantidade">−</button>
          <span>${i.quantidade}</span>
          <button data-inc="${i.id}" aria-label="Aumentar quantidade">+</button>
        </div>
        <button class="cart-item__remove" data-remove="${i.id}">Remover</button>
      </div>`
    )
    .join("");

  itemsEl.querySelectorAll("[data-inc]").forEach((b) => b.addEventListener("click", () => changeQty(b.dataset.inc, 1)));
  itemsEl.querySelectorAll("[data-dec]").forEach((b) => b.addEventListener("click", () => changeQty(b.dataset.dec, -1)));
  itemsEl.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => removeFromCart(b.dataset.remove)));
}

/* ---------------------------------------------------------
   Travar rolagem de fundo + foco/Esc no carrinho e modais
--------------------------------------------------------- */
function isAnyOverlayOpen() {
  return (
    document.getElementById("cartDrawer").classList.contains("open") ||
    checkoutModal.open ||
    bookingModal.open
  );
}

function refreshScrollLock() {
  document.body.classList.toggle("no-scroll", isAnyOverlayOpen());
}

let lastFocusedBeforeCart = null;

function handleCartKeydown(e) {
  // Se houver um modal (checkout/agendamento) aberto por cima do carrinho,
  // o Esc deve fechar apenas o modal (comportamento nativo do <dialog>),
  // não os dois de uma vez.
  if (checkoutModal.open || bookingModal.open) return;
  if (e.key === "Escape") closeCart();
}

function openCart() {
  lastFocusedBeforeCart = document.activeElement;
  const drawer = document.getElementById("cartDrawer");
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  drawer.setAttribute("aria-modal", "true");
  drawer.removeAttribute("inert");
  document.getElementById("overlay").classList.add("visible");
  refreshScrollLock();
  document.getElementById("cartClose").focus();
  document.addEventListener("keydown", handleCartKeydown);
}

function closeCart() {
  const drawer = document.getElementById("cartDrawer");
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  drawer.setAttribute("aria-modal", "false");
  drawer.setAttribute("inert", "");
  document.getElementById("overlay").classList.remove("visible");
  refreshScrollLock();
  document.removeEventListener("keydown", handleCartKeydown);
  if (lastFocusedBeforeCart) lastFocusedBeforeCart.focus();
}

document.getElementById("cartToggle").addEventListener("click", openCart);
document.getElementById("cartClose").addEventListener("click", closeCart);
document.getElementById("overlay").addEventListener("click", closeCart);

/* ---------------------------------------------------------
   Modais (checkout e agendamento) com animação de entrada
--------------------------------------------------------- */
const checkoutModal = document.getElementById("checkoutModal");
const bookingModal = document.getElementById("bookingModal");

function openDialog(dialog) {
  dialog.showModal();
  requestAnimationFrame(() => dialog.classList.add("modal--visible"));
  refreshScrollLock();
}

function closeDialogAnimated(dialog) {
  dialog.classList.remove("modal--visible");
  setTimeout(() => {
    if (dialog.open) dialog.close();
  }, 180);
}

[checkoutModal, bookingModal].forEach((dlg) => {
  dlg.addEventListener("close", () => {
    dlg.classList.remove("modal--visible");
    refreshScrollLock();
  });
});

document.getElementById("checkoutBtn").addEventListener("click", () => {
  if (state.cart.length === 0) return;
  document.getElementById("orderFeedback").textContent = "";
  document.getElementById("orderFeedback").className = "modal__feedback";
  openDialog(checkoutModal);
});

document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const feedback = document.getElementById("orderFeedback");
  const payload = {
    cliente: {
      nome: form.nome.value,
      telefone: form.telefone.value,
      endereco: form.endereco.value
    },
    itens: state.cart.map((i) => ({ id: i.id, quantidade: i.quantidade })),
    formaPagamento: form.pagamento.value
  };

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || "Erro ao enviar pedido.");

    feedback.textContent = `Pedido ${data.id} recebido! Entraremos em contato em instantes.`;
    feedback.className = "modal__feedback success";
    showToast("Pedido enviado com sucesso!");
    state.cart = [];
    updateCartUI();
    saveCart();
    form.reset();
    setTimeout(() => {
      closeDialogAnimated(checkoutModal);
      closeCart();
    }, 1800);
  } catch (err) {
    feedback.textContent = err.message;
    feedback.className = "modal__feedback error";
  }
});

/* ---------------------------------------------------------
   Agendamento de serviços
--------------------------------------------------------- */
function openBookingModal(servicoId) {
  const servico = state.services.find((s) => s.id === servicoId);
  if (!servico) return;
  document.getElementById("bookingTitle").textContent = `Agendar: ${servico.nome}`;
  document.getElementById("bookingServiceId").value = servicoId;
  document.getElementById("bookingFeedback").textContent = "";
  document.getElementById("bookingFeedback").className = "modal__feedback";
  openDialog(bookingModal);
}

document.getElementById("bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const feedback = document.getElementById("bookingFeedback");
  const payload = {
    cliente: { nome: form.nome.value, telefone: form.telefone.value },
    servicoId: form.servicoId.value,
    pet: { nome: form.petNome.value, especie: form.petEspecie.value },
    data: form.data.value,
    horario: form.horario.value,
    observacoes: form.observacoes.value
  };

  try {
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || "Erro ao enviar agendamento.");

    feedback.textContent = `Agendamento ${data.id} enviado! Vamos confirmar por telefone.`;
    feedback.className = "modal__feedback success";
    showToast("Agendamento enviado com sucesso!");
    form.reset();
    setTimeout(() => closeDialogAnimated(bookingModal), 1800);
  } catch (err) {
    feedback.textContent = err.message;
    feedback.className = "modal__feedback error";
  }
});

document.querySelectorAll("[data-close-modal]").forEach((btn) => {
  btn.addEventListener("click", () => closeDialogAnimated(btn.closest("dialog")));
});

// Corrige agendamentos para datas passadas: bloqueia dias já decorridos
const bookingDateInput = document.querySelector('#bookingForm input[name="data"]');
if (bookingDateInput) {
  bookingDateInput.min = new Date().toISOString().split("T")[0];
}

/* ---------------------------------------------------------
   Contador animado das estatísticas da hero
--------------------------------------------------------- */
function animateCount(el) {
  const target = parseFloat(el.dataset.countTarget);
  const decimals = parseInt(el.dataset.countDecimals || "0", 10);
  const prefix = el.dataset.countPrefix || "";
  const suffix = el.dataset.countSuffix || "";
  const duration = 1100;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = target * eased;
    el.textContent = `${prefix}${value.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function initHeroStats() {
  const statsEls = document.querySelectorAll("[data-count-target]");
  if (statsEls.length === 0) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    statsEls.forEach((el) => {
      const target = parseFloat(el.dataset.countTarget);
      const decimals = parseInt(el.dataset.countDecimals || "0", 10);
      el.textContent = `${el.dataset.countPrefix || ""}${target.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals
      })}${el.dataset.countSuffix || ""}`;
    });
    return;
  }

  const statsObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  statsEls.forEach((el) => statsObserver.observe(el));
}

/* ---------------------------------------------------------
   Botão "voltar ao topo"
--------------------------------------------------------- */
const backToTop = document.getElementById("backToTop");
if (backToTop) {
  window.addEventListener(
    "scroll",
    () => {
      backToTop.classList.toggle("visible", window.scrollY > 480);
    },
    { passive: true }
  );
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
}

/* ---------------------------------------------------------
   Inicialização
--------------------------------------------------------- */
document.querySelectorAll(".reveal").forEach((el) => observeReveal(el));
initHeroStats();
loadCartFromStorage();
updateCartUI();
loadProducts();
loadServices();
