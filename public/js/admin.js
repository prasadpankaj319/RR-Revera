document.addEventListener('DOMContentLoaded', () => {
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const dashboardElements = document.querySelectorAll('.admin-dashboard');
    const logoutBtn = document.getElementById('logout-btn');
    const addProductForm = document.getElementById('add-product-form');
    const productListContainer = document.getElementById('admin-product-list');

    // Check if already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
        showDashboard();
    }

    // Login Logic
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.setItem('adminToken', data.token);
                showDashboard();
            } else {
                loginError.style.display = 'block';
            }
        } catch (err) {
            loginError.innerText = "Connection error.";
            loginError.style.display = 'block';
        }
    });

    // Logout
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('adminToken');
        window.location.reload();
    });

    function showDashboard() {
        loginOverlay.style.display = 'none';
        dashboardElements.forEach(el => el.style.display = 'block');
        loadProducts();
        loadMessages();
    }

    // Tab Navigation Logic
    const tabs = document.querySelectorAll('.admin-tab');
    const views = document.querySelectorAll('.admin-view');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            if(tab.getAttribute('data-target')) {
                e.preventDefault();
                const targetId = tab.getAttribute('data-target');
                
                tabs.forEach(t => {
                    t.classList.remove('active');
                    t.style.color = '';
                });
                tab.classList.add('active');
                tab.style.color = 'var(--primary-color)';

                views.forEach(v => {
                    v.style.display = 'none';
                });
                const targetView = document.getElementById(targetId);
                if(targetView) {
                    targetView.style.display = 'block';
                }
            }
        });
    });

    // Load Products for Management
    async function loadProducts() {
        try {
            const res = await fetch('/api/products');
            const products = await res.json();
            
            // Update Dashboard stats
            const statTotal = document.getElementById('stat-total');
            const statFeatured = document.getElementById('stat-featured');
            if (statTotal && statFeatured) {
                statTotal.innerText = products.length;
                statFeatured.innerText = products.filter(p => p.featured).length;
            }
            
            if (products.length === 0) {
                productListContainer.innerHTML = '<p>No products yet.</p>';
                return;
            }

            productListContainer.innerHTML = products.map(p => `
                <div class="product-list-item">
                    <div style="display:flex; align-items:center;">
                        <img src="${p.image}" alt="${p.name}">
                        <div>
                            <strong>${p.name}</strong> <br>
                            <span style="color:#666;">${p.price}</span>
                        </div>
                    </div>
                    <button class="btn btn-danger delete-btn" data-id="${p.id}">Delete</button>
                </div>
            `).join('');

            // Attach delete listeners
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', deleteProduct);
            });

        } catch (err) {
            console.error(err);
            productListContainer.innerHTML = '<p style="color:red;">Failed to load products.</p>';
        }
    }

    // Load Messages for Management
    async function loadMessages() {
        const messageListContainer = document.getElementById('admin-message-list');
        if (!messageListContainer) return;
        
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/messages', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('API failed');
            const messages = await res.json();
            
            // Update Dashboard stats
            const statMessages = document.getElementById('stat-messages');
            if (statMessages) {
                statMessages.innerText = messages.length || 0;
            }
            
            if (!messages || messages.length === 0) {
                messageListContainer.innerHTML = '<p>No customer messages yet.</p>';
                return;
            }

            messageListContainer.innerHTML = messages.map(m => `
                <div class="product-list-item" style="align-items: flex-start; flex-direction: column; background: #fafafa; padding: 1.5rem; margin-bottom: 1rem; border-radius: 8px;">
                    <div style="display:flex; justify-content: space-between; width: 100%; margin-bottom: 0.5rem;">
                        <div>
                            <strong>${m.name}</strong> (<a href="mailto:${m.email}" style="color:var(--primary-color)">${m.email}</a>)
                        </div>
                        <span style="color:#888; font-size: 0.85rem;">${new Date(m.date).toLocaleString()}</span>
                    </div>
                    <p style="margin-bottom: 1rem; color: #444; width: 100%; white-space: pre-wrap;">${m.message}</p>
                    <button class="btn btn-danger delete-msg-btn" data-id="${m.id}" style="align-self: flex-end; font-size: 0.8rem; padding: 0.4rem 0.8rem;">Delete</button>
                </div>
            `).join('');

            // Attach delete listeners
            document.querySelectorAll('.delete-msg-btn').forEach(btn => {
                btn.addEventListener('click', deleteMessageRecord);
            });

        } catch (err) {
            console.error(err);
            messageListContainer.innerHTML = '<p style="color:red;">Failed to load messages.</p>';
        }
    }

    async function deleteMessageRecord(e) {
        const id = e.target.getAttribute('data-id');
        if (!confirm('Are you sure you want to delete this message?')) return;

        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`/api/messages/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                loadMessages(); // refresh list
            } else {
                alert('Failed to delete message.');
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Add Product
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const formData = new FormData();
        formData.append('name', document.getElementById('p-name').value);
        formData.append('price', document.getElementById('p-price').value);
        formData.append('description', document.getElementById('p-desc').value);
        formData.append('sizes', document.getElementById('p-sizes').value);
        formData.append('featured', document.getElementById('p-featured').checked);
        
        const imageFile = document.getElementById('p-image').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (res.ok) {
                alert('Product added successfully!');
                addProductForm.reset();
                loadProducts(); // refresh list
            } else {
                alert('Session expired or unauthorized. Please login again.');
                localStorage.removeItem('adminToken');
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            alert("Failed to add product.");
        }
    });

    // Delete Product
    async function deleteProduct(e) {
        const id = e.target.getAttribute('data-id');
        if (!confirm('Are you sure you want to delete this product?')) return;

        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                loadProducts(); // refresh list
            } else {
                alert('Failed to delete. Unauthorized.');
            }
        } catch (err) {
            console.error(err);
        }
    }
});
