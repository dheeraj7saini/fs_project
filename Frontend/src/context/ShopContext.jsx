import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'

const ShopContext = createContext(null)
const API_BASE_URL = `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')}/api`

function normalizeShop(shop) {
  return {
    id: shop.id,
    name: shop.name,
    category: shop.category ?? 'New Vendor',
    cuisine: shop.cuisine ?? 'Quick Bites',
    eta: shop.eta ?? '15-20 min',
    accent: shop.accent ?? 'ocean',
    status: shop.status?.toLowerCase() ?? 'active',
    menu: (shop.menuItems ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
    })),
  }
}

async function apiRequest(path, options = {}) {
  const { headers: customHeaders = {}, ...restOptions } = options
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
  })

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const errorBody = await response.json()
      message = errorBody.message ?? message
    } catch {
      // Keep fallback message if no JSON body is available.
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

function ShopProvider({ children }) {
  const { token, user } = useAuth()
  const [shops, setShops] = useState([])

  const refreshShops = async () => {
    try {
      const response = await apiRequest('/shops')
      setShops(response.map(normalizeShop))
    } catch {
      setShops([])
    }
  }

  useEffect(() => {
    refreshShops()
  }, [])

  useEffect(() => {
    refreshShops()
  }, [token, user?.shopId])

  const getShopByName = (name) =>
    shops.find((shop) => shop.name.toLowerCase() === (name || '').toLowerCase())

  const getShopById = (id) =>
    shops.find((shop) => shop.id === Number(id))

  const toggleShopStatus = async (shopName) => {
    const shop = getShopByName(shopName)
    if (!shop || !token) {
      return null
    }

    const nextStatus = shop.status === 'active' ? 'PAUSED' : 'ACTIVE'
    const response = await apiRequest(`/vendor/shops/${shop.id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: nextStatus,
      }),
    })

    const normalizedShop = normalizeShop(response)
    setShops((prev) =>
      prev.map((entry) => (entry.id === normalizedShop.id ? normalizedShop : entry)),
    )
    return normalizedShop
  }

  const addMenuItem = async (shopName, item) => {
    const shop = getShopByName(shopName)
    if (!shop || !token) {
      throw new Error('Shop not found')
    }

    await apiRequest(`/vendor/shops/${shop.id}/menu-items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: item.name,
        price: Number(item.price),
      }),
    })

    await refreshShops()
  }

  const value = useMemo(
    () => ({
      shops,
      getShopByName,
      getShopById,
      toggleShopStatus,
      addMenuItem,
      refreshShops,
      currentVendorShop: user?.shopId ? getShopById(user.shopId) ?? null : null,
    }),
    [shops, token, user],
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

const useShop = () => useContext(ShopContext)

export { ShopContext, ShopProvider, useShop }
