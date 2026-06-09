const receiveCodeInput = document.getElementById('receive-code');
const amountInput = document.getElementById('amount');
const payBtn = document.getElementById('pay-btn');
const statusOutput = document.getElementById('status');

receiveCodeInput.value = localStorage.getItem('sampleShop.receiveCode') || '';

payBtn.addEventListener('click', async () => {
  const receiveCode = receiveCodeInput.value.trim();
  const amount = parseInt(amountInput.value);

  if (!receiveCode) { statusOutput.textContent = 'コードを入力してね'; return; }
  if (!amount || amount <= 0) { statusOutput.textContent = '金額を入れてね'; return; }

  localStorage.setItem('sampleShop.receiveCode', receiveCode);
  payBtn.disabled = true;
  payBtn.textContent = '作成中...';

  try {
    const response = await fetch('https://karopay.karon.jp/api/checkout/public/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiveCode,
        amount,
        description: '寄付',
        successUrl: location.href,
        cancelUrl: location.href
      })
    });
    const data = await response.json();
    if (data.url) {
      location.href = data.url;
    } else {
      throw new Error();
    }
  } catch (e) {
    statusOutput.textContent = 'エラーが発生しました';
    payBtn.disabled = false;
    payBtn.textContent = '決済に進む';
  }
});
