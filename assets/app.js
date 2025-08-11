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

// Cart state
let cart = JSON.parse(localStorage.getItem('cart')||'[]');
function saveCart(){ localStorage.setItem('cart', JSON.stringify(cart)); }
function cartCount(){ return cart.reduce((s,i)=>s+i.qty,0); }
function cartTotal(){ return cart.reduce((s,i)=>s+i.qty*i.price,0); }

function renderCart(){
  $('#cartCount').textContent = cartCount();
  $('#drawerTotal').textContent = money(cartTotal());
  // list items
  const cont = $('#drawerItems'); cont.innerHTML = '';
  if (!cart.length){
    const empty = document.createElement('div');
    empty.className = 'muted';
    empty.textContent = 'Giỏ hàng của bạn đang trống.';
    cont.appendChild(empty);
  } else {
    cart.forEach(it=>{
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.style.display = 'grid';
      el.style.gridTemplateColumns = '1fr auto';
      el.style.gap = '8px';
      el.innerHTML = `
        <div>
          <div><strong>${it.name}</strong></div>
          <div class="muted">x${it.qty} · ${money(it.price)}</div>
        </div>
        <div>
          <button data-dec="${it.id}" class="btn btn--small">-</button>
          <button data-inc="${it.id}" class="btn btn--small">+</button>
        </div>`;
      cont.appendChild(el);
    });
  }
  // push hidden fields for form
  const totalH = $('#cartTotalHidden'); if (totalH) totalH.value = cartTotal();
  const jsonH = $('#cartJsonHidden'); if (jsonH) jsonH.value = JSON.stringify(cart);
}

function openDrawer(){ $('#cartDrawer').classList.add('open'); }
function closeDrawer(){ $('#cartDrawer').classList.remove('open'); }

function syncPaymentGuide(method){
  $('#guideCOD').style.display = method==='COD' ? 'block' : 'none';
  $('#guideBANK').style.display = method==='BANK' ? 'block' : 'none';
  $('#guideMOMO').style.display = method==='MOMO' ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', function(){
  // Open cart buttons
  $('#openCart').addEventListener('click', openDrawer);
  const oc2 = $('#openCart2'); if (oc2) oc2.addEventListener('click', openDrawer);
  $('#closeCart').addEventListener('click', closeDrawer);
  $('#xCart').addEventListener('click', closeDrawer);

  // Add to cart
  document.body.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    const data = JSON.parse(btn.getAttribute('data-add')||'{}');
    const found = cart.find(i=>i.id===data.id);
    if (found) found.qty += 1; else cart.push({...data, qty:1});
    saveCart(); renderCart(); toast('Đã thêm vào giỏ'); openDrawer();
  });

  // Click image to add
  document.addEventListener('click', (e)=>{
    const thumb = e.target.closest('.product__thumb');
    if (!thumb) return;
    const card = thumb.closest('.product');
    const btn = card?.querySelector('[data-add]');
    if (btn && !btn.disabled) btn.click();
  });

  // +/- quantity
  document.body.addEventListener('click', (e)=>{
    if (e.target.matches('[data-inc]')){
      const id = e.target.getAttribute('data-inc');
      const it = cart.find(i=>i.id===id); if (it){ it.qty+=1; saveCart(); renderCart(); }
    }
    if (e.target.matches('[data-dec]')){
      const id = e.target.getAttribute('data-dec');
      const it = cart.find(i=>i.id===id); if (it){ it.qty-=1; if (it.qty<=0) cart = cart.filter(x=>x.id!==id); saveCart(); renderCart(); }
    }
  });

  // Payment guides
  const paySel = $('#drawerPayment');
  if (paySel){ paySel.addEventListener('change', ()=> syncPaymentGuide(paySel.value)); syncPaymentGuide(paySel.value); }

  // Submit checkout
  $('#checkoutForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    if (!cart.length){ alert('Giỏ hàng đang trống'); return; }
    // Ensure hidden fields are up-to-date
    $('#cartTotalHidden').value = cartTotal();
    $('#cartJsonHidden').value = JSON.stringify(cart);
    // Submit
    const ok = $('#ok'), err = $('#err');
    ok.style.display='none'; err.style.display='none';
    const btn = e.target.querySelector('button[type="submit"]'); btn.disabled = True; btn.textContent = 'Đang gửi...';
    try{
      const formData = new FormData($('#checkoutForm'));
      const res = await fetch($('#checkoutForm').action, { method:'POST', body:formData, headers:{Accept:'application/json'} });
      if (res.ok){
        ok.style.display='block';
        cart = []; saveCart(); renderCart();
      }else{
        err.style.display='block';
      }
    }catch(_){ err.style.display='block'; }
    finally{ btn.disabled = false; btn.textContent = 'Gửi đơn hàng'; }
  });

  renderCart();
});
