import React, { useEffect, useState } from 'react';
import { supabase } from '../../database/supabase';
import { useNotifications } from '../../hooks/useNotifications';
import { FaBox, FaUser, FaCopy, FaArrowLeft, FaTruck, FaCheckCircle, FaBan, FaCreditCard, FaClock, FaChevronDown, FaChevronUp, FaPlus } from 'react-icons/fa';
import Button from '../../components/Button/Button';
import { UploadProductModal } from '../../components/modals/UploadProductModal';
import './AdminView.css';

interface Order {
  order_id: string;
  user_id: string;
  order_date: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
}

interface OrderItem {
  item_id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  size: string;
  notes?: string;
}

interface UserProfile {
  user_id: string;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  address_text?: string;
  address_details?: string;
  google_maps_link?: string;
}

interface Product {
  product_id: string;
  name: string;
  description?: string;
  price: number;
  image_urls?: string[];
}

type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'all';

const AdminView: React.FC = () => {
  const notifications = useNotifications();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [customerInfo, setCustomerInfo] = useState<UserProfile | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isCustomerInfoExpanded, setIsCustomerInfoExpanded] = useState(false);
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

useEffect(() => {
    const checkStaffAccess = async () => {
        try {
            setIsVerifyingAccess(true);
            const { data, error } = await supabase.rpc('is_staff');
            
            if (error || !data) {
                window.location.href = '/';
            } else {
                setIsVerifyingAccess(false);
            }
        } catch (err) {
            console.error('Error checking staff access:', err);
            window.location.href = '/';
        }
    };

    checkStaffAccess();
}, []);

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_all_orders');
      
      if (error) {
        console.error('Error al obtener pedidos:', error);
        notifications.error('Error al cargar los pedidos');
        return;
      }

      setOrders(data || []);
    } catch (err) {
      console.error('Error inesperado:', err);
      notifications.error('Error inesperado al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (order: Order) => {
    try {
      setLoadingDetails(true);
      setSelectedOrder(order);

      // Fetch order items
      const { data: items, error: itemsError } = await supabase.rpc('get_order_items', {
        p_order_id: order.order_id
      });

      if (itemsError) {
        console.error('Error al obtener items:', itemsError);
        notifications.error('Error al cargar los items del pedido');
        return;
      }

      setOrderItems(items || []);

      // Fetch product details for each item
      const productIds: string[] = [...new Set((items as OrderItem[])?.map((item: OrderItem) => item.product_id) || [])];
      const productsData: Record<string, Product> = {};

      for (const productId of productIds) {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('product_id', productId)
          .single();

        if (!productError && productData) {
          productsData[productId] = productData;
        }
      }

      setProducts(productsData);

      // Fetch customer info
      const { data: customerData, error: customerError } = await supabase.rpc('get_user_profile', {
        p_user_id: order.user_id
      });

      if (customerError) {
        console.error('Error al obtener información del cliente:', customerError);
      } else if (customerData && customerData.length > 0) {
        setCustomerInfo(customerData[0]);
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      notifications.error('Error al cargar detalles del pedido');
    } finally {
      setLoadingDetails(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (newStatus === 'all') return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('order_id', orderId);

      if (error) {
        console.error('Error al actualizar estado:', error);
        notifications.error('Error al actualizar el estado del pedido');
        return;
      }

      notifications.success('Estado del pedido actualizado');
      
      // Update local state
      setOrders(orders.map(order => 
        order.order_id === orderId ? { ...order, status: newStatus } : order
      ));

      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      notifications.error('Error al actualizar el estado');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notifications.success('¡Copiado al portapapeles!');
    } catch {
      notifications.error('Error al copiar');
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'paid': return '#3b82f6';
      case 'shipped': return '#8b5cf6';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <FaClock />;
      case 'paid': return <FaCreditCard />;
      case 'shipped': return <FaTruck />;
      case 'delivered': return <FaCheckCircle />;
      case 'cancelled': return <FaBan />;
      default: return <FaBox />;
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'paid': return 'Pagado';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  if (selectedOrder) {
    return (
      <div className="admin-container">
        <div className="order-detail-view">
          <div className="detail-header">
            <Button variant="secondary" onClick={() => setSelectedOrder(null)}>
              <FaArrowLeft /> Volver
            </Button>
            <h1>Pedido #{selectedOrder.order_id.slice(0, 8)}</h1>
          </div>

          {loadingDetails ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Cargando detalles...</p>
            </div>
          ) : (
            <div className="detail-content">
              {/* Left Column: Order Status + Customer Info */}
              <div className="detail-left-column">
                {/* Order Status */}
                <div className="detail-section">
                  <h2>Estado del Pedido</h2>
                  <div className="status-controls">
                    <div className="current-status" style={{ color: getStatusColor(selectedOrder.status) }}>
                      {getStatusIcon(selectedOrder.status)}
                      <span>{getStatusLabel(selectedOrder.status)}</span>
                    </div>
                    <div className="status-buttons">
                      <Button 
                        variant="secondary" 
                        size="small"
                        onClick={() => updateOrderStatus(selectedOrder.order_id, 'pending')}
                        disabled={selectedOrder.status === 'pending'}
                      >
                        Pendiente
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="small"
                        onClick={() => updateOrderStatus(selectedOrder.order_id, 'paid')}
                        disabled={selectedOrder.status === 'paid'}
                      >
                        Pagado
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="small"
                        onClick={() => updateOrderStatus(selectedOrder.order_id, 'shipped')}
                        disabled={selectedOrder.status === 'shipped'}
                      >
                        Enviado
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="small"
                        onClick={() => updateOrderStatus(selectedOrder.order_id, 'delivered')}
                        disabled={selectedOrder.status === 'delivered'}
                      >
                        Entregado
                      </Button>
                      <Button 
                        variant="tertiary" 
                        size="small"
                        onClick={() => updateOrderStatus(selectedOrder.order_id, 'cancelled')}
                        disabled={selectedOrder.status === 'cancelled'}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                  <p className="order-date">
                    Fecha: {new Date(selectedOrder.order_date).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Customer Info */}
                {customerInfo && (
                  <div className="detail-section">
                    <div 
                      className="collapsible-header"
                      onClick={() => setIsCustomerInfoExpanded(!isCustomerInfoExpanded)}
                    >
                      <h2><FaUser /> Información del Cliente</h2>
                      {isCustomerInfoExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                    <div className={`collapsible-content ${isCustomerInfoExpanded ? 'expanded' : 'collapsed'}`}>
                      <div className="customer-info-grid">
                        <div className="info-item">
                          <span className="label">Nombre:</span>
                          <span className="value">{customerInfo.first_name} {customerInfo.last_name}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Email:</span>
                          <span className="value">{customerInfo.email}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Teléfono:</span>
                          <span className="value">{customerInfo.phone || 'No disponible'}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Dirección:</span>
                          <span className="value">{customerInfo.address_text || 'No disponible'}</span>
                        </div>
                        {customerInfo.address_details && (
                          <div className="info-item">
                            <span className="label">Detalles:</span>
                            <span className="value">{customerInfo.address_details}</span>
                          </div>
                        )}
                        {customerInfo.google_maps_link && (
                          <div className="info-item full-width">
                            <span className="label">Google Maps:</span>
                            <Button 
                              variant="secondary" 
                              size="small"
                              onClick={() => copyToClipboard(customerInfo.google_maps_link!)}
                            >
                              <FaCopy /> Copiar Link
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Order Items */}
              <div className="detail-right-column">
                <div className="detail-section">
                  <h2><FaBox /> Productos del Pedido</h2>
                  <div className="order-items-list">
                    {orderItems.map((item) => {
                      const product = products[item.product_id];
                      return (
                        <div key={item.item_id} className="order-item-card">
                          {product?.image_urls?.[0] && (
                            <img 
                              src={product.image_urls[0]} 
                              alt={product.name}
                              className="item-image"
                            />
                          )}
                          <div className="item-details">
                            <h3>{product?.name || 'Producto'}</h3>
                            <p className="item-meta">
                              Talla: <strong>{item.size}</strong> | 
                              Cantidad: <strong>{item.quantity}</strong> | 
                              Precio unitario: <strong>${item.unit_price.toLocaleString('es-CO')}</strong>
                            </p>
                            {item.notes && (
                              <p className="item-notes">Notas: {item.notes}</p>
                            )}
                            <p className="item-total">
                              Subtotal: <strong>${(item.quantity * item.unit_price).toLocaleString('es-CO')}</strong>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="order-total">
                    <h3>Total del Pedido:</h3>
                    <h3>
                      ${orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString('es-CO')}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isVerifyingAccess) {
    return (
      <div className="admin-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Panel de Administración</h1>
        <p>Gestión de Pedidos y Productos</p>
        <button 
          className="admin-upload-btn"
          onClick={() => setIsUploadModalOpen(true)}
        >
          <FaPlus /> Subir Producto
        </button>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Todos ({orders.length})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
            style={{ borderColor: getStatusColor('pending') }}
          >
            {getStatusIcon('pending')} Pendientes ({orders.filter(o => o.status === 'pending').length})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'paid' ? 'active' : ''}`}
            onClick={() => setStatusFilter('paid')}
            style={{ borderColor: getStatusColor('paid') }}
          >
            {getStatusIcon('paid')} Pagados ({orders.filter(o => o.status === 'paid').length})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'shipped' ? 'active' : ''}`}
            onClick={() => setStatusFilter('shipped')}
            style={{ borderColor: getStatusColor('shipped') }}
          >
            {getStatusIcon('shipped')} Enviados ({orders.filter(o => o.status === 'shipped').length})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'delivered' ? 'active' : ''}`}
            onClick={() => setStatusFilter('delivered')}
            style={{ borderColor: getStatusColor('delivered') }}
          >
            {getStatusIcon('delivered')} Entregados ({orders.filter(o => o.status === 'delivered').length})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setStatusFilter('cancelled')}
            style={{ borderColor: getStatusColor('cancelled') }}
          >
            {getStatusIcon('cancelled')} Cancelados ({orders.filter(o => o.status === 'cancelled').length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando pedidos...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <FaBox size={48} />
          <h3>No hay pedidos</h3>
          <p>No se encontraron pedidos con el filtro seleccionado</p>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map((order) => (
            <div 
              key={order.order_id} 
              className="order-card"
              onClick={() => fetchOrderDetails(order)}
            >
              <div className="order-card-header">
                <span className="order-id">#{order.order_id.slice(0, 8)}</span>
                <span 
                  className="order-status-badge"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {getStatusIcon(order.status)}
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <div className="order-card-body">
                <p className="order-date">
                  {new Date(order.order_date).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="order-user-id">Usuario: {order.user_id.slice(0, 8)}...</p>
              </div>
              <div className="order-card-footer">
                <Button variant="secondary" size="small">
                  Ver Detalles
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Product Modal */}
      <UploadProductModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          notifications.success('Producto subido exitosamente');
          setIsUploadModalOpen(false);
        }}
      />
    </div>
  );
};

export default AdminView;