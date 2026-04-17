import { useState } from 'react'
import { useOrder } from '../../context/OrderContext'
import { useAuth } from '../../context/AuthContext'
import { useShop } from '../../context/ShopContext'

function ShopStatusBadge({ status }) {
  const badgeClass =
    status === 'paused'
      ? 'app-status-badge app-status-badge--paused'
      : 'app-status-badge app-status-badge--active'

  return <span className={badgeClass}>{status === 'paused' ? 'Paused' : 'Active'}</span>
}

function Dashboard() {
  const { orders, updateOrderStatus } = useOrder()
  const { user } = useAuth()
  const { currentVendorShop, toggleShopStatus, addMenuItem } = useShop()
  const currentShop = currentVendorShop
  const [menuItemName, setMenuItemName] = useState('')
  const [menuItemPrice, setMenuItemPrice] = useState('')
  const [menuError, setMenuError] = useState('')

  const shopOrders = orders.filter(
    (order) =>
      order.shopName?.toLowerCase() === (user?.shopName || '').toLowerCase(),
  )

  const queue = shopOrders
    .filter((order) => order.status !== 'completed')
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

  const ratedOrders = shopOrders.filter((order) => order.rating !== null)
  const averageRating =
    ratedOrders.length > 0
      ? (
          ratedOrders.reduce((total, order) => total + order.rating, 0) /
          ratedOrders.length
        ).toFixed(1)
      : null
  const completedOrders = shopOrders.filter((order) => order.status === 'completed')

  const handleAddMenuItem = async () => {
    if (!menuItemName.trim()) {
      setMenuError('Food name is required.')
      return
    }

    if (!menuItemPrice || Number(menuItemPrice) <= 0) {
      setMenuError('Enter a valid price.')
      return
    }

    try {
      await addMenuItem(user?.shopName, {
        name: menuItemName,
        price: menuItemPrice,
      })

      setMenuItemName('')
      setMenuItemPrice('')
      setMenuError('')
    } catch (error) {
      setMenuError(error.message)
    }
  }

  return (
    <main className="app-page app-page--wide">
      <section className="app-vendor-hero">
        <div>
          <span className="app-eyebrow">Vendor Dashboard</span>
          <h1 className="app-title">{user?.shopName || 'Unknown Shop'}</h1>
          <p className="app-subtitle">Control opening status, watch the live queue, and keep service moving.</p>
          <div className="app-inline">
            <ShopStatusBadge status={currentShop?.status ?? 'active'} />
            <button
              className="app-button"
              type="button"
              onClick={() => toggleShopStatus(user?.shopName)}
            >
              {currentShop?.status === 'paused' ? 'Resume Orders' : 'Pause Orders'}
            </button>
          </div>
        </div>

        <div className="app-vendor-hero__stats">
          <article className="app-stat-card">
            <strong>{queue.length}</strong>
            <span>Pending orders</span>
          </article>
          <article className="app-stat-card">
            <strong>{averageRating ? `${averageRating}/5` : '--'}</strong>
            <span>Average rating</span>
          </article>
          <article className="app-stat-card">
            <strong>{completedOrders.length}</strong>
            <span>Completed today</span>
          </article>
        </div>
      </section>

      <section className="app-card app-vendor-summary">
        <div className="app-inline app-inline--between">
          <div>
            <p className="app-divider-title">Live kitchen board</p>
            <p className="app-muted">Next orders appear first so the team can move in sequence.</p>
          </div>
          <span className="app-chip">Vendor ID: {user?.id}</span>
        </div>
      </section>

      <section className="app-card app-vendor-menu-builder">
        <div className="app-inline app-inline--between">
          <div>
            <p className="app-divider-title">Add food items</p>
            <p className="app-muted">New vendors can build their menu from here.</p>
          </div>
          <span className="app-chip">{currentShop?.menu?.length ?? 0} items</span>
        </div>

        <div className="app-vendor-menu-form">
          <input
            type="text"
            placeholder="Food name"
            value={menuItemName}
            onChange={(event) => setMenuItemName(event.target.value)}
          />
          <input
            type="number"
            min="1"
            placeholder="Price"
            value={menuItemPrice}
            onChange={(event) => setMenuItemPrice(event.target.value)}
          />
          <button className="app-button" type="button" onClick={handleAddMenuItem}>
            Add Food
          </button>
        </div>

        {menuError && <p className="app-error">{menuError}</p>}

        <div className="app-grid app-grid--compact-cards">
          {(currentShop?.menu ?? []).map((item) => (
            <section key={`${currentShop?.id}-${item.id}`} className="app-card app-menu-card">
              <p className="app-divider-title">{item.name}</p>
              <p className="app-muted">Rs. {item.price}</p>
            </section>
          ))}
        </div>
      </section>

      {queue.length === 0 && <p className="app-empty">No pending orders in the queue.</p>}

      <section className="app-grid app-grid--cards">
      {queue.map((order, index) => {
        const position = index + 1
        const isNext = index === 0

        return (
          <section
            key={order.id}
            className={isNext ? 'app-card app-order-card app-order-card--next' : 'app-card app-order-card'}
          >
            {isNext && <p className="app-order-card__highlight">Next to Prepare</p>}
            <div className="app-inline app-inline--between">
              <p className="app-divider-title">Order #{position}</p>
              <span className={order.status === 'ready' ? 'app-status-badge app-status-badge--ready' : 'app-status-badge app-status-badge--busy'}>
                {order.status}
              </span>
            </div>
            <p className="app-muted">Customer: {order.customerName}</p>
            {order.items.map((item, itemIndex) => (
              <p className="app-muted" key={`${order.id}-${item.id}-${itemIndex}`}>
                {item.name} x{item.quantity}
              </p>
            ))}

            <div className="app-inline">
              <button className="app-button app-button--secondary" type="button" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                Accept
              </button>
              <button className="app-button app-button--secondary" type="button" onClick={() => updateOrderStatus(order.id, 'ready')}>
                Ready
              </button>
              <button className="app-button" type="button" onClick={() => updateOrderStatus(order.id, 'completed')}>
                Complete
              </button>
            </div>
          </section>
        )
      })}
      </section>
    </main>
  )
}

export default Dashboard
