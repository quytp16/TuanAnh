// assets/shop.js
import { db } from "./firebase-config.js";
import {
  collection, getDocs, query, orderBy, where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

function vnd(n) {
  if (n === null || n === undefined) return "";
  try { return Number(n).toLocaleString('vi-VN') + '₫'; } catch { return n + '₫'; }
}

function productCard(p) {
  const orig = p.original_price ? `<del>${vnd(p.original_price)}</del>` : "";
  const badge = p.is_sale ? `<div class="product__badge">Flash sale</div>` : "";
  const price = p.price ? vnd(p.price) : "";
  const dataAdd = JSON.stringify({id: p.id || p.slug || p._id || crypto.randomUUID(), name: p.name, price: Number(p.price||0)});
  return `
  <div class="card product">
    <div class="product__thumb" tabindex="0">
      ${badge}
      <img src="${p.image || 'img/placeholder.png'}" alt="${p.name || ''}">
    </div>
    <div class="product__body">
      <h3 class="product__title">${p.name || ''}</h3>
      <div class="product__price">${orig}<strong>${price}</strong></div>
    </div>
    <div class="product__actions">
      <button class="btn btn--small" data-add='${dataAdd}'>Mua ngay</button>
    </div>
  </div>`;
}

// category: null | 'dieucay' | 'thuoclao' | 'phukien'
async function render(container, { sale=false, category=null } = {}) {
  const listEl = container.querySelector(".products") || container.querySelector(".container .products") || container;
  listEl.innerHTML = `<p>Đang tải sản phẩm…</p>`;
  try {
    let base = collection(db, "products");
    let q = query(base, orderBy("createdAt", "desc"));
    if (sale) {
      q = query(base, where("is_sale","==", true), orderBy("createdAt", "desc"));
    } else if (category) {
      q = query(base, where("category","==", category), orderBy("createdAt", "desc"));
    }
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({id: d.id, ...d.data()}));
    if (items.length === 0) {
      listEl.innerHTML = `<p>Chưa có sản phẩm.</p>`;
      return;
    }
    listEl.innerHTML = items.map(productCard).join("");
  } catch (e) {
    console.error(e);
    listEl.innerHTML = `<p>Lỗi tải danh sách sản phẩm.</p>`;
  }
}

(function bootstrap(){
  let currentCategory = null;
  const url = new URL(window.location.href);
  const cat = (url.searchParams.get("cat") || "").toLowerCase();
  const validCats = ["dieucay","thuoclao","phukien"];
  currentCategory = validCats.includes(cat) ? cat : null;
  if (cat) {
    try { history.replaceState(null, "", location.pathname + location.hash); } catch {}
  }


  // Tabs click -> update state + re-render (no URL change)
  const tabsWrap = document.getElementById("category-tabs");
  if (tabsWrap) {
    const tabs = tabsWrap.querySelectorAll(".tab");
    const setActive = (val) => {
      tabs.forEach(b => b.classList.toggle("is-active", (b.dataset.cat||"")=== (val||""));
    };
    // init active based on currentCategory
    setActive(currentCategory||"");
    tabs.forEach(btn => {
      btn.addEventListener("click", () => {
        currentCategory = btn.dataset.cat || null;
        setActive(btn.dataset.cat||"");
        if (mainProducts) render(mainProducts, { category: currentCategory });
      });
    });
  }

  const flashSection = document.getElementById("flash-sale");
  const mainProducts = document.getElementById("products") || document.querySelector("section#products");
  if (flashSection) render(flashSection, { sale:true });
  if (mainProducts) render(mainProducts, { category: currentCategory });
})();
