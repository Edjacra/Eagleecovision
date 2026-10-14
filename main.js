(function() {
  // Mobile Nav Toggle
  var burger = document.querySelector('.burger'), nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', function() {
      var isOpen = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', isOpen);
    });
  }

  // Header Dropdown Toggle
  var moreBtn = document.querySelector('.more > button');
  if (moreBtn) {
    moreBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      moreBtn.parentNode.classList.toggle('open');
    });
    document.addEventListener('click', function(e) {
      if (!moreBtn.parentNode.contains(e.target)) {
        moreBtn.parentNode.classList.remove('open');
      }
    });
  }

  // Active Link Highlight
  var currentPath = window.location.pathname.split('/').pop() || 'index.html';
  var navLinks = document.querySelectorAll('.nav a, .drop a');
  navLinks.forEach(function(link) {
    var href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('on');
    }
  });

  // Animated Count-Up Numbers
  function animateCounter(el) {
    var target = +el.dataset.count;
    var suffix = el.dataset.suf || '';
    var duration = 2000;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out quad
      var easeProgress = 1 - (1 - progress) * (1 - progress);
      var currentVal = Math.floor(easeProgress * target);
      el.textContent = currentVal.toLocaleString() + (progress === 1 ? suffix : '');
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    }
    window.requestAnimationFrame(step);
  }

  // Scroll Reveal & Intersection Observer
  var observerOptions = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
  var observer = 'IntersectionObserver' in window ? new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (entry.target.dataset.count) {
        animateCounter(entry.target);
      } else {
        entry.target.classList.add('in');
      }
    });
  }, observerOptions) : null;

  document.querySelectorAll('[data-count]').forEach(function(el) {
    if (observer) {
      observer.observe(el);
    } else {
      el.textContent = (+el.dataset.count).toLocaleString() + (el.dataset.suf || '');
    }
  });

  document.querySelectorAll('.card, .prog, .ev, .logo, .gal figure, .album-card figure, .box, .tiles a, .story-txt, .story-img, .post').forEach(function(el, idx) {
    if (observer) {
      el.classList.add('rv');
      el.style.transitionDelay = (idx % 4 * 0.08) + 's';
      observer.observe(el);
    }
  });

  // Lightbox Modal for Gallery Images
  var galleryFigures = document.querySelectorAll('.gal figure, .album-card figure');
  if (galleryFigures.length > 0) {
    var modal = document.createElement('div');
    modal.className = 'lightbox-modal';
    modal.innerHTML = '<button class="lightbox-close" aria-label="Close">&times;</button><img class="lightbox-content" src="" alt="Enlarged view">';
    document.body.appendChild(modal);

    var modalImg = modal.querySelector('.lightbox-content');
    var closeBtn = modal.querySelector('.lightbox-close');

    galleryFigures.forEach(function(fig) {
      fig.addEventListener('click', function() {
        var img = fig.querySelector('img');
        if (img && img.src) {
          modalImg.src = img.src;
          modalImg.alt = img.alt || 'Gallery image';
          modal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });
  }

  document.querySelectorAll('.album-toggle').forEach(function(button) {
    button.addEventListener('click', function() {
      var album = button.closest('.album-card');
      var photos = album.querySelector('.album-photos');
      var isExpanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', !isExpanded);
      button.textContent = isExpanded ? 'View more' : 'Show less';
      album.classList.toggle('expanded', !isExpanded);
      photos.hidden = isExpanded;
    });
  });

  // Back to Top Button
  var backToTopBtn = document.createElement('button');
  backToTopBtn.className = 'back-to-top';
  backToTopBtn.setAttribute('aria-label', 'Back to top');
  backToTopBtn.innerHTML = '&#9650;';
  document.body.appendChild(backToTopBtn);

  window.addEventListener('scroll', function() {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  });

  backToTopBtn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Contact / Feedback Form Handling
  var forms = document.querySelectorAll('.form');
  forms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      var origText = submitBtn ? (submitBtn.textContent || submitBtn.value) : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitBtn.tagName === 'BUTTON') submitBtn.textContent = 'Sending...';
      }
      setTimeout(function() {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (submitBtn.tagName === 'BUTTON') submitBtn.textContent = 'Message Sent! ✓';
        }
        alert('Thank you! Your message has been received. We will get back to you shortly.');
        form.reset();
        setTimeout(function() {
          if (submitBtn && submitBtn.tagName === 'BUTTON') submitBtn.textContent = origText;
        }, 3000);
      }, 800);
    });
  });
})();
