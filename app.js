const products = [
  {
    id: 'vip-rank',
    kind: 'rank',
    name: 'VIP Rank',
    category: 'Rank',
    amount: 500,
    description: 'チャット装飾とショップ特典が付くサンプルランクです。'
  },
  {
    id: 'gem-pack',
    kind: 'gems',
    name: 'Gem Pack 1200',
    category: 'Currency',
    amount: 1200,
    description: 'イベント交換や装飾購入に使うサンプルジェムパックです。'
  },
  {
    id: 'builder-kit',
    kind: 'builder',
    name: 'Builder Kit',
    category: 'Kit',
    amount: 850,
    description: '建築素材と便利アイテムをまとめたサンプルキットです。'
  }
];

const defaultApiBase = 'https://karopay.karon.jp';
const apiBaseInput = document.getElementById('api-base');
const receiveCodeInput = document.getElementById('receive-code');
const statusOutput = document.getElementById('shop-status');
const configForm = document.getElementById('shop-config');
const productGrid = document.getElementById('product-grid');
const template = document.getElementById('product-card-template');

apiBaseInput.value = localStorage.getItem('sampleShop.apiBase') || defaultApiBase;
receiveCodeInput.value = localStorage.getItem('sampleShop.receiveCode') || '';

configForm.addEventListener('submit', event => {
  event.preventDefault();
  saveConfig();
});

for (const product of products) {
  productGrid.appendChild(renderProduct(product));
}

updateStatus();

function renderProduct(product) {
  const node = template.content.cloneNode(true);
  const card = node.querySelector('.product-card');
  const small = node.querySelector('small');
  const title = node.querySelector('h3');
  const description = node.querySelector('p');
  const price = node.querySelector('.product-buy strong');
  const button = node.querySelector('button');

  card.classList.add(product.kind);
  small.textContent = product.category;
  title.textContent = product.name;
  description.textContent = product.description;
  price.textContent = `$${product.amount.toLocaleString('en-US')}`;
  button.addEventListener('click', () => buyProduct(product, button));

  return node;
}

function saveConfig() {
  localStorage.setItem('sampleShop.apiBase', cleanApiBase());
  localStorage.setItem('sampleShop.receiveCode', receiveCodeInput.value.trim());
  updateStatus('保存しました', 'ready');
}

function updateStatus(message, tone = '') {
  const receiveCode = receiveCodeInput.value.trim();
  statusOutput.className = tone;
  if (message) {
    statusOutput.textContent = message;
    return;
  }

  if (!receiveCode) {
    statusOutput.textContent = 'サイト用コードを入力してください';
    return;
  }

  statusOutput.className = 'ready';
  statusOutput.textContent = 'KaroPay Checkoutに接続できます';
}

async function buyProduct(product, button) {
  const receiveCode = receiveCodeInput.value.trim();
  if (!receiveCode) {
    updateStatus('サイト用コードを入力してください', 'error');
    receiveCodeInput.focus();
    return;
  }

  saveConfig();
  button.disabled = true;
  button.textContent = '作成中';
  updateStatus(`${product.name} の支払いページを作成中`, 'ready');

  try {
    const apiBase = cleanApiBase();
    const response = await fetch(`${apiBase}/api/checkout/public/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiveCode,
        amount: product.amount,
        description: product.name,
        clientReferenceId: `${product.id}-${Date.now()}`,
        successUrl: `${location.origin}/KaroPayAPISampleSite/success.html`,
        cancelUrl: `${location.origin}/KaroPayAPISampleSite/index.html`
      })
    });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'CHECKOUT_FAILED');
    }

    sessionStorage.setItem('sampleShop.apiBase', apiBase);
    sessionStorage.setItem('sampleShop.lastProduct', JSON.stringify(product));
    location.href = data.url;
  } catch (error) {
    updateStatus(errorMessage(error.message), 'error');
    button.disabled = false;
    button.textContent = '購入';
  }
}

function cleanApiBase() {
  return (apiBaseInput.value.trim() || defaultApiBase).replace(/\/+$/, '');
}

function errorMessage(error) {
  if (error === 'CODE_NOT_FOUND') return 'サイト用コードが無効です';
  if (error === 'INVALID_AMOUNT') return '金額が無効です';
  if (error === 'RATE_LIMITED') return '少し待ってからもう一度試してください';
  return '支払いページを作成できませんでした';
}
