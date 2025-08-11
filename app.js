
document.addEventListener('DOMContentLoaded', function(){ 
try{ 
// Tiny util
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const money = n => (n||0).toLocaleString('vi-VN') + '₫';

// Mobile menu
$('#menuBtn').addEventListener('click', ()=>{
  const m = $('#mobileMenu');
  m.style.display = (m.style.display === 'flex') ? 'none' : 'flex';
});

// Cart state
let cart = JSON.parse(localStorage.getItem('cart')||'[]');
function saveCart(){ localStorage.setItem('cart', JSON.stringify(cart)); }
function cartCount(){ return cart.reduce((s,i)=>s+i.qty,0); }
function cartTotal(){ return cart.reduce((s,i)=>s+i.qty*i.price,0); }

function renderCartBadges(){
  $('#cartCount').textContent = cartCount();
  $('#cartTotal').textContent = money(cartTotal());
  $('#drawerTotal').textContent = money(cartTotal());
  $('#cartEmpty').style.display = cart.length ? 'none' : 'block';
  const cont = $('#cartItems');
  cont.innerHTML = '';
  cart.forEach(it=>{
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = \`
      <img src="img/\${it.img||'p1.jpg'}" alt="">
      <div>
        <div><strong>\${it.name}</strong></div>
        <div class="muted">x\${it.qty} · \${money(it.price)}</div>
      </div>
      <div>
        <button data-dec="\${it.id}" class="btn btn--small">-</button>
        <button data-inc="\${it.id}" class="btn btn--small">+</button>
      </div>
    \`;
    cont.appendChild(el);
  });
  // drawer items
  const d = $('#drawerItems');
  d.innerHTML = cont.innerHTML;
}

// Toast helper
function toast(msg){
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg || 'Đã thêm vào giỏ hàng';
  t.style.display = 'block'; t.style.opacity = 1;
  setTimeout(()=>{ t.style.transition='opacity .4s'; t.style.opacity = 0; }, 1200);
  setTimeout(()=>{ t.style.display='none'; t.style.transition='none'; }, 1700);
}

// Add to cart buttons
$$('[data-add]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const data = JSON.parse(btn.getAttribute('data-add'));
    const ex = cart.find(i=>i.id===data.id);
    if (ex) ex.qty += 1; else cart.push({...data, qty:1});
    saveCart(); renderCartBadges();
    // open drawer
    $('#cartDrawer').classList.add('open');
  });
});

// Cart +/-
document.body.addEventListener('click', (e)=>{
  if (e.target.matches('[data-inc]')){
    const id = e.target.getAttribute('data-inc');
    const it = cart.find(i=>i.id===id); if (it){ it.qty+=1; saveCart(); renderCartBadges(); }
  }
  if (e.target.matches('[data-dec]')){
    const id = e.target.getAttribute('data-dec');
    const it = cart.find(i=>i.id===id); if (it){ it.qty-=1; if (it.qty<=0) cart = cart.filter(x=>x.id!==id); saveCart(); renderCartBadges(); }
  }
});

// Drawer open/close
$('#openCart').addEventListener('click', ()=> $('#cartDrawer').classList.add('open'));
$('#closeCart').addEventListener('click', ()=> $('#cartDrawer').classList.remove('open'));
$('#xCart').addEventListener('click', ()=> $('#cartDrawer').classList.remove('open'));
$('#goCheckout').addEventListener('click', ()=> $('#cartDrawer').classList.remove('open'));

// Order total calculator (based on select+qty from form)
const priceMap = {
  'Điếu nứa bọc đồng nõ ngọc (400000)': 400000,
  'Hộp đồng đựng thuốc lào (75000)': 75000,
  'Điếu trúc bọc đồng hoa văn chìm (299000)': 299000,
  'Điếu trúc 9 mắt cao cấp (1500000)': 1500000,
  'Điếu cày bọc đồng toàn thân (750000)': 750000,
  'Điếu gỗ mun đục rồng (1100000)': 1100000,
  'Trúc rút full epoxy (600000)': 600000
};

function calcOrderTotal(){
  const p = $('#formProduct').value;
  const q = parseInt($('#formQty').value||'1',10);
  const t = (priceMap[p]||0) * q;
  $('#orderTotal').textContent = money(t);
}
$('#formProduct').addEventListener('change', calcOrderTotal);
$('#formQty').addEventListener('input', calcOrderTotal);
calcOrderTotal();

// Push selected item from drawer to form
$('#goCheckout').addEventListener('click', ()=>{
  if (!cart.length) return;
  const first = cart[0];
  const key = Object.keys(priceMap).find(k => k.startsWith(first.name));
  if (key){ $('#formProduct').value = key; $('#formQty').value = first.qty; calcOrderTotal(); }
  window.location.hash = '#order';
});

// Clear cart
$('#clearCart').addEventListener('click', ()=>{
  cart = []; saveCart(); renderCartBadges();
});

// Form submit via Formspree
$('#orderForm').addEventListener('submit', async (e)=>{
  if ($('#orderForm').action === 'FORM_ENDPOINT'){
    e.preventDefault();
    alert('Vui lòng thay FORM_ENDPOINT bằng endpoint Formspree của bạn (ví dụ: https://formspree.io/f/xxxxxxx).');
    return;
  }
  e.preventDefault();
  $('#ok').style.display='none'; $('#err').style.display='none';
  $('#submitBtn').disabled = true; $('#submitBtn').textContent = 'Đang gửi...';
  const data = new FormData($('#orderForm'));
  try{
    const res = await fetch($('#orderForm').action, { method:'POST', body:data, headers:{Accept:'application/json'} });
    if (res.ok){
      $('#orderForm').reset(); calcOrderTotal(); $('#ok').style.display='block';
      cart = []; saveCart(); renderCartBadges();
    }else{
      $('#err').style.display='block';
    }
  }catch(_){
    $('#err').style.display='block';
  }finally{
    $('#submitBtn').disabled = false; $('#submitBtn').textContent = 'Gửi đơn hàng';
  }
});

// Init
renderCartBadges();


// Robust delegated click for [data-add] (handles quotes/&quot; cases)
document.body.addEventListener('click', function(e){
  const btn = e.target.closest('[data-add]');
  if (!btn) return;
  try{
    const raw = btn.getAttribute('data-add');
    const fixed = raw.replace(/&quot;/g, '"').replace(/\'(?=\w|\d|\s)/g, '"');
    let data; try{ data = JSON.parse(raw); }catch(_){
      data = JSON.parse(fixed);
    }
    if (!data || !data.id) return;
    const found = cart.find(i=>i.id===data.id);
    if (found) found.qty += 1; else cart.push({...data, qty:1});
    saveCart(); renderCartBadges();
    if (typeof toast==='function') toast('Đã thêm vào giỏ');
    document.getElementById('cartDrawer')?.classList.add('open');
  }catch(err){
    console.error('Add-to-cart error:', err);
  }
});

// Click on product image behaves like buy button
document.addEventListener('click', function(e){
  const thumb = e.target.closest('.product__thumb');
  if (!thumb) return;
  const card = thumb.closest('.product');
  if (!card) return;
  const btn = card.querySelector('[data-add]');
  if (btn) btn.click();
});

// Keyboard support on images
document.addEventListener('keydown', function(e){
  if (!['Enter',' '].includes(e.key)) return;
  const active = document.activeElement;
  if (!active?.classList?.contains('product__thumb')) return;
  e.preventDefault();
  const card = active.closest('.product');
  const btn = card?.querySelector('[data-add]');
  if (btn) btn.click();
});

}catch(err){ console.error('Init error:', err); }
});
