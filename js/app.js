
const money = n => `$${Number(n).toFixed(2)}`;
const getCart = () => JSON.parse(localStorage.getItem("toyhaven_cart") || "[]");
const saveCart = cart => localStorage.setItem("toyhaven_cart", JSON.stringify(cart));
const getWishlist = () => JSON.parse(localStorage.getItem("toyhaven_wishlist") || "{}");
const saveWishlist = w => localStorage.setItem("toyhaven_wishlist", JSON.stringify(w));

function cartCount(){
  return getCart().reduce((sum,item)=>sum+item.qty,0);
}
function updateCartBadges(){
  document.querySelectorAll("[data-cart-count]").forEach(el=>el.textContent=cartCount());
}
function addToCart(id){
  const cart=getCart(), existing=cart.find(x=>x.id===id);
  if(existing) existing.qty++;
  else cart.push({id,qty:1});
  saveCart(cart); updateCartBadges(); toast("Added to cart");
}
function changeQty(id,delta){
  const cart=getCart(), item=cart.find(x=>x.id===id);
  if(!item)return;
  item.qty+=delta;
  if(item.qty<=0) cart.splice(cart.indexOf(item),1);
  saveCart(cart); renderCart(); updateCartBadges();
}
function clearCart(){
  localStorage.removeItem("toyhaven_cart"); renderCart(); updateCartBadges(); toast("Cart cleared");
}
function toast(message){
  const t=document.querySelector(".toast");
  if(!t)return;
  t.textContent=message;t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2200);
}
function productById(id){return products.find(p=>p.id===Number(id))}
function productCard(p){
  const wish=getWishlist(), saved=wish[p.id];
  return `<article class="product-card reveal">
    <div class="product-image">
    <img src="${p.image}" alt="${p.name}" loading="lazy">
    </div>  
    <span class="category">${p.category}</span>
    <h3>${p.name}</h3>
    <p class="muted">${p.description}</p>
    <div class="price">${money(p.price)}</div>
    <div class="card-actions">
      <button class="btn btn-dark" onclick="addToCart(${p.id})">Add to Cart</button>
      <button class="wishlist-btn" aria-label="Add ${p.name} to wishlist" onclick="toggleWishlist(${p.id})">${saved?"♥":"♡"}</button>
    </div>
    <button class="btn btn-light" style="width:100%;margin-top:8px" onclick="openProduct(${p.id})">View Details</button>
  </article>`;
}
function renderProducts(list=products){
  const grid=document.querySelector("#productGrid");
  if(!grid)return;
  grid.innerHTML=list.length?list.map(productCard).join(""):`<div class="empty" style="grid-column:1/-1">No products found.</div>`;
  observeReveal();
}
function filterProducts(){
  const q=(document.querySelector("#searchInput")?.value||"").toLowerCase();
  const active=document.querySelector(".filter-btn.active")?.dataset.category||"All";
  const list=products.filter(p=>(active==="All"||p.category===active)&&p.name.toLowerCase().includes(q));
  renderProducts(list);
}
function toggleWishlist(id){
  const w=getWishlist();
  if(w[id]) delete w[id];
  else w[id]={status:"Interested"};
  saveWishlist(w); toast(w[id]?"Saved to collection":"Removed from collection");
  renderProducts(products);
}
function openProduct(id){
  const p=productById(id), modal=document.querySelector("#productModal");
  if(!modal)return;
  modal.querySelector(".modal-content").innerHTML=`
 <div class="product-image"><img src="${p.image}" alt="${p.name}"></div>
  <h2>${p.name}</h2><p class="category">${p.category}</p>
  <p>${p.description}</p>
  <strong class="price">${money(p.price)}</strong>
  <button class="btn btn-dark" style="width:100%" onclick="addToCart(${p.id})">Add to Cart</button>`;
  modal.classList.add("show");
}
function renderCart(){
  const box=document.querySelector("#cartItems"), empty=document.querySelector("#cartEmpty"), summary=document.querySelector("#cartSummary");
  if(!box)return;
  const cart=getCart();
  if(!cart.length){box.innerHTML="";empty.hidden=false;summary.hidden=true;return}
  empty.hidden=true;summary.hidden=false;
  box.innerHTML=cart.map(item=>{
    const p=productById(item.id), sub=p.price*item.qty;
    return `<div class="cart-item">
      <div class="mini-image"><img src="${p.image}" alt="${p.name}"></div>
      <div><strong>${p.name}</strong><div class="category">${p.category}</div><div class="price">${money(p.price)}</div>
      <div class="qty"><button onclick="changeQty(${p.id},-1)">−</button><span>${item.qty}</span><button onclick="changeQty(${p.id},1)">+</button></div></div>
      <div class="item-price"><strong>${money(sub)}</strong><button class="wishlist-btn" onclick="changeQty(${p.id},-${item.qty})">✕</button></div>
    </div>`;
  }).join("");
  const subtotal=cart.reduce((s,i)=>s+productById(i.id).price*i.qty,0);
  const delivery=subtotal?5:0;
  document.querySelector("#subtotal").textContent=money(subtotal);
  document.querySelector("#delivery").textContent=money(delivery);
  document.querySelector("#total").textContent=money(subtotal+delivery);
}
function checkoutSummary(){
  const cart=getCart(), list=document.querySelector("#checkoutProducts");
  if(!list)return;
  if(!cart.length){list.innerHTML='<div class="notice">Your cart is empty. <a href="products.html"><u>Shop now</u></a>.</div>';return}
  list.innerHTML=cart.map(i=>{const p=productById(i.id);return `<div class="summary-row"><span>${p.name} × ${i.qty}</span><strong>${money(p.price*i.qty)}</strong></div>`}).join("");
  const subtotal=cart.reduce((s,i)=>s+productById(i.id).price*i.qty,0),delivery=5;
  document.querySelector("#checkoutSubtotal").textContent=money(subtotal);
  document.querySelector("#checkoutDelivery").textContent=money(delivery);
  document.querySelector("#checkoutTotal").textContent=money(subtotal+delivery);
}
function placeOrder(e){
  e.preventDefault();
  const form=e.target;
  if(!form.checkValidity()){form.reportValidity();return}
  const cart=getCart(); if(!cart.length){toast("Your cart is empty");return}
  const order={number:"TH-"+Date.now().toString().slice(-6),date:new Date().toISOString(),items:cart,total:cart.reduce((s,i)=>s+productById(i.id).price*i.qty,0)+5};
  const history=JSON.parse(localStorage.getItem("toyhaven_orders")||"[]");history.unshift(order);
  localStorage.setItem("toyhaven_orders",JSON.stringify(history));
  localStorage.removeItem("toyhaven_cart");
  location.href="success.html?order="+encodeURIComponent(order.number);
}
function initSuccess(){
  const no=new URLSearchParams(location.search).get("order")||"TH-000000";
  const el=document.querySelector("#orderNumber");if(el)el.textContent=no;
}

function renderWishlist(status = "All") {
  const grid = document.querySelector("#wishlistGrid");
  if (!grid) return;

  const w = getWishlist();
  const ids = Object.keys(w).filter(id => status === "All" || w[id].status === status);

  if (!ids.length) {
    grid.innerHTML = '<div class="empty" style="grid-column:1/-1">No items in this collection yet.</div>';
    return;
  }

  grid.innerHTML = ids.map(id => {
    const p = productById(id);
    const s = w[id].status;

    // Use real image if you have it, otherwise fall back to emoji
    const imageContent = p.image
      ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;">`
      : p.emoji;

    return `
      <article class="product-card">
        <div class="product-image">${imageContent}</div>
        <span class="category">${p.category}</span>
        <h3>${p.name}</h3>
        <p class="price">${money(p.price)}</p>

        <label>
          Status
          <select class="status-select" onchange="setStatus(${p.id}, this.value)">
            <option ${s === "Interested" ? "selected" : ""}>Interested</option>
            <option ${s === "Owned" ? "selected" : ""}>Owned</option>
            <option ${s === "Not Interested" ? "selected" : ""}>Not Interested</option>
          </select>
        </label>

        <button class="btn btn-dark" style="width:100%;margin-top:10px"
                onclick="addToCart(${p.id})">
          Add to Cart
        </button>
      </article>
    `;
  }).join("");
}

function setStatus(id,status){const w=getWishlist();if(w[id])w[id].status=status;saveWishlist(w);toast("Collection updated")}
function newsletter(e){
  e.preventDefault();const input=e.target.querySelector("input");if(!input.checkValidity()){input.reportValidity();return}
  localStorage.setItem("toyhaven_newsletter",input.value);toast("Thanks for subscribing!");e.target.reset();
}
function feedback(e){
  e.preventDefault();if(!e.target.checkValidity()){e.target.reportValidity();return}
  const arr=JSON.parse(localStorage.getItem("toyhaven_feedback")||"[]");
  arr.push({name:e.target.name.value,email:e.target.email.value,message:e.target.message.value,date:new Date().toISOString()});
  localStorage.setItem("toyhaven_feedback",JSON.stringify(arr));
  document.querySelector("#feedbackMessage").textContent="Thank you! Your feedback has been saved.";
  e.target.reset();
}
function observeReveal(){
  const observer=new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting)x.target.classList.add("visible")}),{threshold:.1});
  document.querySelectorAll(".reveal:not(.visible)").forEach(el=>observer.observe(el));
}
document.addEventListener("DOMContentLoaded",()=>{
  document.querySelector("#hamburger")?.addEventListener("click",()=>document.querySelector("#navLinks").classList.toggle("open"));
  document.querySelector("#newsletterForm")?.addEventListener("submit",newsletter);
  document.querySelector("#feedbackForm")?.addEventListener("submit",feedback);
  document.querySelectorAll(".faq-q").forEach(q=>q.addEventListener("click",()=>q.parentElement.classList.toggle("open")));
  document.querySelector("#productModal")?.addEventListener("click",e=>{if(e.target.id==="productModal")e.currentTarget.classList.remove("show")});
  document.querySelector(".close")?.addEventListener("click",()=>document.querySelector("#productModal").classList.remove("show"));
  updateCartBadges();observeReveal();
  const page=document.body.dataset.page;
  if(page==="products"){
    renderProducts();

  // Search box
  document.querySelector("#searchInput")?.addEventListener("input", filterProducts);

  // Filter buttons
  document.querySelectorAll(".filter-btn").forEach(b => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");

      // Keep the dropdown in sync with the button
      const select = document.querySelector("#categorySelect");
      if (select) select.value = b.dataset.category;

      filterProducts();
    });
  });
  
  // Category dropdown
  document.querySelector("#categorySelect")?.addEventListener("change", function () {
    const selected = this.value;   // "All", "Figurines", "Toys", etc.

    // Keep the filter buttons in sync with the dropdown
    document.querySelectorAll(".filter-btn").forEach(btn => {
      if (btn.dataset.category === selected) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    filterProducts();
  });
}
  if(page==="cart")renderCart();
  if(page==="checkout")checkoutSummary();
  if(page==="success")initSuccess();
  if(page==="wishlist")renderWishlist();
  if(page==="home"){
    const featured=products.slice(0,4);renderProducts(featured);
    const slides=[...document.querySelectorAll(".hero-slide")],dots=[...document.querySelectorAll(".dot")];
    let i=0;setInterval(()=>{slides[i]?.classList.remove("active");dots[i]?.classList.remove("active");i=(i+1)%slides.length;slides[i]?.classList.add("active");dots[i]?.classList.add("active")},4000);
  }
});
