// Utilities
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const money = n => (n||0).toLocaleString('vi-VN') + '₫';
function toast(msg){
  const t = $('#toast'); if (!t) return;
  t.textContent = msg || 'Đã thêm vào giỏ hàng';
  t.style.display = 'block'; t.style.opacity = 1;
  setTimeout(()=>{ t.style.transition='opacity .4s'; t.style.opacity = 0; }, 1200);
  setTimeout(()=>{ t.style.display='none'; t.style.transition='none'; }, 1700);
}


function syncPaymentUI(method){
  const formSel = document.getElementById('formPayment');
  const drawerSel = document.getElementById('drawerPayment');
  if (formSel && formSel.value !== method) formSel.value = method;
  if (drawerSel && drawerSel.value !== method) drawerSel.value = method;
  const gBank = document.getElementById('guideBANK');
  const gMomo = document.getElementById('guideMOMO');
  if (gBank && gMomo){
    gBank.style.display = (method === 'BANK') ? 'block' : 'none';
    gMomo.style.display = (method === 'MOMO') ? 'block' : 'none';
  }
}
function updateFormTotalHidden(){
  const h = document.getElementById('formTotalHidden');
  if (h) h.value = cartTotal();
  const ot = document.getElementById('orderTotal');
  if (ot) ot.textContent = money(cartTotal());
}

// --- Product data (you can edit here) ---
// status: 'sale' | 'normal' | 'soldout'
// stock: initial inventory; persisted to localStorage
const PRODUCT_DATA = [
  {id:'p1', name:'Điếu nứa bọc đồng nõ ngọc', price:400000, img:'img/logo.jpg', status:'sale', salePrice:360000, stock:8},
  {id:'p2', name:'Hộp đồng đựng thuốc lào', price:75000, img:'img/logo.jpg', status:'normal', stock:15},
  {id:'p3', name:'Điếu trúc bọc đồng hoa văn chìm', price:299000, img:'img/logo.jpg', status:'normal', stock:5},
  {id:'p4', name:'Điếu trúc 9 mắt cao cấp', price:1500000, img:'img/logo.jpg', status:'soldout', stock:0},
  {id:'p5', name:'Điếu cày bọc đồng toàn thân', price:750000, img:'img/logo.jpg', status:'sale', salePrice:690000, stock:3},
  {id:'p6', name:'Trúc rút full epoxy', price:600000, img:'img/logo.jpg', status:'soldout', stock:0}
];

// Persist inventory
function loadStock(){
  const cache = JSON.parse(localStorage.getItem('stock')||'{}');
  const stock = {};
  PRODUCT_DATA.forEach(p => {
    stock[p.id] = (cache[p.id] != null) ? cache[p.id] : p.stock;
  });
  return stock;
}
function saveStock(stock){ localStorage.setItem('stock', JSON.stringify(stock)); }

// Cart state
let cart = JSON.parse(localStorage.getItem('cart')||'[]');
function saveCart(){ localStorage.setItem('cart', JSON.stringify(cart)); }
function cartCount(){ return cart.reduce((s,i)=>s+i.qty,0); }
function cartTotal(){ return cart.reduce((s,i)=>s+i.qty*i.price,0); }

function renderProducts(){
  const stock = loadStock();
  const grid = $('#productGrid'); grid.innerHTML = '';
  PRODUCT_DATA.slice(0,4).forEach(p => grid.appendChild(makeProductCard(p, stock[p.id])));

  const featured = $('#featuredGrid'); featured.innerHTML = '';
  PRODUCT_DATA.slice(4).forEach(p => featured.appendChild(makeProductCard(p, stock[p.id])));

  // Fill form select
  const sel = $('#formProduct');
  sel.innerHTML = '<option value="">-- Chọn sản phẩm --</option>';
  PRODUCT_DATA.forEach(p => {
    const s = stock[p.id];
    if (s <= 0) return; // không cho chọn hàng hết
    const price = effectivePrice(p);
    const opt = document.createElement('option');
    opt.value = `${p.name} (${price})`;
    opt.textContent = `${p.name} - ${money(price)}`;
    sel.appendChild(opt);
  });
}

function effectivePrice(p){ return (p.status === 'sale' && p.salePrice) ? p.salePrice : p.price; }

function makeProductCard(p, stockLeft){
  const card = document.createElement('div');
  card.className = 'card product';
  const isSoldOut = stockLeft <= 0 || p.status === 'soldout';
  const priceHTML = (p.status === 'sale' && p.salePrice)
    ? `<span class="product__price"><del>${money(p.price)}</del><strong>${money(p.salePrice)}</strong></span>`
    : `<span class="product__price"><strong>${money(p.price)}</strong></span>`;

  card.innerHTML = `
    <div class="product__thumb" tabindex="0">
      ${p.status === 'sale' ? '<div class="product__badge">Flash sale</div>' : ''}
      ${isSoldOut ? '<div class="product__badge" style="background:#111827;color:#fff">Hết hàng</div>' : ''}
      <img src="${p.img}" alt="${p.name}">
    </div>
    <div class="product__body">
      <h3 class="product__title">${p.name}</h3>
      ${priceHTML}
      <div class="muted">Tồn kho: <span data-stock="${p.id}">${stockLeft}</span></div>
    </div>
    <div class="product__actions">
      ${isSoldOut ? '<button class="btn btn--small" disabled>Hết hàng</button>' :
        `<button class="btn btn--small" data-add='${JSON.stringify({id:p.id,name:p.name,price:effectivePrice(p)})}'>Mua ngay</button>`}
    </div>
  `;
  return card;
}

function renderCartBadges(){
  updateFormTotalHidden();
  updateFormTotalHidden();
  $('#cartCount').textContent = cartCount();
  $('#cartTotal').textContent = money(cartTotal());
  $('#drawerTotal').textContent = money(cartTotal());
  $('#cartEmpty').style.display = cart.length ? 'none' : 'block';
  const cont = $('#cartItems'); cont.innerHTML = '';
  cart.forEach(it=>{
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <img src="${it.img || 'img/logo.jpg'}" alt="">
      <div>
        <div><strong>${it.name}</strong></div>
        <div class="muted">x${it.qty} · ${money(it.price)}</div>
      </div>
      <div>
        <button data-dec="${it.id}" class="btn btn--small">-</button>
        <button data-inc="${it.id}" class="btn btn--small">+</button>
      </div>
    `;
    cont.appendChild(el);
  });
  // drawer items
  $('#drawerItems').innerHTML = cont.innerHTML;
}

function adjustStock(id, delta){
  const stock = loadStock();
  stock[id] = Math.max(0, (stock[id]||0) + delta);
  saveStock(stock);
  const el = document.querySelector(`[data-stock="${id}"]`);
  if (el) el.textContent = stock[id];
  if (stock[id] <= 0){
    // Disable buy button on this product
    const card = el.closest('.product');
    if (card){
      const actions = card.querySelector('.product__actions');
      if (actions){
        actions.innerHTML = '<button class="btn btn--small" disabled>Hết hàng</button>';
      }
      // add badge
      const thumb = card.querySelector('.product__thumb');
      if (thumb && !thumb.querySelector('.product__badge')){
        const badge = document.createElement('div');
        badge.className = 'product__badge';
        badge.style.background = '#111827'; badge.style.color = '#fff';
        badge.textContent = 'Hết hàng';
        thumb.appendChild(badge);
      }
    }
    // also remove from form select
    const sel = $('#formProduct');
    Array.from(sel.options).forEach(o => { if (o.value.startsWith(PRODUCT_DATA.find(p=>p.id===id).name)) o.remove(); });
  } else {
    // ensure select has it
    const p = PRODUCT_DATA.find(p=>p.id===id);
    const sel = $('#formProduct');
    const exists = Array.from(sel.options).some(o=>o.value.startsWith(p.name));
    if (!exists){
      const price = effectivePrice(p);
      const opt = document.createElement('option');
      opt.value = `${p.name} (${price})`;
      opt.textContent = `${p.name} - ${money(price)}`;
      sel.appendChild(opt);
    }
  }
}

document.addEventListener('DOMContentLoaded', function(){
  // Mobile menu
  $('#menuBtn').addEventListener('click', ()=>{
    const m = $('#mobileMenu');
    m.style.display = (m.style.display === 'flex') ? 'none' : 'flex';
  });

  // Initial render
  renderProducts();
  renderCartBadges();

  // Add to cart (delegation) with stock check
  document.body.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    const raw = btn.getAttribute('data-add');
    let data;
    try{ data = JSON.parse(raw);}catch(_){ return alert('Dữ liệu sản phẩm không hợp lệ'); }
    const stock = loadStock();
    if ((stock[data.id]||0) <= 0){ toast('Hết hàng'); return; }
    const found = cart.find(i=>i.id===data.id);
    if (found){
      if (stock[data.id] - 1 < 0){ toast('Hết hàng'); return; }
      found.qty += 1;
    } else {
      cart.push({...data, qty:1});
    }
    saveCart();
    adjustStock(data.id, -1);
    renderCartBadges();
    toast('Đã thêm vào giỏ');
    $('#cartDrawer').classList.add('open');
  });

  // Click image to add
  document.addEventListener('click', (e)=>{
    const thumb = e.target.closest('.product__thumb');
    if (!thumb) return;
    const card = thumb.closest('.product');
    const btn = card?.querySelector('[data-add]');
    if (btn) btn.click();
  });

  // +/- in cart (adjust stock back/forth)
  document.body.addEventListener('click', (e)=>{
    if (e.target.matches('[data-inc]')){
      const id = e.target.getAttribute('data-inc');
      const stock = loadStock();
      if ((stock[id]||0) <= 0){ toast('Hết hàng'); return; }
      const it = cart.find(i=>i.id===id); if (it){ it.qty+=1; saveCart(); adjustStock(id, -1); renderCartBadges(); }
    }
    if (e.target.matches('[data-dec]')){
      const id = e.target.getAttribute('data-dec');
      const it = cart.find(i=>i.id===id); if (it){ it.qty-=1; if (it.qty<=0) cart = cart.filter(x=>x.id!==id); saveCart(); adjustStock(id, +1); renderCartBadges(); }
    }
  });

  
  // Payment selectors sync
  const formPayment = document.getElementById('formPayment');
  const drawerPayment = document.getElementById('drawerPayment');
  if (formPayment){ formPayment.addEventListener('change', ()=> syncPaymentUI(formPayment.value)); }
  if (drawerPayment){ drawerPayment.addEventListener('change', ()=> syncPaymentUI(drawerPayment.value)); }
  // Initialize payment guides
  syncPaymentUI(formPayment ? formPayment.value : 'COD');
  updateFormTotalHidden();

  // Payment selectors sync
  const formPayment = document.getElementById('formPayment');
  const drawerPayment = document.getElementById('drawerPayment');
  if (formPayment){ formPayment.addEventListener('change', ()=> syncPaymentUI(formPayment.value)); }
  if (drawerPayment){ drawerPayment.addEventListener('change', ()=> syncPaymentUI(drawerPayment.value)); }
  // Initialize guides
  syncPaymentUI(formPayment ? formPayment.value : 'COD');
  updateFormTotalHidden();

  // Drawer open/close
  $('#openCart').addEventListener('click', ()=> $('#cartDrawer').classList.add('open'));
  $('#closeCart').addEventListener('click', ()=> $('#cartDrawer').classList.remove('open'));
  $('#xCart').addEventListener('click', ()=> $('#cartDrawer').classList.remove('open'));
  $('#goCheckout').addEventListener('click', ()=>{ $('#cartDrawer').classList.remove('open'); const dp = document.getElementById('drawerPayment'); if (dp) syncPaymentUI(dp.value); });

  // Clear cart (restore stock amounts)
  $('#clearCart').addEventListener('click', ()=>{
    // restore stock for all items
    cart.forEach(it => adjustStock(it.id, +it.qty));
    cart = []; saveCart(); renderCartBadges();
  });

  // Reset stock (demo/admin)
  $('#resetStock').addEventListener('click', ()=>{
    const stock = {}; PRODUCT_DATA.forEach(p => stock[p.id] = p.stock); saveStock(stock);
    renderProducts(); renderCartBadges(); toast('Đã reset tồn kho');
  });

  // Order total calculator
  function calcOrderTotal(){
    const p = $('#formProduct').value;
    const qty = parseInt($('#formQty').value||'1',10);
    let price = 0;
    PRODUCT_DATA.forEach(prod => {
      const eff = effectivePrice(prod);
      if (p.startsWith(prod.name)) price = eff;
    });
    $('#orderTotal').textContent = money(price * qty);
  }
  $('#formProduct').addEventListener('change', calcOrderTotal);
  $('#formQty').addEventListener('input', calcOrderTotal);
  calcOrderTotal();

  // Submit order via Formspree
  $('#orderForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    $('#ok').style.display='none'; $('#err').style.display='none';
    $('#submitBtn').disabled = true; $('#submitBtn').textContent = 'Đang gửi...';
    const data = new FormData($('#orderForm'));
    try{
      const res = await fetch($('#orderForm').action, { method:'POST', body:data, headers:{Accept:'application/json'} });
      if (res.ok){
        $('#orderForm').reset(); $('#ok').style.display='block';
        // Do not auto-reset stock; keep as sold
      }else{
        $('#err').style.display='block';
      }
    }catch(_){ $('#err').style.display='block'; }
    finally{ $('#submitBtn').disabled = false; $('#submitBtn').textContent = 'Gửi đơn hàng'; }
  });
});
