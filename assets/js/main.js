(function(){
var b=document.querySelector('.burger'),n=document.querySelector('.nav');
if(b)b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o)});
var m=document.querySelector('.more>button');
if(m)m.addEventListener('click',function(){m.parentNode.classList.toggle('open')});
function count(el){var t=+el.dataset.count,s=el.dataset.suf||'',i=0,st=Math.max(1,t/60);
var f=setInterval(function(){i+=st;if(i>=t){i=t;clearInterval(f)}el.textContent=Math.floor(i).toLocaleString()+(i>=t?s:'')},25)}
var io='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){
if(!e.isIntersecting)return;io.unobserve(e.target);
if(e.target.dataset.count)count(e.target);else e.target.classList.add('in')})},{threshold:.15}):null;
document.querySelectorAll('[data-count]').forEach(function(el){io?io.observe(el):(el.textContent=(+el.dataset.count).toLocaleString()+(el.dataset.suf||''))});
document.querySelectorAll('.card,.prog,.ev,.logo,.gal figure,.box,.tiles a').forEach(function(el){if(io){el.classList.add('rv');io.observe(el)}});
})();
