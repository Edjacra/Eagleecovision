(function() {
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');

    if (contactForm && !contactForm.hasAttribute('data-listener')) {
        contactForm.setAttribute('data-listener', 'true');
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('name')?.value.trim() || '';
            const phone = document.getElementById('phone')?.value.trim() || '';
            const email = document.getElementById('email')?.value.trim() || '';
            const subject = document.getElementById('subject')?.value.trim() || '';
            const message = document.getElementById('message')?.value.trim() || '';
            
            // Basic validation: name, email, subject, message required (phone optional)
            if (!name || !email || !subject || !message) {
                if (formStatus) formStatus.innerHTML = '<div class="form-error">❌ Please fill in all required fields (Name, Email, Subject, Message).</div>';
                return;
            }

            if (!email.includes('@') || !email.includes('.')) {
                if (formStatus) formStatus.innerHTML = '<div class="form-error">❌ Please enter a valid email address.</div>';
                return;
            }

            const origBtnText = submitBtn ? submitBtn.textContent : 'Send Message';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';
            }
            if (formStatus) formStatus.innerHTML = '<div class="form-loading" style="color: #4e6355;">📧 Sending your message...</div>';
            
            const formData = new FormData();
            formData.append('name', name);
            if (phone) formData.append('phone', phone);
            formData.append('email', email);
            formData.append('subject', subject);
            formData.append('message', message);
            formData.append('_captcha', 'false');
            formData.append('_template', 'table');
            formData.append('_subject', 'New Message from ' + name + ' - Eagle Ecovision');
            
            try {
                const response = await fetch('https://formsubmit.co/ajax/mweterie9@gmail.com', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json'
                    },
                    body: formData
                });

                const data = await response.json();

                if (response.ok && (data.success === 'true' || data.success === true || data.status === 'success' || !data.hasOwnProperty('success'))) {
                    if (formStatus) formStatus.innerHTML = '<div class="form-success">✅ Message sent successfully! We\'ll get back to you soon.</div>';
                    contactForm.reset();
                } else {
                    throw new Error(data.message || 'Failed to send');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                if (formStatus) formStatus.innerHTML = '<div class="form-error">❌ Oops! Something went wrong. Please try again or email us directly at mweterie9@gmail.com</div>';
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = origBtnText;
                }
                setTimeout(() => {
                    if (formStatus && formStatus.innerHTML.includes('successfully')) {
                        formStatus.innerHTML = '';
                    }
                }, 5000);
            }
        });
    }
})();
