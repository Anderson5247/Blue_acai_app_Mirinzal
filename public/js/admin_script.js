// public/js/admin_script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES PARA O STATUS DA LOJA ---
    const shopStatusToggle = document.getElementById('shopStatusToggle');
    const deliveryStatusToggle = document.getElementById('deliveryStatusToggle');
    // CORRIGIDO: Seletores corretos para Bairro e Centro
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
        if (shopStatusToggle) {
            shopStatusToggle.checked = shopInfo.isOpen;
        }
        if (deliveryStatusToggle) {
            deliveryStatusToggle.checked = shopInfo.isDeliveryAvailable;
        }
        // CORRIGIDO: Lógica para popular os checkboxes de Bairro e Centro
        if (shopInfo.deliveryLocations) {
            if (deliveryBairroToggle) {
                deliveryBairroToggle.checked = shopInfo.deliveryLocations.bairro;
            }
            if (deliveryCentroToggle) {
                deliveryCentroToggle.checked = shopInfo.deliveryLocations.centro;
            }
        }
        if (closedMessageText) {
            closedMessageText.value = shopInfo.closedMessage;
        }
    }

    if (saveShopStatusButton) {
      saveShopStatusButton.addEventListener('click', async () => {
            // CORRIGIDO: Verificação usando os seletores corretos
            if (!shopStatusToggle || !closedMessageText || !deliveryStatusToggle || !deliveryBairroToggle || !deliveryCentroToggle) return;

            const isOpen = shopStatusToggle.checked;
            const isDeliveryAvailable = deliveryStatusToggle.checked;
            // CORRIGIDO: Objeto criado com as chaves corretas 'bairro' e 'centro'
            const deliveryLocations = {
                bairro: deliveryBairroToggle.checked,
                centro: deliveryCentroToggle.checked
            };
            let messageToSave = closedMessageText.value.trim();

            if (messageToSave === '' && currentItemsData.shopInfo && currentItemsData.shopInfo.closedMessage) {
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

                if (!response.ok) {
                    throw new Error('Falha ao salvar o status da loja. Status: ' + response.status);
                }

                const result = await response.json();
                if (shopStatusMessage) {
                    shopStatusMessage.textContent = result.message;
                    shopStatusMessage.style.color = 'green';
                }
                // Recarrega os dados para garantir que a interface reflita o que foi salvo
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
        itemsContainer.innerHTML = '<p>Carregando itens para controle de disponibilidade...</p>';
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
                availabilityStatusMessage.textContent = 'Erro ao carregar itens para disponibilidade.';
                availabilityStatusMessage.style.color = 'red';
            }
            if (itemsContainer) itemsContainer.innerHTML = '<p>Erro ao carregar itens.</p>';
        }
    }

    function renderItemsAvailability() {
        if (!itemsContainer) return;
        itemsContainer.innerHTML = '';

        for (const categoryKey in currentItemsData) {
            if (Object.hasOwnProperty.call(currentItemsData, categoryKey)) {
                if (categoryKey === 'shopInfo' || categoryKey === 'acai_sizes') continue;

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
    }


    if (saveAvailabilityButton) {
        saveAvailabilityButton.addEventListener('click', async () => {
            if (availabilityStatusMessage) {
                availabilityStatusMessage.textContent = 'Salvando alterações de disponibilidade...';
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
                        if (flavorInCollection) {
                            flavorInCollection.available = chk.checked;
                        }
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
                console.error('Erro ao salvar alterações de disponibilidade:', error);
                if (availabilityStatusMessage) {
                    availabilityStatusMessage.textContent = 'Erro ao salvar alterações de disponibilidade.';
                    availabilityStatusMessage.style.color = 'red';
                }
            }
        });
    }

    // --- SELETORES PARA GERENCIAMENTO DE PEDIDOS ---
    const ordersReportContainer = document.getElementById('ordersReportContainer');
    const grandTotalAllTimeEl = document.getElementById('grandTotalAllTime');
    const refreshOrdersButton = document.getElementById('refreshOrdersButton');
    const viewByDayButton = document.getElementById('viewByDayButton');
    const viewByMonthButton = document.getElementById('viewByMonthButton');

    let allOrdersCache = [];
    let currentViewMode = 'day';

    function getLocalDateKey(isoTimestamp) {
        const date = new Date(isoTimestamp);
        return date.toISOString().split('T')[0];
    }

    function getMonthKey(isoTimestamp) {
        const date = new Date(isoTimestamp);
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    }

    function formatDisplayDate(dateKey) {
        const date = new Date(dateKey + 'T00:00:00Z');
        return date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    }

    function formatDisplayMonth(monthKey) {
        const [year, month] = monthKey.split('-');
        const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1));
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    }

    async function fetchAndProcessOrders(forceFetch = false) {
        if (!ordersReportContainer || !grandTotalAllTimeEl) return;

        ordersReportContainer.innerHTML = '<p>Carregando pedidos...</p>';
        grandTotalAllTimeEl.textContent = 'Calculando...';

        if (forceFetch || allOrdersCache.length === 0) {
            try {
                const response = await fetch('/api/orders');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                allOrdersCache = await response.json();
                if (!Array.isArray(allOrdersCache)) {
                    allOrdersCache = [];
                }
                allOrdersCache.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            } catch (error) {
                console.error('Erro ao buscar pedidos:', error);
                ordersReportContainer.innerHTML = '<p>Erro ao carregar pedidos. Tente atualizar.</p>';
                grandTotalAllTimeEl.textContent = 'Erro';
                allOrdersCache = [];
                return;
            }
        }
        displayOrdersByGroup(allOrdersCache, currentViewMode);
    }

    function displayOrdersByGroup(ordersToDisplay, mode) {
        if (!Array.isArray(ordersToDisplay) || ordersToDisplay.length === 0) {
            ordersReportContainer.innerHTML = '<p>Nenhum pedido registrado ainda.</p>';
            grandTotalAllTimeEl.textContent = '0,00';
            return;
        }

        const groupedOrders = {};
        let getKeyFunction = mode === 'month' ? getMonthKey : getLocalDateKey;

        ordersToDisplay.forEach(order => {
            if (order.timestamp) {
                const groupKey = getKeyFunction(order.timestamp);
                if (!groupedOrders[groupKey]) {
                    groupedOrders[groupKey] = [];
                }
                groupedOrders[groupKey].push(order);
            }
        });

        ordersReportContainer.innerHTML = '';
        let overallGrandTotal = allOrdersCache.reduce((total, order) => total + (parseFloat(order.valorTotal) || 0), 0);
        grandTotalAllTimeEl.textContent = overallGrandTotal.toFixed(2).replace('.', ',');

        const sortedGroupKeys = Object.keys(groupedOrders).sort((a, b) => new Date(b) - new Date(a));

        if (sortedGroupKeys.length === 0) {
             ordersReportContainer.innerHTML = '<p>Nenhum pedido para exibir com os filtros atuais.</p>';
        }

        sortedGroupKeys.forEach(groupKey => {
            const ordersInGroup = groupedOrders[groupKey];
            let groupTotalValue = ordersInGroup.reduce((total, order) => total + (parseFloat(order.valorTotal) || 0), 0);

            const groupContainerDiv = document.createElement('div');
            groupContainerDiv.className = 'group-container';

            const groupHeaderDiv = document.createElement('div');
            groupHeaderDiv.className = 'group-header';

            const groupTitle = document.createElement('h3');
            groupTitle.textContent = mode === 'day' ? formatDisplayDate(groupKey) : formatDisplayMonth(groupKey);

            const groupTotalSpan = document.createElement('span');
            groupTotalSpan.className = 'group-total';
            groupTotalSpan.textContent = `Total: R$ ${groupTotalValue.toFixed(2).replace('.', ',')}`;

            groupHeaderDiv.appendChild(groupTitle);
            groupHeaderDiv.appendChild(groupTotalSpan);
            groupContainerDiv.appendChild(groupHeaderDiv);

            ordersInGroup.forEach(order => {
                const orderDiv = document.createElement('div');
                orderDiv.className = 'order-item-admin';
                const orderTime = new Date(order.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                let itemsHtml = '<ul>';
                 if (order.pedidoCompleto && Array.isArray(order.pedidoCompleto)) {
                    order.pedidoCompleto.forEach(subPedido => {
                        const subPedidoTotal = parseFloat(subPedido.totalPedido || subPedido.subTotalItem || 0);
                        itemsHtml += `<li><strong>Item:</strong> ${subPedido.produto || 'Item'}<br>`;
                        if (subPedido.sabor) itemsHtml += `&nbsp;&nbsp;Sabor: ${subPedido.sabor}<br>`;
                        if (subPedido.frutas && !subPedido.frutas.includes("Nenhuma")) itemsHtml += `&nbsp;&nbsp;Frutas: ${subPedido.frutas}<br>`;
                        if (subPedido.cremes && !subPedido.cremes.includes("Nenhuma")) itemsHtml += `&nbsp;&nbsp;Cremes: ${subPedido.cremes}<br>`;
                        if (subPedido.acompanhamentos && !subPedido.acompanhamentos.includes("Nenhum")) itemsHtml += `&nbsp;&nbsp;Acompanhamentos: ${subPedido.acompanhamentos}<br>`;
                        if (subPedido.coberturas && !subPedido.coberturas.includes("Nenhuma")) itemsHtml += `&nbsp;&nbsp;Coberturas: ${subPedido.coberturas}<br>`;
                        if (subPedido.adicionais && !subPedido.adicionais.includes("Nenhum")) itemsHtml += `&nbsp;&nbsp;Adicionais: ${subPedido.adicionais}<br>`;
                        itemsHtml += `&nbsp;&nbsp;<strong>Subtotal: R$ ${subPedidoTotal.toFixed(2).replace('.', ',')}</strong></li>`;
                    });
                }
                itemsHtml += '</ul>';

                orderDiv.innerHTML = `
                    <h4>Pedido de ${order.cliente || 'Cliente não informado'} às ${orderTime}</h4>
                    <p><strong>Valor Total do Pedido: R$ ${(parseFloat(order.valorTotal) || 0).toFixed(2).replace('.', ',')}</strong></p>
                    <p><strong>Pagamento:</strong> ${order.metodoPagamento || 'N/A'}</p>
                    <p><strong>Entrega/Retirada:</strong> ${order.tipoEntrega || 'N/A'}</p>
                    <div><strong>Detalhes:</strong>${itemsHtml}</div>
                `;
                groupContainerDiv.appendChild(orderDiv);
            });
            ordersReportContainer.appendChild(groupContainerDiv);
        });
    }


    function updateActiveButton(activeButton) {
        [viewByDayButton, viewByMonthButton].forEach(button => button?.classList.remove('active'));
        activeButton?.classList.add('active');
    }

    if (viewByDayButton) {
        viewByDayButton.addEventListener('click', () => {
            currentViewMode = 'day';
            updateActiveButton(viewByDayButton);
            displayOrdersByGroup(allOrdersCache, currentViewMode);
        });
    }
    if (viewByMonthButton) {
        viewByMonthButton.addEventListener('click', () => {
            currentViewMode = 'month';
            updateActiveButton(viewByMonthButton);
            displayOrdersByGroup(allOrdersCache, currentViewMode);
        });
    }

    if (refreshOrdersButton) {
        refreshOrdersButton.addEventListener('click', () => fetchAndProcessOrders(true));
    }

    // --- CHAMADAS INICIAIS ---
    fetchItemsAvailability();
    fetchAndProcessOrders(true);
    updateActiveButton(viewByDayButton);
});
