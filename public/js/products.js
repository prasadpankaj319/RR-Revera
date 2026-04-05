// Function to fetch products from the API
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch');
        return await response.json();
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// Function to fetch a single product
async function fetchProduct(id) {
    try {
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) throw new Error('Product not found');
        return await response.json();
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

// Render product card HTML
function createProductCard(product) {
    return `
        <div class="product-card">
            <a href="product.html?id=${product.id}" class="product-image-container">
                <img src="${product.image}" alt="${product.name}">
            </a>
            <div class="product-info">
                <a href="product.html?id=${product.id}"><h3 class="product-title">${product.name}</h3></a>
                <p class="product-price">${product.price}</p>
                <a href="https://instagram.com/rr_revera" target="_blank" class="btn btn-primary">Order on Instagram</a>
            </div>
        </div>
    `;
}

// Render product grid on featured/products pages
async function renderProductGrid(containerId, featuredOnly = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const products = await fetchProducts();
    const displayProducts = featuredOnly ? products.filter(p => p.featured) : products;

    if (displayProducts.length === 0) {
        container.innerHTML = '<p>No products available.</p>';
        return;
    }

    let html = displayProducts.map(p => createProductCard(p)).join('');
    
    if (featuredOnly) {
        html += `
            <a href="products.html" class="product-card" style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 480px; text-decoration: none; transition: transform 0.4s ease, box-shadow 0.4s ease; text-align: center; border: none; overflow: hidden; background: #fff;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='var(--shadow-lg)'; this.querySelector('.blur-bg').style.transform='scale(1.2) rotate(10deg)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow-sm)'; this.querySelector('.blur-bg').style.transform='scale(1) rotate(0deg)';">
                <!-- Gorgeous blurry aesthetic background -->
                <div class="blur-bg" style="position: absolute; top: -20%; left: -20%; width: 140%; height: 140%; background: radial-gradient(circle at top left, rgba(142,68,173,0.3), transparent 60%), radial-gradient(circle at bottom right, rgba(231,196,249,0.5), transparent 60%); filter: blur(30px); z-index: 0; transition: transform 0.6s ease;"></div>
                
                <div style="position: relative; z-index: 1; padding: 2rem; background: rgba(255,255,255,0.4); border-radius: 50%; width: 120px; height: 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.8); margin-bottom: 1.5rem; box-shadow: 0 8px 32px rgba(142,68,173,0.1);">
                    <span style="font-size: 2.5rem; color: var(--primary-color);">→</span>
                </div>
                <span style="position: relative; z-index: 1; font-size: 1.3rem; font-weight: 600; color: var(--primary-color); letter-spacing: 0.5px;">View All Products</span>
            </a>
        `;
    }

    container.innerHTML = html;
}

// Render single product details
async function renderProductDetails() {
    const container = document.getElementById('product-details-container');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        container.innerHTML = '<p>Product not found.</p>';
        return;
    }

    const product = await fetchProduct(productId);
    
    if (!product) {
        container.innerHTML = '<p>Product not found.</p>';
        return;
    }

    const sizesHtml = product.sizes ? product.sizes.map(size => `<span class="size-pill">${size}</span>`).join('') : '';

    container.innerHTML = `
        <div class="product-image">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-info-full">
            <h1>${product.name}</h1>
            <p class="price">${product.price}</p>
            <p class="desc">${product.description}</p>
            
            ${sizesHtml ? `
            <div class="sizes">
                <h4>Available Sizes</h4>
                <div class="size-list">
                    ${sizesHtml}
                </div>
            </div>` : ''}

            <div style="display: flex; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap;">
                <a href="https://instagram.com/rr_revera" target="_blank" class="btn btn-primary" style="display: inline-flex; align-items: center; justify-content: center;">
                    Order on Instagram
                </a>
                <a href="products.html" class="btn" style="display: inline-flex; align-items: center; justify-content: center; background: #F9F4FD; color: var(--primary-color); border: 1px solid rgba(142, 68, 173, 0.2); font-weight: 500;">
                    View All Products
                </a>
            </div>
        </div>
    `;
}

// Initialize based on what containers exist on the page
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a page with a product grid
    if (document.getElementById('featured-products')) {
        renderProductGrid('featured-products', true);
    }
    
    if (document.getElementById('all-products')) {
        renderProductGrid('all-products', false);
    }

    // Check if we're on a single product page
    if (document.getElementById('product-details-container')) {
        renderProductDetails();
    }
});
