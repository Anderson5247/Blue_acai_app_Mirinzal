const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
// Correção 1: Usar a porta do ambiente (process.env.PORT) ou 3000 como padrão
const PORT = process.env.PORT || 3000;

// Middleware para servir arquivos estáticos da pasta 'public'
// Esta linha vai funcionar corretamente após movermos os arquivos HTML/CSS/JS/Imagens para a pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));
// Middleware para permitir que o Express entenda JSON no corpo das requisições
app.use(express.json());

const itemsFilePath = path.join(__dirname, 'items.json');
const ordersFilePath = path.join(__dirname, 'orders.json'); // Caminho para o arquivo de pedidos

// Correção 2: REMOVER as rotas app.get('/') e app.get('/admin') abaixo
/*
// Rota para a página principal do cardápio (REMOVIDA)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para a página de administração (REMOVIDA)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});
*/

// API: Obter todos os itens e sua disponibilidade
app.get('/api/items', (req, res) => {
    fs.readFile(itemsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Erro ao ler items.json:", err);
            return res.status(500).send('Erro ao ler dados dos itens.');
        }
        try {
            res.json(JSON.parse(data));
        } catch (parseError) {
            console.error("Erro ao fazer parse do items.json:", parseError);
            res.status(500).send('Erro interno ao processar dados dos itens.');
        }
    });
});

// API: Atualizar a disponibilidade dos itens
app.post('/api/items', (req, res) => {
    const updatedItemsData = req.body;
    fs.writeFile(itemsFilePath, JSON.stringify(updatedItemsData, null, 2), 'utf8', (err) => {
        if (err) {
            console.error("Erro ao salvar items.json:", err);
            return res.status(500).send('Erro ao salvar dados dos itens.');
        }
        res.json({ message: 'Disponibilidade dos itens atualizada com sucesso!' });
    });
});

// ROTA ATUALIZADA para salvar o status da loja e dos locais de entrega
app.post('/api/shop-info', (req, res) => {
    // 1. AGORA TAMBÉM RECEBE 'deliveryLocations'
    const { isOpen, closedMessage, isDeliveryAvailable, deliveryLocations } = req.body;

    fs.readFile(itemsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Erro ao ler items.json para atualizar o status:", err);
            return res.status(500).send('Erro ao ler dados dos itens.');
        }
        try {
            const itemsData = JSON.parse(data);
            
            if (!itemsData.shopInfo) {
                itemsData.shopInfo = {};
            }

            // Atualiza as informações antigas
            itemsData.shopInfo.isOpen = isOpen;
            itemsData.shopInfo.closedMessage = closedMessage;
            itemsData.shopInfo.isDeliveryAvailable = isDeliveryAvailable;
            
            // 2. ADICIONA A NOVA INFORMAÇÃO DOS LOCAIS DE ENTREGA ANTES DE SALVAR
            if (deliveryLocations) {
                itemsData.shopInfo.deliveryLocations = deliveryLocations;
            }

            fs.writeFile(itemsFilePath, JSON.stringify(itemsData, null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error("Erro ao salvar status da loja em items.json:", writeErr);
                    return res.status(500).send('Erro ao salvar o status da loja.');
                }
                // A mensagem de sucesso permanece a mesma
                res.json({ message: 'Status da loja atualizado com sucesso!' });
            });
        } catch (parseError) {
            console.error("Erro ao fazer parse do items.json para atualizar status:", parseError);
            res.status(500).send('Erro interno ao processar dados dos itens.');
        }
    });
});
// --- ROTAS PARA PEDIDOS ---

// API: Registrar um novo pedido
app.post('/api/orders', (req, res) => {
    const newOrder = req.body;
    newOrder.timestamp = new Date().toISOString(); // Adiciona data e hora ao pedido

    fs.readFile(ordersFilePath, 'utf8', (err, data) => {
        let orders = [];
        if (err && err.code !== 'ENOENT') { // ENOENT = file not found, o que é ok
            console.error("Erro ao ler orders.json:", err);
            return res.status(500).send('Erro ao processar pedido.');
        }

        if (!err && data) { // Se não houve erro e há dados, faz o parse
            try {
                orders = JSON.parse(data);
                if (!Array.isArray(orders)) { // Garante que seja um array
                    console.warn("orders.json não continha um array. Resetando para array vazio.");
                    orders = [];
                }
            } catch (parseError) {
                console.error("Erro ao fazer parse do orders.json (será sobrescrito com novo pedido em um array):", parseError);
                orders = []; // Se o JSON estiver corrompido, começa um novo array
            }
        }
        // Se err.code === 'ENOENT' (arquivo não existe), orders já é []

        orders.push(newOrder);

        fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2), 'utf8', (err) => {
            if (err) {
                console.error("Erro ao salvar novo pedido em orders.json:", err);
                return res.status(500).send('Erro ao salvar pedido.');
            }
            res.status(201).json({ message: 'Pedido registrado com sucesso!', order: newOrder });
        });
    });
});

// API: Obter todos os pedidos registrados
app.get('/api/orders', (req, res) => {
    fs.readFile(ordersFilePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') { // Se o arquivo não existir, retorna array vazio
                return res.json([]);
            }
            console.error("Erro ao ler orders.json:", err);
            return res.status(500).send('Erro ao ler dados dos pedidos.');
        }
        try {
            // Garante que mesmo um arquivo vazio seja tratado como um array vazio
            const ordersData = data ? JSON.parse(data) : [];
            res.json(ordersData);
        } catch (parseError) {
            console.error("Erro ao fazer parse do orders.json:", parseError);
            res.json([]); // Retorna array vazio se o JSON estiver corrompido
        }
    });
});

// --- FIM DAS ROTAS PARA PEDIDOS ---

// Correção 1 (continuação): Usar a variável PORT configurada acima
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse o cardápio e o admin pela URL principal fornecida pela plataforma.`);
});

