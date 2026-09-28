
const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");
const header = document.querySelector(".header");
const progress = document.getElementById("scrollProgress");
const cursorGlow = document.getElementById("cursorGlow");

menuBtn?.addEventListener("click", () => {
  nav.classList.toggle("open");
  menuBtn.setAttribute("aria-label", nav.classList.contains("open") ? "Close menu" : "Open menu");
});

document.querySelectorAll(".nav a").forEach(a =>
  a.addEventListener("click", () => nav.classList.remove("open"))
);

/* Scroll effects */
function updateScrollUI() {
  const scrollTop = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const percent = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
  if (progress) progress.style.width = `${percent}%`;
  header?.classList.toggle("scrolled", scrollTop > 20);
}
window.addEventListener("scroll", updateScrollUI, { passive: true });
updateScrollUI();

/* Smooth reveal */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));


/* Interactive order tutorial */
const orderTutorial = document.getElementById("orderTutorial");
const tutorialTitle = document.getElementById("tutorialTitle");
const tutorialText = document.getElementById("tutorialText");
const tutorialIcon = document.getElementById("tutorialIcon");
const tutorialProgress = document.getElementById("tutorialProgress");
const tutorialSteps = document.getElementById("tutorialSteps");
const tutorialNext = document.getElementById("tutorialNext");
const tutorialSkip = document.getElementById("tutorialSkip");
const tutorialClose = document.getElementById("tutorialClose");
const tutorialOpenBtn = document.getElementById("openTutorial");
const openTutorialGuide = document.getElementById("openTutorialGuide");

const tutorialData = [
  { icon: "🌸", title: "Choose your bouquet", text: "Pick a bouquet size and flower style that feels right for your moment." },
  { icon: "🛒", title: "Add it to your cart", text: "Click Add to Cart on your favorite bouquet. You can add more than one." },
  { icon: "🧾", title: "Check your cart", text: "Review your bouquets, change quantities, and check the total before ordering." },
  { icon: "💌", title: "Send your order", text: "Enter your name, phone number, and delivery details, then send your order request." }
];
let tutorialIndex = 0;

function renderTutorial() {
  if (!orderTutorial) return;
  const step = tutorialData[tutorialIndex];
  tutorialIcon.textContent = step.icon;
  tutorialTitle.textContent = step.title;
  tutorialText.textContent = step.text;
  tutorialProgress.style.width = `${((tutorialIndex + 1) / tutorialData.length) * 100}%`;
  tutorialSteps.innerHTML = tutorialData.map((_, i) => `<span class="tutorial-step-dot${i === tutorialIndex ? " active" : ""}"></span>`).join("");
  tutorialNext.innerHTML = tutorialIndex === tutorialData.length - 1 ? "Start ordering <span>→</span>" : "Next <span>→</span>";
}

function closeTutorial() {
  if (!orderTutorial) return;
  orderTutorial.classList.remove("open");
  orderTutorial.setAttribute("aria-hidden", "true");
  document.body.classList.remove("tutorial-locked");
  localStorage.setItem("rosemoonOrderTutorialSeen", "1");
}

function openTutorial() {
  if (!orderTutorial) return;
  tutorialIndex = 0;
  renderTutorial();
  orderTutorial.classList.add("open");
  orderTutorial.setAttribute("aria-hidden", "false");
  document.body.classList.add("tutorial-locked");
}

tutorialNext?.addEventListener("click", () => {
  if (tutorialIndex < tutorialData.length - 1) {
    tutorialIndex += 1;
    renderTutorial();
  } else {
    closeTutorial();
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  }
});
tutorialSkip?.addEventListener("click", closeTutorial);
tutorialClose?.addEventListener("click", closeTutorial);
orderTutorial?.querySelector("[data-tutorial-close]")?.addEventListener("click", closeTutorial);
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && orderTutorial?.classList.contains("open")) closeTutorial();
  if (e.key === "Escape" && cartPanel?.classList.contains("open")) closeCart();
});

// The tutorial is optional. Visitors can open it from the navigation or the guide section.
tutorialOpenBtn?.addEventListener("click", openTutorial);
openTutorialGuide?.addEventListener("click", openTutorial);

/* Bouquet type selectors */
document.querySelectorAll(".product").forEach(card => {
  const preview = card.querySelector("[data-bouquet-preview]");
  const label = card.querySelector("[data-type-label]");
  const chooseBtn = card.querySelector(".add-btn");

  card.querySelectorAll(".type-option").forEach(option => {
    option.addEventListener("click", () => {
      card.querySelectorAll(".type-option").forEach(item => item.classList.remove("active"));
      option.classList.add("active");

      if (preview) {
        preview.animate(
          [
            { opacity: .2, transform: "scale(.72) rotate(-10deg)" },
            { opacity: 1, transform: "scale(1.16) rotate(4deg)" },
            { opacity: 1, transform: "" }
          ],
          { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" }
        );
        preview.textContent = option.dataset.emoji;
      }

      if (label) {
        label.textContent = option.dataset.type;
        label.animate(
          [{ opacity: .3, transform: "translateX(-50%) translateY(5px)" },
           { opacity: 1, transform: "translateX(-50%) translateY(0)" }],
          { duration: 260, easing: "ease-out" }
        );
      }

      if (chooseBtn) {
        chooseBtn.dataset.product =
          `${card.dataset.size} Bouquet — ${card.dataset.price} · ${option.dataset.type}`;
      }
    });
  });
});


/* ROSEMOON INVENTORY + CART */
// For real shared inventory, paste your deployed Google Apps Script Web App URL here.
// If left blank, the site uses local browser storage as a fallback.
const API_URL = "https://script.google.com/macros/s/AKfycbw3ovS6hIwHLhp50Xrs-6ejMxZkI_q-AhB-Mz6JXbsIRKSphJcMoqBELVY4nUogRR__/exec";
const STOCK_KEY = "rosemoonInventoryV2";
const ORDER_KEY = "rosemoonLastOrder";

const defaultInventory = {
  "Small": { name: "Small Bouquet", stock: 8, price: 500 },
  "Medium": { name: "Medium Bouquet", stock: 5, price: 800 },
  "Large": { name: "Large Bouquet", stock: 3, price: 1500 },
  "Flower Basket": { name: "Flower Basket", stock: 6, price: 1800 }
};

let inventory = loadLocalInventory();
const cart = [];
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const headerCartCount = document.getElementById("headerCartCount");
const cartPanel = document.getElementById("cartPanel");
const cartBackdrop = document.getElementById("cartBackdrop");
const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCart");
const cartToast = document.getElementById("cartToast");
const clearCartBtn = document.getElementById("clearCart");

function cloneInventory(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadLocalInventory() {
  try {
    const saved = JSON.parse(localStorage.getItem(STOCK_KEY) || "null");
    return saved && typeof saved === "object" ? { ...cloneInventory(defaultInventory), ...saved } : cloneInventory(defaultInventory);
  } catch {
    return cloneInventory(defaultInventory);
  }
}

function saveLocalInventory() {
  localStorage.setItem(STOCK_KEY, JSON.stringify(inventory));
}

function getStock(size) {
  return Math.max(0, Number(inventory[size]?.stock ?? 0));
}

function updateProductStock(card) {
  if (!card) return;
  const size = card.dataset.size;
  const stock = getStock(size);
  const display = card.querySelector("[data-stock-display]");
  const button = card.querySelector(".add-btn");
  if (display) {
    display.className = "stock-status " + (stock === 0 ? "stock-out" : stock <= 2 ? "stock-low" : "stock-good");
    display.textContent = stock === 0 ? "🔴 Sold out" : stock === 1 ? "🔥 Last one" : stock <= 2 ? `🟡 Only ${stock} left` : `🟢 ${stock} in stock`;
  }
  if (button) {
    button.disabled = stock === 0;
    button.classList.toggle("sold-out", stock === 0);
    button.innerHTML = stock === 0 ? "Sold out" : "🛒 Add to cart <span>+</span>";
  }
}

function refreshAllStockUI() {
  document.querySelectorAll(".product[data-size]").forEach(updateProductStock);
  document.querySelectorAll("[data-product-stock]").forEach(el => {
    const size = el.dataset.productStock;
    const stock = getStock(size);
    el.className = "stock-status " + (stock === 0 ? "stock-out" : stock <= 2 ? "stock-low" : "stock-good");
    el.textContent = stock === 0 ? "🔴 Sold out" : stock === 1 ? "🔥 Last one" : `🟢 ${stock} in stock`;
  });
}

function money(value) {
  return `Rs. ${Number(value).toLocaleString("en-IN")}`;
}

function parsePrice(text) {
  const match = String(text).match(/Rs\.\s*([\d,]+)/i);
  return match ? Number(match[1].replace(/,/g, "")) : 0;
}

function openCart() {
  if (!cartPanel) return;
  cartPanel.classList.add("open");
  cartPanel.setAttribute("aria-hidden", "false");
  cartBackdrop?.classList.add("open");
  openCartBtn?.setAttribute("aria-expanded", "true");
  document.body.classList.add("cart-locked");
}
function closeCart() {
  if (!cartPanel) return;
  cartPanel.classList.remove("open");
  cartPanel.setAttribute("aria-hidden", "true");
  cartBackdrop?.classList.remove("open");
  openCartBtn?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("cart-locked");
}
openCartBtn?.addEventListener("click", openCart);
closeCartBtn?.addEventListener("click", closeCart);
cartBackdrop?.addEventListener("click", closeCart);

function showCartToast(item) {
  if (!cartToast) return;
  cartToast.innerHTML = `<span class="toast-icon">${item.emoji}</span><span><strong>Added to cart</strong><small>${item.size} · ${item.type}</small></span><button type="button" data-toast-cart>View cart</button>`;
  cartToast.classList.remove("show");
  void cartToast.offsetWidth;
  cartToast.classList.add("show");
  clearTimeout(showCartToast.timer);
  showCartToast.timer = setTimeout(() => cartToast.classList.remove("show"), 3600);
}
cartToast?.addEventListener("click", e => {
  if (e.target.closest("[data-toast-cart]")) {
    openCart();
    cartToast.classList.remove("show");
  }
});

function flyToCart(btn, emoji) {
  if (!openCartBtn || !btn) return;
  const start = btn.getBoundingClientRect();
  const end = openCartBtn.getBoundingClientRect();
  const flyer = document.createElement("span");
  flyer.className = "cart-flyer";
  flyer.textContent = emoji;
  flyer.style.left = `${start.left + start.width / 2}px`;
  flyer.style.top = `${start.top + start.height / 2}px`;
  document.body.appendChild(flyer);
  const dx = end.left + end.width / 2 - (start.left + start.width / 2);
  const dy = end.top + end.height / 2 - (start.top + start.height / 2);
  flyer.animate([
    { opacity: 1, transform: "translate(-50%, -50%) scale(1) rotate(0deg)" },
    { opacity: 1, transform: `translate(calc(-50% + ${dx * .45}px), calc(-50% + ${dy * .45 - 70}px)) scale(1.25) rotate(10deg)`, offset: .45 },
    { opacity: .15, transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.25) rotate(25deg)` }
  ], { duration: 650, easing: "cubic-bezier(.2,.75,.25,1)" }).onfinish = () => flyer.remove();
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (headerCartCount) headerCartCount.textContent = count;
  if (cartTotal) cartTotal.textContent = money(total);
  cartPanel?.classList.toggle("has-items", cart.length > 0);
  if (!cartItems) return;
  if (!cart.length) {
    cartItems.innerHTML = '<p class="cart-empty">Your cart is empty. Add a flower or gift to get started. 🌷</p>';
    return;
  }
  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <div class="cart-item-icon">${item.emoji}</div>
      <div class="cart-item-info"><strong>${item.size === "Flower Basket" ? "Flower Basket" : item.size + " Bouquet"}</strong><small>${item.type} · ${money(item.price)}</small></div>
      <div class="cart-item-controls">
        <button type="button" data-cart-action="minus" data-cart-index="${index}" aria-label="Decrease quantity">−</button>
        <b>${item.qty}</b>
        <button type="button" data-cart-action="plus" data-cart-index="${index}" aria-label="Increase quantity">+</button>
      </div>
      <button type="button" class="cart-remove" data-cart-action="remove" data-cart-index="${index}" aria-label="Remove item">×</button>
    </div>`).join("");
}

function addToCart(btn) {
  const card = btn.closest(".product");
  if (!card) return;
  const size = card.dataset.size;
  const stock = getStock(size);
  const active = card.querySelector(".type-option.active");
  const type = active?.dataset.type || (size === "Flower Basket" ? "Flower Basket" : "Classic Rose");
  const emoji = active?.dataset.emoji || (size === "Flower Basket" ? "🧺🌸" : "🌹");
  const existing = cart.find(item => item.size === size && item.type === type);
  const currentQty = existing?.qty || 0;
  if (currentQty >= stock) {
    showCartToast({ emoji: "⚠️", size, type });
    if (cartToast) cartToast.querySelector("strong").textContent = "Stock limit reached";
    return;
  }
  const price = Number(inventory[size]?.price || parsePrice(card.dataset.price));
  if (existing) existing.qty += 1;
  else cart.push({ size, price, type, emoji, qty: 1 });
  renderCart();
  showCartToast(existing || cart[cart.length - 1]);
  flyToCart(btn, emoji);
  btn.classList.add("added");
  btn.innerHTML = "✓ Added <span>+</span>";
  setTimeout(() => { if (getStock(size) > 0) { btn.classList.remove("added"); btn.innerHTML = "🛒 Add to cart <span>+</span>"; } }, 900);
}

document.querySelectorAll(".add-btn").forEach(btn => btn.addEventListener("click", () => addToCart(btn)));

cartItems?.addEventListener("click", e => {
  const button = e.target.closest("[data-cart-action]");
  if (!button) return;
  const index = Number(button.dataset.cartIndex);
  const action = button.dataset.cartAction;
  const item = cart[index];
  if (!item) return;
  const available = getStock(item.size);
  if (action === "plus") {
    if (item.qty < available) item.qty += 1;
    else {
      showCartToast({ emoji: "⚠️", size: item.size, type: item.type });
      if (cartToast) cartToast.querySelector("strong").textContent = "No more stock available";
    }
  }
  if (action === "minus") item.qty -= 1;
  if (action === "remove" || item.qty <= 0) cart.splice(index, 1);
  renderCart();
});

clearCartBtn?.addEventListener("click", () => { cart.length = 0; renderCart(); });
renderCart();

async function syncInventoryFromServer() {
  if (!API_URL || API_URL.includes("PASTE_YOUR")) return;

  try {
    const response = await fetch(`${API_URL}?action=inventory`, {
      cache: "no-store"
    });

    const data = await response.json();

    if (data.success && Array.isArray(data.inventory)) {
      const nextInventory = cloneInventory(defaultInventory);

      const idToSize = {
        small: "Small",
        medium: "Medium",
        large: "Large",
        "flower-basket": "Flower Basket"
      };

      data.inventory.forEach(item => {
        const size = idToSize[String(item.id)];
        if (!size) return;

        nextInventory[size] = {
          name: String(item.product),
          stock: Number(item.stock),
          price: Number(item.price)
        };
      });

      inventory = nextInventory;
      saveLocalInventory();
      refreshAllStockUI();
    }
  } catch (error) {
    console.warn("Rosemoon inventory sync unavailable; using local fallback.", error);
  }
}

async function submitOrderToServer(order) {
  if (!API_URL || API_URL.includes("PASTE_YOUR")) return { ok: true, localOnly: true };
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "placeOrder", ...order })
  });
  return response.json();
}

/* Confirm order + deduct inventory only after order is accepted */
document.getElementById("orderForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const note = document.getElementById("note").value.trim();
  const payment = document.getElementById("payment")?.value || "";
  const formNote = document.getElementById("formNote");
  if (!cart.length) {
    if (formNote) { formNote.textContent = "Please add at least one item to your cart first."; formNote.classList.add("form-error"); }
    return;
  }
  if (!payment) {
    if (formNote) { formNote.textContent = "Please choose a payment method."; formNote.classList.add("form-error"); }
    return;
  }
  for (const item of cart) {
    if (item.qty > getStock(item.size)) {
      if (formNote) { formNote.textContent = `${item.size} no longer has enough stock. Please update your cart.`; formNote.classList.add("form-error"); }
      await syncInventoryFromServer();
      renderCart();
      return;
    }
  }
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const idMap = {
    "Small": "small",
    "Medium": "medium",
    "Large": "large",
    "Flower Basket": "flower-basket"
  };

  const items = cart.map(item => ({
    id: idMap[item.size],
    product: item.size === "Flower Basket"
      ? "Flower Basket"
      : `${item.size} Bouquet`,
    type: item.type,
    quantity: item.qty,
    price: item.price
  }));

  const order = {
    customer: name,
    phone: phone,
    delivery: note,
    payment: payment,
    items: items
  };
  const button = e.target.querySelector('button[type="submit"]');
  if (button) { button.disabled = true; button.innerHTML = "Processing order…"; }
  try {
    const result = await submitOrderToServer(order);
    if (!result.success) throw new Error(result.error || "Order could not be accepted.");
    // Local fallback: persist stock only when the API is not configured.
    if (result.localOnly) {
      for (const item of items) {
        const size = Object.keys(idMap).find(key => idMap[key] === item.id);
        if (size) {
          inventory[size].stock = Math.max(0, getStock(size) - item.quantity);
        }
      }
      saveLocalInventory();
    } else {
      // The server has already deducted stock safely.
      // Re-read the shared inventory so the website shows the new stock.
      await syncInventoryFromServer();
    }
    refreshAllStockUI();
    const orderId = result.orderId || `RM-${Date.now().toString().slice(-6)}`;
    localStorage.setItem(ORDER_KEY, JSON.stringify({ orderId, ...order }));
    if (formNote) {
      formNote.classList.remove("form-error");
      formNote.innerHTML = `✅ <strong>Order ${orderId} received.</strong><br>${items.map(i => `${i.qty}× ${i.name} (${i.type})`).join(", ")} · ${money(total)}<br>Payment: ${payment}. We'll contact you at ${phone}.`;
    }
    cart.length = 0;
    renderCart();
  } catch (error) {
    console.error(error);
    if (formNote) { formNote.textContent = "We couldn't confirm the order yet. Please try again."; formNote.classList.add("form-error"); }
  } finally {
    if (button) { button.disabled = false; button.innerHTML = "💌 Place order <span>↗</span>"; }
  }
});

syncInventoryFromServer();
refreshAllStockUI();

// Keep the website inventory in sync with the shared Google Sheet.
setInterval(syncInventoryFromServer, 30000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) syncInventoryFromServer();
});

/* Occasion shortcuts */
document.querySelectorAll(".occasion-grid button").forEach(btn => {
  btn.addEventListener("click", () => {
    const select = document.getElementById("bouquet");
    if (select) select.value = "Custom bouquet";
    const note = document.getElementById("note");
    if (note) note.value = btn.dataset.message + " — please suggest a beautiful arrangement.";
    document.getElementById("order")?.scrollIntoView({ behavior: "smooth" });
  });
});

/* Gentle 3D tilt on desktop product cards */
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
if (canHover) {
  document.querySelectorAll(".product").forEach(card => {
    card.addEventListener("pointermove", e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform =
        `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-8px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });

  window.addEventListener("pointermove", e => {
    if (!cursorGlow) return;
    cursorGlow.style.left = `${e.clientX}px`;
    cursorGlow.style.top = `${e.clientY}px`;
    cursorGlow.style.opacity = "1";
  });
  document.addEventListener("mouseleave", () => {
    if (cursorGlow) cursorGlow.style.opacity = "0";
  });
}

/* Add a tiny click sparkle effect to primary buttons */
document.querySelectorAll(".primary").forEach(button => {
  button.addEventListener("click", e => {
    const sparkle = document.createElement("span");
    sparkle.textContent = "✦";
    sparkle.style.position = "fixed";
    sparkle.style.left = `${e.clientX}px`;
    sparkle.style.top = `${e.clientY}px`;
    sparkle.style.pointerEvents = "none";
    sparkle.style.zIndex = "999";
    sparkle.style.color = "#e2a4b1";
    sparkle.style.fontSize = "14px";
    document.body.appendChild(sparkle);
    sparkle.animate(
      [
        { opacity: 1, transform: "translate(-50%,-50%) scale(.5) rotate(0deg)" },
        { opacity: 0, transform: "translate(-50%,-95px) scale(1.5) rotate(120deg)" }
      ],
      { duration: 700, easing: "cubic-bezier(.2,.8,.2,1)" }
    ).onfinish = () => sparkle.remove();
  });
});


/* Guide CTA */
document.querySelectorAll("[data-guide-scroll]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelector(button.dataset.guideScroll)?.scrollIntoView({ behavior: "smooth" });
  });
});


/* ROSEMOON voice guide — normal female browser voice */
const voiceGuide = document.getElementById("voiceGuide");

if (voiceGuide && "speechSynthesis" in window) {
  const synth = window.speechSynthesis;
  let availableVoices = [];

  function loadVoices() {
    availableVoices = synth.getVoices();
  }

  loadVoices();
  if ("onvoiceschanged" in synth) synth.onvoiceschanged = loadVoices;

  function getFemaleVoice() {
    const voices = availableVoices.length ? availableVoices : synth.getVoices();
    const english = voices.filter(v => /^en(-|$)/i.test(v.lang));

    // Prefer well-known female English voices when the device/browser provides them.
    const femalePatterns = [
      /google us english female/i,
      /google uk english female/i,
      /microsoft.*(jenny|aria|sara|samantha|zira|libby|sonia|hazel)/i,
      /apple.*(samantha|ava|allison|victoria|karen|susan|moira|fiona)/i,
      /samantha|victoria|karen|moira|fiona|ava|allison|susan|zira|aria|jenny|libby|sonia|hazel/i
    ];

    for (const pattern of femalePatterns) {
      const match = english.find(v => pattern.test(v.name));
      if (match) return match;
    }

    // Prefer common English regional voices rather than a random non-English voice.
    return english.find(v => /^en-US/i.test(v.lang)) ||
           english.find(v => /^en-GB/i.test(v.lang)) ||
           english.find(v => /^en-IN/i.test(v.lang)) ||
           english[0] || voices[0];
  }

  voiceGuide.addEventListener("click", () => {
    if (synth.speaking) {
      synth.cancel();
      voiceGuide.classList.remove("speaking");
      voiceGuide.querySelector("span").textContent = "Listen to Guide";
      return;
    }

    const guideText =
      "Welcome to Rosemoon. " +
      "First, choose your bouquet size. " +
      "Small is five hundred rupees, medium is eight hundred rupees, and large is one thousand five hundred rupees. " +
      "Next, choose your bouquet style: Classic Rose, Pastel Mix, Daisy Love, or Heart Style. " +
      "Finally, enter your name, phone number, delivery details and payment method. " +
      "Place your order and Rosemoon will confirm it. Thank you.";

    const speech = new SpeechSynthesisUtterance(guideText);
    speech.lang = "en-US";
    speech.rate = 0.88;
    speech.pitch = 1.08;
    speech.volume = 1;

    const femaleVoice = getFemaleVoice();
    if (femaleVoice) speech.voice = femaleVoice;

    speech.onstart = () => {
      voiceGuide.classList.add("speaking");
      voiceGuide.querySelector("span").textContent = "Stop Guide";
    };
    speech.onend = () => {
      voiceGuide.classList.remove("speaking");
      voiceGuide.querySelector("span").textContent = "Listen to Guide";
    };
    speech.onerror = () => {
      voiceGuide.classList.remove("speaking");
      voiceGuide.querySelector("span").textContent = "Listen to Guide";
    };

    synth.speak(speech);
  });
} else if (voiceGuide) {
  voiceGuide.addEventListener("click", () => {
    voiceGuide.querySelector("span").textContent = "Voice not supported";
  });
}

document.querySelectorAll("[data-social-placeholder]").forEach(link => {
  link.addEventListener("click", e => e.preventDefault());
});
