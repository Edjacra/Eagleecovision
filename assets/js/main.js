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

  // Shared page copy and the optional admin editing controls.
  initializeSiteTextEditor();

  function initializeSiteTextEditor() {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    var editorRequested = new URLSearchParams(window.location.search).get('edit') === '1';
    var editor = null;
    var editMode = false;
    var adminToken = '';
    var dirty = false;
    var textNodes = [];
    var publishedText = {};

    fetch('/api/site-content?page=' + encodeURIComponent(page), { cache: 'no-store' })
      .then(function(response) {
        if (!response.ok) throw new Error('Shared page text could not be loaded (HTTP ' + response.status + ').');
        return response.json();
      })
      .then(function(result) {
        applySavedText(result.content || {});
        if (editorRequested) createEditor();
      })
      .catch(function(error) {
        console.error('Unable to load shared page text:', error);
        applySavedText({});
        if (editorRequested) {
          createEditor();
          setStatus(error.message, true);
        }
      });

    function applySavedText(savedText) {
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      var sourceNodes = [];
      var node;
      var ignored = 'script, style, svg, noscript, template, textarea, input, select, option, [data-count], .back-to-top, .burger, .album-toggle, .lightbox-close';

      while ((node = walker.nextNode())) {
        if (!node.nodeValue.trim() || (node.parentElement && node.parentElement.closest(ignored))) continue;
        sourceNodes.push(node);
      }

      sourceNodes.forEach(function(sourceNode, index) {
        var span = document.createElement('span');
        span.setAttribute('data-site-text-id', String(index));
        span.textContent = sourceNode.nodeValue;
        sourceNode.parentNode.replaceChild(span, sourceNode);
        if (Object.prototype.hasOwnProperty.call(savedText, String(index)) && typeof savedText[String(index)] === 'string') {
          span.textContent = savedText[String(index)];
        }
        publishedText[String(index)] = span.textContent;
        textNodes.push(span);
      });
    }

    function createEditor() {
      if (editor) return;

      editor = document.createElement('section');
      editor.className = 'site-text-editor';
      editor.setAttribute('aria-label', 'Site text editor');
      editor.innerHTML = '<label class="site-text-editor-label" for="site-editor-token">Admin token</label>' +
        '<input id="site-editor-token" type="password" autocomplete="current-password" placeholder="Enter admin token">' +
        '<button type="button" data-editor-unlock>Unlock editing</button>' +
        '<button type="button" data-editor-save hidden>Publish changes</button>' +
        '<button type="button" data-editor-exit hidden>Exit</button>' +
        '<p class="site-text-editor-status" role="status" aria-live="polite">Enter your admin token to edit this page.</p>';
      document.body.appendChild(editor);

      editor.querySelector('[data-editor-unlock]').addEventListener('click', unlockEditor);
      editor.querySelector('[data-editor-save]').addEventListener('click', saveEdits);
      editor.querySelector('[data-editor-exit]').addEventListener('click', exitEditor);

      document.addEventListener('input', function(event) {
        if (editMode && event.target.hasAttribute('data-site-text-id')) {
          dirty = true;
          setStatus('Unsaved changes.', false);
        }
      });
      document.addEventListener('keydown', function(event) {
        if (editMode && event.target.hasAttribute('data-site-text-id') && event.key === 'Enter') {
          event.preventDefault();
        }
      });
      document.addEventListener('paste', function(event) {
        if (!editMode || !event.target.hasAttribute('data-site-text-id')) return;
        event.preventDefault();
        document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
      });
      document.addEventListener('click', function(event) {
        if (!editMode || editor.contains(event.target)) return;
        if (event.target.closest('a, button, input, select, textarea, form')) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }, true);
    }

    function unlockEditor() {
      var tokenInput = editor.querySelector('#site-editor-token');
      var token = tokenInput.value.trim();
      if (!token) {
        setStatus('Enter the site admin token to unlock editing.', true);
        tokenInput.focus();
        return;
      }

      var unlockButton = editor.querySelector('[data-editor-unlock]');
      unlockButton.disabled = true;
      fetch('/api/site-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ page: page, verifyOnly: true })
      })
        .then(readApiResponse)
        .then(function() {
          adminToken = token;
          editMode = true;
          dirty = false;
          tokenInput.hidden = true;
          editor.querySelector('.site-text-editor-label').hidden = true;
          unlockButton.hidden = true;
          editor.querySelector('[data-editor-save]').hidden = false;
          editor.querySelector('[data-editor-exit]').hidden = false;
          textNodes.forEach(function(span) {
            span.contentEditable = 'true';
            span.spellcheck = true;
          });
          editor.classList.add('editing');
          setStatus('Editing this page. Select text, then publish your changes.', false);
        })
        .catch(function(error) {
          setStatus(error.message, true);
        })
        .then(function() {
          unlockButton.disabled = false;
        });
    }

    function saveEdits() {
      var saveButton = editor.querySelector('[data-editor-save]');
      var content = {};
      textNodes.forEach(function(span) {
        content[span.getAttribute('data-site-text-id')] = span.textContent;
      });
      saveButton.disabled = true;
      setStatus('Publishing changes...', false);

      fetch('/api/site-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
        body: JSON.stringify({ page: page, content: content })
      })
        .then(readApiResponse)
        .then(function() {
          dirty = false;
          publishedText = content;
          setStatus('Changes published for all visitors.', false);
        })
        .catch(function(error) {
          setStatus(error.message, true);
        })
        .then(function() {
          saveButton.disabled = false;
        });
    }

    function exitEditor() {
      if (dirty && !window.confirm('Discard unpublished changes and exit editing?')) return;
      if (dirty) {
        textNodes.forEach(function(span) {
          span.textContent = publishedText[span.getAttribute('data-site-text-id')];
        });
      }
      editMode = false;
      dirty = false;
      adminToken = '';
      textNodes.forEach(function(span) {
        span.contentEditable = 'false';
        span.removeAttribute('spellcheck');
      });
      editor.classList.remove('editing');
      editor.querySelector('#site-editor-token').hidden = false;
      editor.querySelector('#site-editor-token').value = '';
      editor.querySelector('.site-text-editor-label').hidden = false;
      editor.querySelector('[data-editor-unlock]').hidden = false;
      editor.querySelector('[data-editor-save]').hidden = true;
      editor.querySelector('[data-editor-exit]').hidden = true;
      setStatus('Enter your admin token to edit this page.', false);
    }

    function readApiResponse(response) {
      return response.json().then(function(result) {
        if (!response.ok) throw new Error(result.error || 'The request failed (HTTP ' + response.status + ').');
        return result;
      });
    }

    function setStatus(message, isError) {
      if (!editor) return;
      var status = editor.querySelector('.site-text-editor-status');
      status.textContent = message;
      status.classList.toggle('error', isError);
    }
  }

  // Contact / Feedback Form Handling (excluding contactForm which is handled by contact.js)
  var forms = document.querySelectorAll('.form');
  forms.forEach(function(form) {
    if (form.id === 'contactForm') return;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      var origText = submitBtn ? (submitBtn.textContent || submitBtn.value) : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitBtn.tagName === 'BUTTON') setButtonText(submitBtn, 'Sending...');
      }
      setTimeout(function() {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (submitBtn.tagName === 'BUTTON') setButtonText(submitBtn, 'Message Sent! ✓');
        }
        alert('Thank you! Your message has been received. We will get back to you shortly.');
        form.reset();
        setTimeout(function() {
          if (submitBtn && submitBtn.tagName === 'BUTTON') setButtonText(submitBtn, origText);
        }, 3000);
      }, 800);
    });
  });

  function setButtonText(button, text) {
    var textNode = button.querySelector('[data-site-text-id]');
    if (textNode) {
      textNode.textContent = text;
    } else {
      button.textContent = text;
    }
  }
})();
