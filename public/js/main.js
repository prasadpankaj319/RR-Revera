document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Set active link
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        if (link.getAttribute('href') !== '/' && currentPath.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        } else if (currentPath === '/' || currentPath === '/index.html') {
            if (link.getAttribute('href') === 'index.html') {
                link.classList.add('active');
            }
        }
    });

    // Contact Form Interceptor
    const footerForms = document.querySelectorAll('.footer-contact form');
    footerForms.forEach(form => {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const inputs = form.querySelectorAll('input, textarea');
            const data = {
                name: inputs[0].value,
                email: inputs[1].value,
                message: inputs[2].value
            };
            
            const btn = form.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;

            try {
                const res = await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if(res.ok) {
                    alert('Message sent successfully! We will get back to you soon.');
                    form.reset();
                } else {
                    alert('Failed to send message. Please try again later.');
                }
            } catch (err) {
                console.error(err);
                alert('Error sending message.');
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        };
    });
});
