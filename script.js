function searchProduct(){

let input = document.getElementById("searchInput").value.toLowerCase();

let products = document.querySelectorAll(".product");

products.forEach(function(product){

let name = product.getAttribute("data-name");

if(name.includes(input)){
product.style.display="block";
}
else{
product.style.display="none";
}

});

}


function filterProduct(category){

let products=document.querySelectorAll(".product");

products.forEach(function(product){

if(category==="all"){
product.style.display="block";
}

else if(product.classList.contains(category)){
product.style.display="block";
}

else{
product.style.display="none";
}

});

// NEW: smooth fade-in transition + active pill highlight (cosmetic only, filter logic above is unchanged)
products.forEach(function(product){
    if(product.style.display === "block"){
        product.classList.remove('fade-in');
        void product.offsetWidth; // restart animation
        product.classList.add('fade-in');
    }
});

document.querySelectorAll('.categories .category').forEach(function(btn){
    btn.classList.remove('active');
    if(btn.getAttribute('onclick') === `filterProduct('${category}')`){
        btn.classList.add('active');
    }
});

}

// NEW: used by the homepage "Featured Categories" cards to jump to Products
// and apply the same working filterProduct() logic above.
function goToCategory(category){
    filterProduct(category);
    const productsSection = document.getElementById('products');
    if(productsSection){
        productsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Shopping Cart Functionality
const CART_KEY = 'manishMartCart';
let cart = [];

function loadCartFromSession() {
    try {
        const stored = sessionStorage.getItem(CART_KEY);
        if (stored) {
            cart = JSON.parse(stored);
        }
    } catch (error) {
        console.warn('Failed to load cart from session:', error);
        cart = [];
    }
    updateCartDisplay();
}

function saveCartToSession() {
    try {
        sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (error) {
        console.warn('Failed to save cart to session:', error);
    }
}

function getCartCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartDisplay() {
    document.getElementById('cartCount').textContent = getCartCount();
}

function addToCart(productName, price) {
    const existingItem = cart.find(item => item.name === productName && item.price === price);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name: productName, price: price, quantity: 1 });
    }
    saveCartToSession();
    updateCartDisplay();
    alert(`${productName} added to cart!`);
}

function updateCartItemQuantity(index, change) {
    if (!cart[index]) {
        return;
    }
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    saveCartToSession();
    updateCartDisplay();
    showCart();
}

function renderCartItems() {
    return cart.map((item, index) => {
        const itemTotal = item.price * item.quantity;
        return `
            <div class="cart-item">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateCartItemQuantity(${index}, -1)">-</button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartItemQuantity(${index}, 1)">+</button>
                </div>
                <div class="cart-item-price">₹${item.price} each</div>
                <div class="cart-item-total">₹${itemTotal}</div>
                <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
            </div>
        `;
    }).join('');
}

function showCart() {
    const cartModal = document.getElementById('cartModal');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    cartItems.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty</p>';
        checkoutBtn.disabled = true;
    } else {
        cartItems.innerHTML = renderCartItems();
        cart.forEach((item) => {
            total += item.price * item.quantity;
        });
        checkoutBtn.disabled = false;
    }

    cartTotal.textContent = `Total: ₹${total}`;
    cartModal.style.display = 'block';
}

function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
}

function removeFromCart(index) {
    if (!cart[index]) {
        return;
    }
    cart.splice(index, 1);
    saveCartToSession();
    updateCartDisplay();
    showCart();
}

function initiateCheckout() {
    closeCart();
    showPaymentModal();
}

function showPaymentModal() {
    const paymentModal = document.getElementById('paymentModal');
    const paymentStatus = document.getElementById('paymentStatus');
    paymentModal.style.display = 'block';
    paymentStatus.innerHTML = '';

    let total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let usdTotal = (total / 83).toFixed(2);

    if (total <= 0) {
        paymentStatus.innerHTML = '<p>Your cart is empty. Add items before checkout.</p>';
        return;
    }

    paypal.Buttons({
        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: usdTotal
                    }
                }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                showPaymentSuccess(details);
            });
        },
        onError: function(err) {
            showPaymentError(err);
        }
    }).render('#paypal-button-container');
}

function closePayment() {
    document.getElementById('paymentModal').style.display = 'none';
    document.getElementById('paypal-button-container').innerHTML = '';
    document.getElementById('paymentStatus').innerHTML = '';
}

function showPaymentSuccess(details) {
    const paymentStatus = document.getElementById('paymentStatus');
    paymentStatus.innerHTML = `
        <div class="payment-success">
            <h3>Payment Successful! 🎉</h3>
            <p>Thank you for your purchase, ${details.payer?.name?.given_name || 'customer'}!</p>
            <p>Transaction ID: ${details.id || 'N/A'}</p>
            <p>Status: ${details.status || 'Completed'}</p>
            <button onclick="completeOrder()">Continue Shopping</button>
        </div>
    `;

    cart = [];
    saveCartToSession();
    updateCartDisplay();
}

function showPaymentError(error) {
    const paymentStatus = document.getElementById('paymentStatus');
    paymentStatus.innerHTML = `
        <div class="payment-error">
            <h3>Payment Failed</h3>
            <p>There was an error processing your payment. Please try again.</p>
            <p>Error: ${sanitizeError(error)}</p>
            <button onclick="showPaymentModal()">Try Again</button>
        </div>
    `;
}

function sanitizeError(error) {
    if (!error) return 'Unknown error';
    return typeof error === 'string' ? error : error.message || 'Unknown error';
}

function completeOrder() {
    closePayment();
    alert('Order completed! Your items will be delivered soon.');
}

window.addEventListener('DOMContentLoaded', function() {
    loadCartFromSession();
    initAuth();
});

function initAuth() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

function showLogin() {
    document.getElementById('loginModal').style.display = 'block';
    document.getElementById('loginStatus').innerHTML = '';
}

function closeLogin() {
    document.getElementById('loginModal').style.display = 'none';
}

function showRegister() {
    closeLogin();
    document.getElementById('registerModal').style.display = 'block';
    document.getElementById('registerStatus').innerHTML = '';
}

function closeRegister() {
    document.getElementById('registerModal').style.display = 'none';
}

function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const captchaResponse = grecaptcha.getResponse();

    if (!captchaResponse) {
        document.getElementById('loginStatus').innerHTML = '<p style="color: red;">Please complete the CAPTCHA.</p>';
        return;
    }

    // For demo, check localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username);

    if (user && bcrypt.compareSync(password, user.password)) {
        localStorage.setItem('currentUser', JSON.stringify({ username: user.username, email: user.email }));
        document.getElementById('loginStatus').innerHTML = '<p style="color: green;">Login successful!</p>';
        setTimeout(() => {
            closeLogin();
            updateNavForLoggedIn();
        }, 1000);
    } else {
        document.getElementById('loginStatus').innerHTML = '<p style="color: red;">Invalid username or password.</p>';
    }

    grecaptcha.reset();
}

function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const captchaResponse = grecaptcha.getResponse();

    if (!captchaResponse) {
        document.getElementById('registerStatus').innerHTML = '<p style="color: red;">Please complete the CAPTCHA.</p>';
        return;
    }

    if (password !== confirmPassword) {
        document.getElementById('registerStatus').innerHTML = '<p style="color: red;">Passwords do not match.</p>';
        return;
    }

    if (password.length < 6) {
        document.getElementById('registerStatus').innerHTML = '<p style="color: red;">Password must be at least 6 characters.</p>';
        return;
    }

    // Send to server
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            email: email,
            password: password,
            'g-recaptcha-response': captchaResponse
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            document.getElementById('registerStatus').innerHTML = `<p style="color: red;">${data.error}</p>`;
        } else {
            document.getElementById('registerStatus').innerHTML = '<p style="color: green;">Registration successful!</p>';
            setTimeout(() => {
                closeRegister();
                showLogin();
            }, 1000);
        }
        grecaptcha.reset();
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('registerStatus').innerHTML = '<p style="color: red;">An error occurred. Please try again.</p>';
        grecaptcha.reset();
    });
}

function updateNavForLoggedIn() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        const nav = document.querySelector('nav');
        nav.innerHTML += `<a href="#" onclick="logout()">Logout (${currentUser.username})</a>`;
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

function showSecurityAnalysis() {
    document.getElementById('securityModal').style.display = 'block';
    document.getElementById('securityReport').textContent = 'Loading security analysis...';
    fetchSecurityAnalysis();
}

function closeSecurityAnalysis() {
    document.getElementById('securityModal').style.display = 'none';
}

function fetchSecurityAnalysis() {
    const container = document.getElementById('securityReport');
    container.textContent = 'Loading security analysis...';
    
    fetch('/api/log-analysis')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Analysis data received:', data);
            renderSecurityReport(data);
        })
        .catch(error => {
            console.error('Log analysis fetch error:', error);
            container.textContent = 'Security analysis failed: ' + (error.message || error);
        });
}

function renderSecurityReport(report) {
    const container = document.getElementById('securityReport');
    if (!report || report.error) {
        container.textContent = report?.error || 'No report available.';
        return;
    }

    let output = [];
    output.push('Summary:');
    output.push(`  Total log lines: ${report.summary.total_lines}`);
    output.push(`  Suspicious event count: ${report.summary.suspicious_event_count}`);
    output.push(`  Suspicious IP count: ${report.summary.suspicious_ip_count}`);
    output.push(`  Repeated failed login sources: ${report.summary.repeated_failed_login_sources}`);
    output.push('');

    if (report.suspicious_ips.length > 0) {
        output.push('Suspicious IPs:');
        report.suspicious_ips.slice(0, 6).forEach(ipEntry => {
            output.push(`  • ${ipEntry.ip} — failed logins=${ipEntry.failed_logins}, sql_injection_attempts=${ipEntry.sql_injection_attempts}, path_traversal_attempts=${ipEntry.path_traversal_attempts}, suspicious_user_agents=${ipEntry.suspicious_user_agents}`);
        });
        output.push('');
    }

    if (report.repeated_failed_logins.length > 0) {
        output.push('Repeated Failed Login Sources:');
        report.repeated_failed_logins.forEach(entry => {
            output.push(`  • ${entry.ip}: ${entry.count} failed login attempts`);
        });
        output.push('');
    }

    if (report.events.length > 0) {
        output.push('Sample Suspicious Events:');
        report.events.slice(0, 6).forEach(event => {
            output.push(`  • [${event.type}] ${event.ip} — ${event.detail} — ${event.path}`);
        });
    }

    container.textContent = output.join('\n');
}

// Check if logged in on load
if (localStorage.getItem('currentUser')) {
    updateNavForLoggedIn();
}

// =====================================================================
// NEW: Navigation active-link highlighting (SPA-style scroll navigation)
// This block only ADDS behavior on top of the existing nav links.
// It does not touch cart, PayPal, login, or product logic above.
// =====================================================================

function setActiveNavLink(sectionId){
    document.querySelectorAll('#mainNav .nav-link').forEach(function(link){
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        }
    });
}

function initNavScrollSpy(){
    const sectionIds = ['home', 'categories', 'products', 'contact'];
    const sections = sectionIds
        .map(id => document.getElementById(id))
        .filter(Boolean);

    if (!sections.length) return;

    // Highlight the matching nav link the moment a link is clicked
    document.querySelectorAll('#mainNav .nav-link[data-section]').forEach(function(link){
        link.addEventListener('click', function(){
            setActiveNavLink(link.getAttribute('data-section'));
        });
    });

    // Highlight the matching nav link automatically while scrolling
    const observer = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
            if (entry.isIntersecting) {
                setActiveNavLink(entry.target.id);
            }
        });
    }, { threshold: 0.35 });

    sections.forEach(section => observer.observe(section));

    // Set initial state
    setActiveNavLink('home');
}

window.addEventListener('DOMContentLoaded', function(){
    initNavScrollSpy();
});
