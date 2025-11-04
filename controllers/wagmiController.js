// Client-side wrappers that call server API routes for user/transaction persistence.
export async function addUserAction(walletAddress) {
  try {
    if (!walletAddress) return null
    const res = await fetch('/api/users/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress })
    })
    return await res.json()
  } catch (err) {
    console.error('addUserAction error', err)
    return null
  }
}
