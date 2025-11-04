export async function addTransaction({ walletAddress, txHash, type = 'other', token = '', amount = '', status = 'pending', meta = {} }) {
  try {
    if (!walletAddress) return null
    const res = await fetch('/api/transactions/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, txHash, type, token, amount, status, meta })
    })
    return await res.json()
  } catch (err) {
    console.error('addTransactionAction error', err)
    return null
  }
}

export async function getTransactions({ walletAddress, type } = {}) {
  try {
    if (!walletAddress) return { items: [] }
    const res = await fetch('/api/transactions/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, type })
    })
    return await res.json()
  } catch (err) {
    console.error('getTransactionsAction error', err)
    return { items: [] }
  }
}
