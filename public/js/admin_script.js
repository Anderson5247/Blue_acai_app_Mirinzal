// public/js/admin_script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES PARA O STATUS DA LOJA ---
    const shopStatusToggle = document.getElementById('shopStatusToggle');
    const deliveryStatusToggle = document.getElementById('deliveryStatusToggle');
    const deliveryBairroToggle = document.getElementById('deliveryBairroToggle');
    const deliveryCentroToggle = document.getElementById('deliveryCentroToggle');
    const closedMessageText = document.getElementById('closedMessageText');
    const saveShopStatusButton = document.getElementById('saveShopStatusButton');
    const shopStatusMessage = document.getElementById('shopStatusMessage');

    // --- SELETORES PARA CONTROLE DE DISPONIBILIDADE ---
    const itemsContainer = document.getElementById('itemsContainer');
    const saveAvailabilityButton = document.getElementById('saveAvailabilityButton');
    const availabilityStatusMessage = document.getElementById('availabilityStatusMessage');
    let currentItemsData = {};

    // --- LÓGICA DE STATUS DA LOJA ---
    function populateShopStatus(shopInfo) {
        if (!shopInfo) return;
        if (shopStatusToggle) shopStatusToggle.checked = shopInfo.isOpen;
        if (deliveryStatusToggle) deliveryStatusToggle.checked = shopInfo.isDeliveryAvailable;
        if (shopInfo.deliveryLocations) {
            if (deliveryBairroToggle) deliveryBairroToggle.checked = shopInfo.deliveryLocations.bairro;
            if (deliveryCentroToggle) deliveryCentroToggle.checked = shopInfo.deliveryLocations.centro;
        }
        if (closedMessageText) closedMessageText.value = shopInfo.closedMessage;
    }

    if (saveShopStatusButton) {
        saveShopStatusButton.addEventListener('click', async () => {
            if (!shopStatusToggle || !closedMessageText || !deliveryStatusToggle || !deliveryBairroToggle || !deliveryCentroToggle) return;
            const isOpen = shopStatusToggle.checked;
            const isDeliveryAvailable = deliveryStatusToggle.checked;
            const deliveryLocations = {
                bairro: deliveryBairroToggle.checked,
                centro: deliveryCentroToggle.checked
            };
            let messageToSave = closedMessageText.value.trim();
            if (messageToSave === '' && currentItemsData.shopInfo) {
                messageToSave = currentItemsData.shopInfo.closedMessage;
            }
            if (shopStatusMessage) {
                shopStatusMessage.textContent = 'Salvando status...';
                shopStatusMessage.style.color = 'orange';
            }
            try {
                const response = await fetch('/api/shop-info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isOpen, closedMessage: messageToSave, isDeliveryAvailable, deliveryLocations })
                });
                if (!response.ok) throw new Error('Falha ao salvar o status da loja.');
                const result = await response.json();
                if (shopStatusMessage) {
                    shopStatusMessage.textContent = result.message;
                    shopStatusMessage.style.color = 'green';
                }
                await fetchItemsAvailability();
            } catch (error) {
                console.error("Erro ao salvar status da loja:", error);
                if (shopStatusMessage) {
                    shopStatusMessage.textContent = 'Erro ao salvar o status da loja.';
                    shopStatusMessage.style.color = 'red';
                }
            }
        });
    }

    // --- LÓGICA DE DISPONIBILIDADE ---
    async function fetchItemsAvailability() {
        if (!itemsContainer) return;
        itemsContainer.innerHTML = '<p>Carregando itens...</p>';
        try {
            const response = await fetch('/api/items');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            currentItemsData = await response.json();
            if (currentItemsData.shopInfo) {
                populateShopStatus(currentItemsData.shopInfo);
            }
            renderItemsAvailability();
        } catch (error) {
            console.error('Erro ao buscar itens para disponibilidade:', error);
            if (availabilityStatusMessage) {
                availabilityStatusMessage.textContent = 'Erro ao carregar itens.';
                availabilityStatusMessage.style.color = 'red';
            }
            if (itemsContainer) itemsContainer.innerHTML = '<p>Erro ao carregar itens.</p>';
        }
    }

    function renderItemsAvailability() {
        if (!itemsContainer) return;
        itemsContainer.innerHTML = '';
        for (const categoryKey in currentItemsData) {
            if (!Object.hasOwnProperty.call(currentItemsData, categoryKey) || categoryKey === 'shopInfo') continue;
            const categoryItemsArray = currentItemsData[categoryKey];
            if (!Array.isArray(categoryItemsArray) || categoryItemsArray.length === 0) continue;
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-admin';
            const categoryTitleElement = document.createElement('h3');
            categoryTitleElement.textContent = categoryKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            categoryDiv.appendChild(categoryTitleElement);
            if (categoryKey === 'produtos_especiais') {
                categoryItemsArray.forEach(specialProduct => {
                    const productControlDiv = document.createElement('div');
                    productControlDiv.className = 'item-control-admin';
                    const productCheckbox = document.createElement('input');
                    productCheckbox.type = 'checkbox';
                    productCheckbox.id = `item-avail-${specialProduct.id}`;
                    productCheckbox.checked = specialProduct.available;
                    productCheckbox.dataset.category = categoryKey;
                    productCheckbox.dataset.itemId = specialProduct.id;
                    const productLabel = document.createElement('label');
                    productLabel.textContent = `${specialProduct.name} (Produto Principal)`;
                    productLabel.htmlFor = `item-avail-${specialProduct.id}`;
                    productControlDiv.appendChild(productCheckbox);
                    productControlDiv.appendChild(productLabel);
                    categoryDiv.appendChild(productControlDiv);
                    if (specialProduct.flavors && Array.isArray(specialProduct.flavors) && specialProduct.flavors.length > 0) {
                        const flavorsTitle = document.createElement('h4');
                        flavorsTitle.textContent = `Sabores de ${specialProduct.name}:`;
                        categoryDiv.appendChild(flavorsTitle);
                        specialProduct.flavors.forEach(flavor => {
                            const flavorControlDiv = document.createElement('div');
                            flavorControlDiv.className = 'item-control-admin';
                            flavorControlDiv.style.marginLeft = '30px';
                            const flavorCheckbox = document.createElement('input');
                            flavorCheckbox.type = 'checkbox';
                            flavorCheckbox.id = `flavor-avail-${specialProduct.id}-${flavor.id}`;
                            flavorCheckbox.checked = flavor.available;
                            flavorCheckbox.dataset.category = categoryKey;
                            flavorCheckbox.dataset.itemId = specialProduct.id;
                            flavorCheckbox.dataset.flavorId = flavor.id;
                            const flavorLabel = document.createElement('label');
                            flavorLabel.textContent = flavor.name;
                            flavorLabel.htmlFor = `flavor-avail-${specialProduct.id}-${flavor.id}`;
                            flavorControlDiv.appendChild(flavorCheckbox);
                            flavorControlDiv.appendChild(flavorLabel);
                            categoryDiv.appendChild(flavorControlDiv);
                        });
                    }
                });
            } else {
                categoryItemsArray.forEach(item => {
                    const itemControlDiv = document.createElement('div');
                    itemControlDiv.className = 'item-control-admin';
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `item-avail-${item.id}`;
                    checkbox.checked = item.available;
                    checkbox.dataset.category = categoryKey;
                    checkbox.dataset.itemId = item.id;
                    const label = document.createElement('label');
                    label.textContent = item.name;
                    label.htmlFor = `item-avail-${item.id}`;
                    itemControlDiv.appendChild(checkbox);
                    itemControlDiv.appendChild(label);
                    categoryDiv.appendChild(itemControlDiv);
                });
            }
            if (categoryDiv.children.length > 1) {
                itemsContainer.appendChild(categoryDiv);
            }
        }
    }

    if (saveAvailabilityButton) {
        saveAvailabilityButton.addEventListener('click', async () => {
            if (availabilityStatusMessage) {
                availabilityStatusMessage.textContent = 'Salvando alterações...';
                availabilityStatusMessage.style.color = 'orange';
            }
            const itemsToSave = { ...currentItemsData };
            const shopInfoToPreserve = itemsToSave.shopInfo;
            delete itemsToSave.shopInfo;
            const checkboxes = itemsContainer.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(chk => {
                const category = chk.dataset.category;
                const itemId = chk.dataset.itemId;
                const flavorId = chk.dataset.flavorId;
                if (!itemsToSave[category]) return;
                const itemInCollection = itemsToSave[category].find(i => i.id === itemId);
                if (!itemInCollection) return;
                if (flavorId) {
                    if (itemInCollection.flavors && Array.isArray(itemInCollection.flavors)) {
                        const flavorInCollection = itemInCollection.flavors.find(f => f.id === flavorId);
                        if (flavorInCollection) flavorInCollection.available = chk.checked;
                    }
                } else {
                    itemInCollection.available = chk.checked;
                }
            });
            itemsToSave.shopInfo = shopInfoToPreserve;
            try {
                const response = await fetch('/api/items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(itemsToSave, null, 2),
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const result = await response.json();
                if (availabilityStatusMessage) {
                    availabilityStatusMessage.textContent = result.message;
                    availabilityStatusMessage.style.color = 'green';
                }
                fetchItemsAvailability();
            } catch (error) {
                console.error('Erro ao salvar disponibilidade:', error);
                if (availabilityStatusMessage) {
                    availabilityStatusMessage.textContent = 'Erro ao salvar.';
                    availabilityStatusMessage.style.color = 'red';
                }
            }
        });
    }

    // --- LÓGICA DE PEDIDOS ---
    const ordersReportContainer = document.getElementById('ordersReportContainer');
    const grandTotalAllTimeEl = document.getElementById('grandTotalAllTime');
    const refreshOrdersButton = document.getElementById('refreshOrdersButton');
    const viewByDayButton = document.getElementById('viewByDayButton');
    const viewByMonthButton = document.getElementById('viewByMonthButton');
    let allOrdersCache = [];
    let currentViewMode = 'day';

    function getLocalDateKey(iso) { return new Date(iso).toISOString().split('T')[0]; }
    function getMonthKey(iso) {
        const d = new Date(iso);
        return `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;
    }
    function formatDisplayDate(key) {
        const d = new Date(`${key}T00:00:00Z`);
        return d.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    }
    function formatDisplayMonth(key) {
        const [y, m] = key.split('-');
        const d = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, 1));
        return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    }

    async function fetchAndProcessOrders(force = false) {
        if (!ordersReportContainer || !grandTotalAllTimeEl) return;
        ordersReportContainer.innerHTML = '<p>Carregando pedidos...</p>';
        grandTotalAllTimeEl.textContent = 'Calculando...';
        if (force || allOrdersCache.length === 0) {
            try {
                const response = await fetch('/api/orders');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                allOrdersCache = await response.json();
                if (!Array.isArray(allOrdersCache)) allOrdersCache = [];
                allOrdersCache.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            } catch (error) {
                console.error('Erro ao buscar pedidos:', error);
                ordersReportContainer.innerHTML = '<p>Erro ao carregar pedidos.</p>';
                grandTotalAllTimeEl.textContent = 'Erro';
                allOrdersCache = [];
                return;
            }
        }
        displayOrdersByGroup(allOrdersCache, currentViewMode);
    }

    function displayOrdersByGroup(orders, mode) {
        if (!Array.isArray(orders) || orders.length === 0) {
            ordersReportContainer.innerHTML = '<p>Nenhum pedido registrado.</p>';
            grandTotalAllTimeEl.textContent = '0,00';
            return;
        }
        const grouped = {};
        const getKey = mode === 'month' ? getMonthKey : getLocalDateKey;
        orders.forEach(o => {
            if (!o.timestamp) return;
            const key = getKey(o.timestamp);
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(o);
        });
        ordersReportContainer.innerHTML = '';
        const grandTotal = allOrdersCache.reduce((t, o) => t + (parseFloat(o.valorTotal) || 0), 0);
        grandTotalAllTimeEl.textContent = grandTotal.toFixed(2).replace('.', ',');
        const sortedKeys = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
        if (sortedKeys.length === 0) {
            ordersReportContainer.innerHTML = '<p>Nenhum pedido para exibir.</p>';
            return;
        }
        sortedKeys.forEach(key => {
            const groupOrders = grouped[key];
            const groupTotal = groupOrders.reduce((t, o) => t + (parseFloat(o.valorTotal) || 0), 0);
            const groupDiv = document.createElement('div');
            groupDiv.className = 'group-container';
            const headerDiv = document.createElement('div');
            headerDiv.className = 'group-header';
            const title = document.createElement('h3');
            title.textContent = mode === 'day' ? formatDisplayDate(key) : formatDisplayMonth(key);
            const totalSpan = document.createElement('span');
            totalSpan.className = 'group-total';
            totalSpan.textContent = `Total: R$ ${groupTotal.toFixed(2).replace('.', ',')}`;
            headerDiv.append(title, totalSpan);
            groupDiv.appendChild(headerDiv);
            groupOrders.forEach(order => {
                const orderDiv = document.createElement('div');
                orderDiv.className = 'order-item-admin';
                const time = new Date(order.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                let itemsHtml = '<ul>';
                if (Array.isArray(order.pedidoCompleto)) {
                    order.pedidoCompleto.forEach(item => {
                        const subTotal = parseFloat(item.totalPedido || item.subTotalItem || 0);
                        itemsHtml += `<li><strong>Item:</strong> ${item.produto || 'N/A'}<br>`;
                        if (item.sabor) itemsHtml += `&nbsp;&nbsp;Sabor: ${item.sabor}<br>`;
                        if (item.frutas && !item.frutas.includes("Nenhuma")) itemsHtml += `&nbsp;&nbsp;Frutas: ${item.frutas}<br>`;
                        if (item.cremes && !item.cremes.includes("Nenhuma")) itemsHtml += `&nbsp;&nbsp;Cremes: ${item.cremes}<br>`;
                        if (item.acompanhamentos && !item.acompanhamentos.includes("Nenhum")) itemsHtml += `&nbsp;&nbsp;Acompanhamentos: ${item.acompanhamentos}<br>`;
                        if (item.coberturas && !item.coberturas.includes("Nenhuma")) itemsHtml += `&nbsp;&nbsp;Coberturas: ${item.coberturas}<br>`;
                        if (item.adicionais && !item.adicionais.includes("Nenhum")) itemsHtml += `&nbsp;&nbsp;Adicionais: ${item.adicionais}<br>`;
                        itemsHtml += `&nbsp;&nbsp;<strong>Subtotal: R$ ${subTotal.toFixed(2).replace('.', ',')}</strong></li>`;
                    });
                }
                itemsHtml += '</ul>';
                orderDiv.innerHTML = `<h4>Pedido de ${order.cliente || 'N/A'} às ${time}</h4>
                <p><strong>Valor Total: R$ ${(parseFloat(order.valorTotal) || 0).toFixed(2).replace('.', ',')}</strong></p>
                <p><strong>Pagamento:</strong> ${order.metodoPagamento || 'N/A'}</p>
                <p><strong>Entrega:</strong> ${order.tipoEntrega || 'N/A'}</p>
                <div><strong>Detalhes:</strong>${itemsHtml}</div>`;
                groupDiv.appendChild(orderDiv);
            });
            ordersReportContainer.appendChild(groupDiv);
        });
    }

    function updateActiveButton(active) {
        [viewByDayButton, viewByMonthButton].forEach(b => b?.classList.remove('active'));
        active?.classList.add('active');
    }

    if (viewByDayButton) viewByDayButton.addEventListener('click', () => { currentViewMode = 'day'; updateActiveButton(viewByDayButton); displayOrdersByGroup(allOrdersCache, 'day'); });
    if (viewByMonthButton) viewByMonthButton.addEventListener('click', () => { currentViewMode = 'month'; updateActiveButton(viewByMonthButton); displayOrdersByGroup(allOrdersCache, 'month'); });
    if (refreshOrdersButton) refreshOrdersButton.addEventListener('click', () => fetchAndProcessOrders(true));

    fetchItemsAvailability();
    fetchAndProcessOrders(true);
    updateActiveButton(viewByDayButton);
});
