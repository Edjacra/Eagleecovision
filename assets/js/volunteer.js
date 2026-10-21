(function() {
    const volunteerForm = document.getElementById('volunteerForm');
    const vFormStatus = document.getElementById('vFormStatus');
    const vSubmitBtn = document.getElementById('vSubmitBtn');

    if (volunteerForm && !volunteerForm.hasAttribute('data-listener')) {
        volunteerForm.setAttribute('data-listener', 'true');

        volunteerForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('vName')?.value.trim() || '';
            const email = document.getElementById('vEmail')?.value.trim() || '';
            const phone = document.getElementById('vPhone')?.value.trim() || '';
            const interest = document.getElementById('vInterest')?.value.trim() || '';
            const message = document.getElementById('vMessage')?.value.trim() || '';

            if (!name || !email || !interest || !message) {
                if (vFormStatus) {
                    vFormStatus.innerHTML = '<div style="color: #d9534f;">❌ Please fill in all required fields.</div>';
                }
                return;
            }

            if (!email.includes('@') || !email.includes('.')) {
                if (vFormStatus) {
                    vFormStatus.innerHTML = '<div style="color: #d9534f;">❌ Please enter a valid email address.</div>';
                }
                return;
            }

            if (vSubmitBtn) {
                vSubmitBtn.disabled = true;
                vSubmitBtn.textContent = 'Sending...';
            }
            if (vFormStatus) {
                vFormStatus.innerHTML = '<div style="color: #0b4a28;">📧 Submitting your application...</div>';
            }

            const formData = new FormData();
            formData.append('Applicant Name', name);
            formData.append('Email', email);
            formData.append('Phone', phone);
            formData.append('Area of Interest', interest);
            formData.append('Skills & Motivation', message);
            formData.append('_captcha', 'false');
            formData.append('_template', 'table');
            formData.append('_subject', `New Volunteer Application from ${name}`);

            try {
                const response = await fetch('https://formsubmit.co/ajax/mweterie9@gmail.com', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    if (vFormStatus) {
                        vFormStatus.innerHTML = '<div style="color: #2e7d32;">✅ Thank you! Your volunteer application has been submitted successfully.</div>';
                    }
                    volunteerForm.reset();
                } else {
                    throw new Error('Server error');
                }
            } catch (error) {
                console.error('Volunteer submission error:', error);
                if (vFormStatus) {
                    vFormStatus.innerHTML = '<div style="color: #d9534f;">❌ Something went wrong. Please try again or email us directly at <a href="mailto:mweterie9@gmail.com">mweterie9@gmail.com</a>.</div>';
                }
            } finally {
                if (vSubmitBtn) {
                    vSubmitBtn.disabled = false;
                    vSubmitBtn.textContent = 'Send message';
                }

                setTimeout(() => {
                    if (vFormStatus && vFormStatus.innerHTML.includes('successfully')) {
                        vFormStatus.innerHTML = '';
                    }
                }, 6000);
            }
        });
    }
})();
