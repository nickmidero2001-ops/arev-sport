const URL_GOOGLE_SHEETS = 'productos.csv';

const CATEGORIES = ['Todos', 'Zapatos', 'Franelas', 'Shorts'];

let cartItems = {};
let allProducts = [];
let activeCategory = 'TODOS';

const HEADER_ALIAS = {
    id: 'ID',
    nombre: 'NOMBRE',
    categoria: 'CATEGORIA',
    precio: 'PRECIO',
    imagen: 'IMAGEN',
    link: 'LINK'
};

const REQUIRED_HEADERS = ['ID', 'NOMBRE', 'CATEGORIA', 'PRECIO', 'IMAGEN', 'LINK'];

function inicializarCatalogo() {
    const botonRefrescar = document.getElementById('refresh-catalog');
    if (botonRefrescar) {
        botonRefrescar.addEventListener('click', () => cargarCatalogoDesdeSheets(true));
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', filtrarPorBusqueda);
    }

    const headerSearchInput = document.getElementById('header-search-input');
    const headerSearchButton = document.getElementById('header-search-button');
    if (headerSearchInput) {
        headerSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (searchInput) searchInput.value = headerSearchInput.value;
                filtrarPorBusqueda({ target: headerSearchInput });
            }
        });
    }
    if (headerSearchButton && headerSearchInput) {
        headerSearchButton.addEventListener('click', () => {
            if (searchInput) searchInput.value = headerSearchInput.value;
            filtrarPorBusqueda({ target: headerSearchInput });
        });
    }

    const categoryFilters = document.getElementById('category-filters');
    if (categoryFilters) {
        categoryFilters.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                document.querySelectorAll('[data-category]').forEach(btn => {
                    btn.classList.remove('active', 'bg-vector', 'text-white');
                    btn.classList.add('text-platinum');
                });
                e.target.classList.add('active', 'bg-vector', 'text-white');
                e.target.classList.remove('text-platinum');
                activeCategory = e.target.dataset.category;
                filtrarPorCategoria(e.target.dataset.category);
            }
        });
    }

    cargarCarritoDesdeStorage();
    cargarCatalogoDesdeSheets();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarCatalogo);
} else {
    inicializarCatalogo();
}

function cargarCatalogoDesdeSheets(forceRefresh = false) {
    const contenedor = document.getElementById('contenedor-productos');
    if (!contenedor) return;

    mostrarLoader(contenedor);
    setCatalogStatus('Cargando catálogo...');

    fetch(URL_GOOGLE_SHEETS + (forceRefresh ? '?_=' + Date.now() : ''))
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.text();
        })
        .then(text => {
            const productos = parseCsv(text);
            if (productos.length === 0) {
                setCatalogStatus('No se encontraron productos. Usando datos de muestra.');
                renderizarProductosConMuestra(contenedor);
                return;
            }
            allProducts = productos;
            updateCatalogTimestamp(new Date());
            setCatalogStatus(`Catálogo cargado: ${productos.length} producto${productos.length > 1 ? 's' : ''}.`);
            renderizarProductos(productos, contenedor);
            filtrarPorCategoria('TODOS');
        })
        .catch(err => {
            console.error('Error cargando catálogo:', err);
            setCatalogStatus('Error al cargar el catálogo. Mostrando datos de muestra.');
            renderizarProductosConMuestra(contenedor);
        });
}

function renderizarProductosConMuestra(contenedor) {
    const productosMuestra = [
        { ID: '001', NOMBRE: 'Zapato Running Pro', CATEGORIA: 'Zapatos', PRECIO: '120', IMAGEN: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800', LINK: '' },
        { ID: '002', NOMBRE: 'Zapato Elite Runner', CATEGORIA: 'Zapatos', PRECIO: '135', IMAGEN: 'https://images.unsplash.com/photo-1608889837726-9eba2c4c33e0?auto=format&fit=crop&q=80&w=800', LINK: '' },
        { ID: '003', NOMBRE: 'Zapato Street Performance', CATEGORIA: 'Zapatos', PRECIO: '110', IMAGEN: 'https://images.unsplash.com/photo-1549924346-c1cf18d9c8d4?auto=format&fit=crop&q=80&w=800', LINK: '' },
        { ID: '004', NOMBRE: 'Franela Deportiva Pro', CATEGORIA: 'Franelas', PRECIO: '55', IMAGEN: 'https://images.unsplash.com/photo-1529156032253-4c7eb0c0c0c0?auto=format&fit=crop&q=80&w=800', LINK: '' },
        { ID: '005', NOMBRE: 'Franela DryFit Elite', CATEGORIA: 'Franelas', PRECIO: '62', IMAGEN: 'https://images.unsplash.com/photo-1583743814966-84223721e6d4?auto=format&fit=crop&q=80&w=800', LINK: '' },
        { ID: '006', NOMBRE: 'Franela Training Performance', CATEGORIA: 'Franelas', PRECIO: '48', IMAGEN: 'https://images.unsplash.com/photo-1529156032253-4c7eb0c0c0c1?auto=format&fit=crop&q=80&w=800', LINK: '' },
        { ID: '007', NOMBRE: 'Short Running Pro', CATEGORIA: 'Shorts', PRECIO: '75', IMAGEN: 'https://images.unsplash.com/photo-1506744024-82b29b5bee04?auto=format&fit=crop&q=80&w=800', LINK: '' },
        { ID: '008', NOMBRE: 'Short Active Elite', CATEGORIA: 'Shorts', PRECIO: '68', IMAGEN: 'https://images.unsplash.com/photo-1583743814966-84223721e6d4?auto=format&fit=crop&q=80&w=800', LINK: '' },
        { ID: '009', NOMBRE: 'Short Sport Performance', CATEGORIA: 'Shorts', PRECIO: '72', IMAGEN: 'https://images.unsplash.com/photo-1514986821122-517bc5bcbc64?auto=format&fit=crop&q=80&w=800', LINK: '' }
    ];
    allProducts = productosMuestra;
    renderizarProductos(productosMuestra, contenedor);
    filtrarPorCategoria('TODOS');
    updateCatalogTimestamp(new Date());
}

function mostrarLoader(contenedor) {
    if (!contenedor) return;
    const skeletonHTML = Array(8).fill(0).map(() => `
        <div class="glass-panel overflow-hidden rounded-lg">
            <div class="aspect-square w-full bg-titanium/50 skeleton"></div>
            <div class="p-4 space-y-3">
                <div class="h-4 bg-titanium/50 skeleton rounded"></div>
                <div class="h-5 bg-titanium/50 skeleton rounded w-1/2"></div>
                <div class="h-9 bg-titanium/50 skeleton rounded mt-3"></div>
                <div class="h-9 bg-titanium/50 skeleton rounded"></div>
            </div>
        </div>
    `).join('');
    contenedor.innerHTML = skeletonHTML;
}

function updateCatalogTimestamp(date) {
    const status = document.getElementById('catalog-status');
    if (!status) return;
    status.textContent = `Última actualización: ${date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}`;
}

function setCatalogStatus(message) {
    const status = document.getElementById('catalog-status');
    if (!status) return;
    status.textContent = message;
}

function parseCsv(text) {
    const cleaned = cleanText(text);
    if (!cleaned) return [];
    if (window.Papa) {
        const results = Papa.parse(cleaned, {
            header: true,
            skipEmptyLines: true,
            transformHeader: normalizeHeader,
            dynamicTyping: false
        });
        return normalizeProductos(results.data || []);
    }
    return normalizeProductos(parseCsvFallback(cleaned));
}

function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/^\uFEFF/, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();
}

function normalizeHeader(header) {
    if (!header) return '';
    return header
        .toString()
        .trim()
        .replace(/\s+/g, ' ')
        .toUpperCase();
}

function parseCsvFallback(text) {
    const lines = text.split('\n');
    if (lines.length === 0) return [];
    const rawHeaders = lines[0].split(',').map(normalizeHeader);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const rawLine = lines[i].trim();
        if (!rawLine) continue;
        const columns = rawLine.split(',').map(cell => {
            cell = cell.trim();
            if (cell.startsWith('"') && cell.endsWith('"')) {
                cell = cell.slice(1, -1);
            }
            return cell;
        });
        const row = {};
        rawHeaders.forEach((header, index) => {
            if (!header) return;
            row[header] = columns[index] || '';
        });
        rows.push(row);
    }
    return rows;
}

function normalizeProductos(rows) {
    const normalized = [];
    rows.forEach(row => {
        const producto = {};
        Object.keys(row || {}).forEach(key => {
            const normalizedKey = normalizeHeader(key);
            const alias = HEADER_ALIAS[normalizedKey] || HEADER_ALIAS[normalizedKey.toLowerCase()];
            if (alias) {
                producto[alias] = (row[key] || '').toString().trim();
            }
            if (REQUIRED_HEADERS.includes(normalizedKey) && !alias) {
                producto[normalizedKey] = (row[key] || '').toString().trim();
            }
        });
        const hasRequiredValues = ['ID', 'NOMBRE', 'PRECIO'].some(field => producto[field] && producto[field].toString().trim() !== '');
        if (!hasRequiredValues) return;
        REQUIRED_HEADERS.forEach(field => {
            producto[field] = producto[field] || '';
        });
        normalized.push(producto);
    });
    return normalized;
}

function renderizarProductos(listaProductos, contenedor) {
    contenedor.innerHTML = '';

    if (!listaProductos || listaProductos.length === 0) {
        contenedor.innerHTML = '<div class="col-span-full text-center py-16 text-on-surface-variant">No hay productos disponibles en esta categoría.</div>';
        return;
    }

    listaProductos.forEach(producto => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'glass-panel overflow-hidden relative group cursor-pointer border border-platinum/20 rounded-lg flex flex-col justify-between transition-all duration-300 hover:border-vector/50 bg-titanium/80';
        tarjeta.dataset.category = (producto.CATEGORIA || '').toUpperCase();

        const imagenRaw = String(producto.IMAGEN || producto.LINK || '').trim();
        const imagenUrl = imagenRaw
            ? imagenRaw
                .replace(/^"+|"+$/g, '')
                .replace(/\\/g, '/')
                .replace(/^.*?(assets\/productos\/)/, '$1')
            : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800';
        const precio = normalizarPrecio(producto.PRECIO);
        const categoria = producto.CATEGORIA || 'Producto';
        const nombre = producto.NOMBRE || 'Sin nombre';
        const link = buildWhatsappLink(producto, nombre, precio);

        tarjeta.innerHTML = `
            <div>
                <div class="aspect-square w-full overflow-hidden bg-titanium/40 relative">
                    <img src="${escapeHtml(imagenUrl)}" alt="${escapeHtml(nombre)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    <span class="absolute top-2 left-2 bg-titanium/70 text-vector text-[10px] tracking-widest uppercase px-2 py-0.5 rounded font-label-sm font-semibold">
                        ${escapeHtml(categoria)}
                    </span>
                </div>
                <div class="p-4">
                    <h4 class="font-headline-sm text-sm md:text-base text-white uppercase font-medium line-clamp-1 mb-1">
                        ${escapeHtml(nombre)}
                    </h4>
                    <p class="text-vector font-bold text-base md:text-lg">
                        ${escapeHtml(precio)}$
                    </p>
                </div>
            </div>
            <div class="p-4 pt-0 space-y-3">
                <button type="button" class="add-to-cart w-full justify-center py-2.5 bg-vector text-white font-label-sm text-xs uppercase tracking-widest hover:bg-vector/85 border border-transparent transition-all duration-300 flex items-center justify-center gap-2 font-semibold" data-id="${escapeHtml(producto.ID || nombre)}">
                    <span class="material-symbols-outlined text-[16px]">shopping_cart</span>
                    AÑADIR AL CARRITO
                </button>
                <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="w-full justify-center py-2.5 bg-vector/10 text-vector font-label-sm text-xs uppercase tracking-widest hover:bg-vector hover:text-titanium border border-vector transition-all duration-300 flex items-center justify-center gap-2 font-semibold">
                    CONSULTAR
                </a>
            </div>
        `;

        contenedor.appendChild(tarjeta);

        const addButton = tarjeta.querySelector('.add-to-cart');
        if (addButton) {
            addButton.addEventListener('click', () => addToCart(producto));
        }

        const imgEl = tarjeta.querySelector('img');
        if (imgEl) {
            imgEl.onerror = function () {
                this.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800';
            };
        }
    });
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function cargarCarritoDesdeStorage() {
    try {
        const saved = localStorage.getItem('carrito');
        cartItems = saved ? JSON.parse(saved) : {};
    } catch (e) {
        cartItems = {};
    }
    renderizarCarrito();
}

function guardarCarritoEnStorage() {
    try {
        localStorage.setItem('carrito', JSON.stringify(cartItems));
    } catch (e) {
        console.warn('No se pudo guardar el carrito en storage', e);
    }
}

function formatearPrecio(precio) {
    const value = Number(precio) || 0;
    return `$${value.toFixed(2)}`;
}

function calcularTotalCarrito() {
    return Object.values(cartItems).reduce((total, item) => total + item.price * item.quantity, 0);
}

function renderizarCarrito() {
    const itemsContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const cartStatus = document.getElementById('cart-status');

    if (!itemsContainer || !cartTotal || !cartStatus) return;

    itemsContainer.innerHTML = '';
    const items = Object.values(cartItems);

    if (items.length === 0) {
        itemsContainer.innerHTML = '<div class="text-center py-8 text-on-surface-variant">Tu carrito está vacío. Agrega productos para comenzar tu pedido.</div>';
        cartStatus.textContent = 'Agrega productos para ver el total.';
        cartTotal.textContent = '$0.00';
        return;
    }

    items.forEach(item => {
        const subtotal = item.price * item.quantity;
        const itemEl = document.createElement('div');
        itemEl.className = 'flex items-center gap-3 rounded-xl border border-white/10 bg-titanium/60 p-3';
        itemEl.innerHTML = `
            <div class="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-titanium/40">
                <img src="${escapeHtml(item.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80')}" alt="${escapeHtml(item.name)}" class="w-full h-full object-cover" />
            </div>
            <div class="min-w-0 flex-grow">
                <p class="text-sm font-semibold text-white line-clamp-1">${escapeHtml(item.name)}</p>
                <p class="text-xs text-on-surface-variant">${formatearPrecio(item.price)} c/u</p>
            </div>
            <div class="flex items-center gap-1">
                <button type="button" class="cart-qty btn-dec text-xs w-7 h-7 flex items-center justify-center uppercase tracking-[0.2em] bg-white/5 rounded text-on-surface hover:bg-white/10" data-id="${escapeHtml(item.id)}" data-delta="-1">-</button>
                <span class="min-w-[1.5rem] text-center text-sm font-semibold text-white">${item.quantity}</span>
                <button type="button" class="cart-qty btn-inc text-xs w-7 h-7 flex items-center justify-center uppercase tracking-[0.2em] bg-white/5 rounded text-on-surface hover:bg-white/10" data-id="${escapeHtml(item.id)}" data-delta="1">+</button>
            </div>
            <div class="text-right w-20">
                <p class="text-xs text-on-surface-variant">Subtotal</p>
                <p class="text-sm font-bold text-vector">${formatearPrecio(subtotal)}</p>
            </div>
            <button type="button" class="cart-remove text-xs px-2 py-1 bg-vector/10 text-white rounded hover:bg-vector" data-id="${escapeHtml(item.id)}">
                <span class="material-symbols-outlined text-sm">close</span>
            </button>
        `;

        itemsContainer.appendChild(itemEl);
    });

    const subtotalEl = document.createElement('div');
    subtotalEl.className = 'border-t border-white/10 pt-3 mt-3';
    subtotalEl.innerHTML = `
        <div class="flex justify-between items-center">
            <span class="font-label-sm text-xs text-on-surface-variant uppercase tracking-widest">Subtotal</span>
            <span id="cart-subtotal" class="text-base font-bold text-white">${formatearPrecio(calcularTotalCarrito())}</span>
        </div>
    `;
    itemsContainer.appendChild(subtotalEl);

    const checkoutButton = document.createElement('button');
    checkoutButton.type = 'button';
    checkoutButton.className = 'mt-4 w-full rounded-full border border-vector bg-vector px-4 py-3 font-label-sm text-xs uppercase tracking-widest text-white transition-colors hover:bg-vector/85 flex items-center justify-center gap-2 font-semibold';
    checkoutButton.innerHTML = '<span class="material-symbols-outlined">shopping_cart</span> Finalizar compra por WhatsApp';
    checkoutButton.addEventListener('click', enviarCarritoWhatsapp);
    itemsContainer.appendChild(checkoutButton);

    const vaciarButton = document.createElement('button');
    vaciarButton.type = 'button';
    vaciarButton.className = 'mt-2 w-full rounded-full border border-platinum/30 px-4 py-2 font-label-sm text-xs uppercase tracking-widest text-platinum transition-colors hover:border-vector hover:text-vector';
    vaciarButton.textContent = 'Vaciar carrito';
    vaciarButton.addEventListener('click', limpiarCarrito);
    itemsContainer.appendChild(vaciarButton);

    cartTotal.textContent = formatearPrecio(calcularTotalCarrito());
    cartStatus.textContent = `Tienes ${items.length} artículo${items.length === 1 ? '' : 's'} en el carrito.`;

    itemsContainer.querySelectorAll('.cart-qty').forEach(button => {
        button.addEventListener('click', event => {
            const id = event.currentTarget.dataset.id;
            const delta = Number(event.currentTarget.dataset.delta || 0);
            actualizarCantidadCarrito(id, delta);
        });
    });

    itemsContainer.querySelectorAll('.cart-remove').forEach(button => {
        button.addEventListener('click', event => {
            const id = event.currentTarget.dataset.id;
            eliminarDelCarrito(id);
        });
    });
}

function addToCart(producto) {
    const id = producto.ID || producto.NOMBRE;
    const price = parseFloat(normalizarPrecio(producto.PRECIO)) || 0;
    const name = producto.NOMBRE || 'Producto';
    const image = producto.IMAGEN || producto.LINK || '';

    if (!id) return;

    if (!cartItems[id]) {
        cartItems[id] = {
            id,
            name,
            price,
            image,
            quantity: 0
        };
    }

    cartItems[id].quantity += 1;
    guardarCarritoEnStorage();
    renderizarCarrito();

    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 right-4 bg-vector text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
    toast.textContent = `${name} agregado al carrito`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function actualizarCantidadCarrito(id, delta) {
    if (!cartItems[id]) return;
    cartItems[id].quantity += delta;
    if (cartItems[id].quantity <= 0) {
        delete cartItems[id];
    }
    guardarCarritoEnStorage();
    renderizarCarrito();
}

function eliminarDelCarrito(id) {
    if (!cartItems[id]) return;
    delete cartItems[id];
    guardarCarritoEnStorage();
    renderizarCarrito();
}

function limpiarCarrito() {
    cartItems = {};
    guardarCarritoEnStorage();
    renderizarCarrito();
}

function normalizarPrecio(precio) {
    if (!precio) return '0';
    const raw = precio.toString().trim().replace(/\s/g, '').replace(/[^\d,.\-]/g, '');
    if (!raw) return '0';
    return raw.replace(',', '.');
}

function buildWhatsappLink(producto, nombre, precio) {
    const telefono = '584129114603';
    const texto = `Hola Arev Sport, deseo consultar el producto ${nombre} con precio de ${precio}$`;
    return `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`;
}

function enviarCarritoWhatsapp() {
    const items = Object.values(cartItems);
    if (items.length === 0) return;

    const lines = items.map(item => `- ${item.name} x${item.quantity} - ${formatearPrecio(item.price * item.quantity)}`);
    const total = calcularTotalCarrito();
    const texto = `Hola Arev Sport, deseo consultar disponibilidad y precio del siguiente pedido:\n\n${lines.join('\n')}\n\nTotal estimado: ${formatearPrecio(total)}`;

    window.open(`https://wa.me/584129114603?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
}

function filtrarPorCategoria(categoria) {
    const contenedor = document.getElementById('contenedor-productos');
    const status = document.getElementById('catalog-status');

    if (!contenedor) return;

    let productosAMostrar;
    if (categoria === 'TODOS') {
        productosAMostrar = [...allProducts];
    } else {
        productosAMostrar = allProducts.filter(p =>
            (p.CATEGORIA || '').toUpperCase() === categoria.toUpperCase()
        );
    }

    renderizarProductos(productosAMostrar, contenedor);
    const categoryLabel = categoria === 'TODOS' ? 'Todos' : categoria;
    if (status) {
        status.textContent = `Mostrando ${productosAMostrar.length} producto${productosAMostrar.length !== 1 ? 's' : ''} en "${categoryLabel}"`;
    }
}

function filtrarPorBusqueda(event) {
    const termino = event.target.value.toLowerCase().trim();
    const contenedor = document.getElementById('contenedor-productos');
    const status = document.getElementById('catalog-status');

    if (!contenedor) return;

    if (termino === '') {
        filtrarPorCategoria(activeCategory);
        return;
    }

    const resultados = allProducts.filter(p =>
        (p.NOMBRE || '').toLowerCase().includes(termino) ||
        (p.CATEGORIA || '').toLowerCase().includes(termino)
    );

    renderizarProductos(resultados, contenedor);
    if (status) {
        status.textContent = `Encontrados ${resultados.length} producto${resultados.length !== 1 ? 's' : ''} para "${event.target.value}"`;
    }
}