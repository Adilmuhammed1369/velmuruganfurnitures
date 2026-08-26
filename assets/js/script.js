'use strict';

// modal variables
const modal = document.querySelector('[data-modal]');
const modalCloseBtn = document.querySelector('[data-modal-close]');
const modalCloseOverlay = document.querySelector('[data-modal-overlay]');

// modal function
const modalCloseFunc = function () { modal.classList.add('closed') }

// modal eventListener
modalCloseOverlay.addEventListener('click', modalCloseFunc);
modalCloseBtn.addEventListener('click', modalCloseFunc);





// notification toast variables
const notificationToast = document.querySelector('[data-toast]');
const toastCloseBtn = document.querySelector('[data-toast-close]');

// notification toast eventListener
toastCloseBtn.addEventListener('click', function () {
  notificationToast.classList.add('closed');
});





// mobile menu variables
const mobileMenuOpenBtn = document.querySelectorAll('[data-mobile-menu-open-btn]');
const mobileMenu = document.querySelectorAll('[data-mobile-menu]');
const mobileMenuCloseBtn = document.querySelectorAll('[data-mobile-menu-close-btn]');
const overlay = document.querySelector('[data-overlay]');

for (let i = 0; i < mobileMenuOpenBtn.length; i++) {

  // mobile menu function
  const mobileMenuCloseFunc = function () {
    mobileMenu[i].classList.remove('active');
    overlay.classList.remove('active');
  }

  mobileMenuOpenBtn[i].addEventListener('click', function () {
    mobileMenu[i].classList.add('active');
    overlay.classList.add('active');
  });

  mobileMenuCloseBtn[i].addEventListener('click', mobileMenuCloseFunc);
  overlay.addEventListener('click', mobileMenuCloseFunc);

}





// accordion variables
const accordionBtn = document.querySelectorAll('[data-accordion-btn]');
const accordion = document.querySelectorAll('[data-accordion]');

for (let i = 0; i < accordionBtn.length; i++) {

  accordionBtn[i].addEventListener('click', function () {

    const clickedBtn = this.nextElementSibling.classList.contains('active');

    for (let i = 0; i < accordion.length; i++) {

      if (clickedBtn) break;

      if (accordion[i].classList.contains('active')) {

        accordion[i].classList.remove('active');
        accordionBtn[i].classList.remove('active');

      }

    }

    this.nextElementSibling.classList.toggle('active');
    this.classList.toggle('active');

  });

}
function sendData(productBox){

  const product = {
    img: productBox.querySelector("img").src,
    name: productBox.querySelector(".showcase-title").innerText,
    price: productBox.querySelector(".price").innerText
  };

  localStorage.setItem("product", JSON.stringify(product));

  window.location.href = "productdetails.html";
}

function cart(el){
  let product = JSON.parse(localStorage.getItem("product"));

  // If no product in localStorage, try to derive from the clicked button's DOM
  if (!product && el) {
    const showcase = el.closest('.showcase');
    if (showcase) {
      product = {
        img: (showcase.querySelector('img.showcase-img') || showcase.querySelector('img'))?.src || '',
        name: (showcase.querySelector('.showcase-title') || showcase.querySelector('h3'))?.innerText || '',
        price: (showcase.querySelector('.price'))?.innerText || ''
      };
    }
  }

  if (!product) {
    alert('No product selected to add to cart');
    return;
  }

  let cartItems = JSON.parse(localStorage.getItem("cart")) || [];
  cartItems.push(product);
  localStorage.setItem("cart", JSON.stringify(cartItems));


  // Try to notify backend (if running) but don't block if it fails
  try {
    const loginUser = JSON.parse(localStorage.getItem('loginUser')) || null;
    if (loginUser && loginUser._id) {
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loginUser._id, product })
      }).catch(() => {});
    }
  } catch (e) {}

  alert("Added to Cart");
}
function viewProduct(product){
  localStorage.setItem("product", JSON.stringify(product));
  window.location.href = "productdetails.html";
}
let products = JSON.parse(localStorage.getItem("products")) || [];

let container = document.getElementById("products");

products.forEach(p => {

let div = document.createElement("div");

div.innerHTML = `
<h3>${p.name}</h3>
<p>${p.price}</p>
<img src="${p.image}" width="150">
<hr>
`;

container.appendChild(div);

});


function addToCart(i){

let products = JSON.parse(localStorage.getItem("adminProducts"));
let cart = JSON.parse(localStorage.getItem("cart")) || [];

cart.push(products[i]);

localStorage.setItem("cart", JSON.stringify(cart));

alert("Product added to cart");

}

// Enhanced addToCart that sends to backend when user logged in
function addToCartBackend(i){
  let products = JSON.parse(localStorage.getItem("adminProducts")) || [];
  let product = products[i];
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = { img: product.image || product.img || '', name: product.name, price: product.price };
  cart.push(item);
  localStorage.setItem("cart", JSON.stringify(cart));

  const loginUser = JSON.parse(localStorage.getItem('loginUser')) || null;
  if (loginUser && loginUser._id) {
    fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: loginUser._id, product: item })
    }).catch(()=>{});
  }
  alert('Product added to cart');
}

document.addEventListener("DOMContentLoaded", loadAdminProducts);

// On load, if a user is logged in, fetch cart and wishlist from backend and sync
document.addEventListener('DOMContentLoaded', async function(){
  try{
    const loginUser = JSON.parse(localStorage.getItem('loginUser')) || null;
    if (loginUser && loginUser._id) {
      // fetch cart
      try{
        const res = await fetch('/api/cart/' + loginUser._id);
        if (res.ok){
          const data = await res.json();
          if (data && Array.isArray(data.items)) localStorage.setItem('cart', JSON.stringify(data.items));
        }
      }catch(e){}

      // fetch wishlist
      try{
        const res2 = await fetch('/api/wishlist/' + loginUser._id);
        if (res2.ok){
          const w = await res2.json();
          if (w && Array.isArray(w.items)) localStorage.setItem('wishlist', JSON.stringify(w.items));
        }
      }catch(e){}
    }
  }catch(e){}
});


let searchInput = document.querySelector(".search-field");
let searchBtn = document.getElementById("searchBtn");

function searchProduct(){

let keyword = searchInput.value.toLowerCase();

let products = document.querySelectorAll(".showcase");

products.forEach(function(product){

let text = product.innerText.toLowerCase();

if(text.includes(keyword)){
product.style.display = "block";
}else{
product.style.display = "none";
}

});

}

/* search when typing */
searchInput.addEventListener("keyup", searchProduct);

/* search when clicking lens */
searchBtn.addEventListener("click", function(e){
e.preventDefault();
searchProduct();
});
