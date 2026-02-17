
import React, { useState } from 'react';
import { Product, CartItem, Sale, Client } from '../types';

interface PosTerminalViewProps {
  products: Product[];
  clients?: Client[]; // Optional for now to avoid breaking other views immediately if not updated
  initialClient?: Client | null;
  onProcessSale: (sale: Sale) => void;
  t: any;
  initialSearchTerm?: string;
}

const PosTerminalView: React.FC<PosTerminalViewProps> = ({ products, clients = [], initialClient, onProcessSale, t, initialSearchTerm = '' }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedClient, setSelectedClient] = useState<Client | null>(initialClient || null);
  const [isCredit, setIsCredit] = useState(false);
  const [discountRate, setDiscountRate] = useState(0);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [pendingSale, setPendingSale] = useState<Sale | null>(null);

  // Sync search term if passed from outside (e.g. dashboard search)
  React.useEffect(() => {
    if (initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);

  const addToCart = (product: Product) => {
    if (product.stock_total <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cantidad >= product.stock_total) return prev;
        return prev.map(item => item.id === product.id ? {
          ...item,
          cantidad: item.cantidad + 1,
          subtotal: (item.cantidad + 1) * item.precio_unitario
        } : item);
      }
      return [...prev, {
        ...product,
        cantidad: 1,
        precio_unitario: product.precio_venta_base || 0,
        descuento: 0,
        subtotal: product.precio_venta_base || 0
      } as CartItem];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const newQty = Math.max(0, item.cantidad + delta);
        if (product && newQty > product.stock_total) return item;
        return {
          ...item,
          cantidad: newQty,
          subtotal: newQty * item.precio_unitario
        };
      }
      return item;
    }).filter(item => item.cantidad > 0));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const discountAmount = subtotal * (discountRate / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const itbis = subtotalAfterDiscount * 0.18;
  const total = subtotalAfterDiscount + itbis;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Create the sale object but don't process it yet
    const newSale: Sale = {
      id: `FAC-${Date.now().toString().slice(-6)}`,
      fecha: new Date().toISOString(),
      items: cart,
      subtotal: subtotalAfterDiscount,
      itbis,
      total,
      estado: 'activa',
      cliente_id: selectedClient?.id,
      es_credito: isCredit,
      descuento_global: discountAmount
    };

    setPendingSale(newSale);
    setShowInvoiceModal(true);
  };

  const confirmSale = () => {
    if (pendingSale) {
      onProcessSale(pendingSale);
      setShowInvoiceModal(false);
      setPendingSale(null);
      setCart([]);
      setIsCredit(false);
      setDiscountRate(0);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    return (p.name || '').toLowerCase().includes(term) ||
      (p.sku || '').toLowerCase().includes(term) ||
      (p.marca || '').toLowerCase().includes(term) ||
      (p.modelo || '').toLowerCase().includes(term) ||
      (p.medida || '').toLowerCase().includes(term);
  });

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-hidden bg-slate-50 dark:bg-background-dark">
        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              placeholder={t.search}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-primary"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className={`bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-primary/50 transition-all cursor-pointer relative flex flex-col ${product.stock_total === 0 ? 'opacity-50 grayscale' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center">
                    <span className="material-icons text-slate-300 text-3xl">tire_repair</span>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${product.stock_total > 0 ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {product.stock_total} DISP
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-2">{product.name || `${product.marca} ${product.modelo}`}</h3>
                  <p className="text-xs text-slate-500 mt-1">{product.medida}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-sm font-bold text-primary">RD$ {(product.precio_venta_base || 0).toLocaleString()}</span>
                  <button className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><span className="material-icons text-sm">add</span></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="w-full lg:w-[400px] h-auto lg:h-full bg-white dark:bg-surface-dark border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl relative z-10">
        <div className="p-4 lg:p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-bold text-lg mb-4">{t.cart}</h2>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 w-full">
                <span className="material-icons text-slate-400">person</span>
                <select
                  className="flex-1 bg-transparent text-sm font-bold dark:text-slate-300 border-none outline-none cursor-pointer focus:ring-0"
                  value={selectedClient?.id || ''}
                  onChange={(e) => {
                    const client = clients?.find(c => c.id === e.target.value);
                    setSelectedClient(client || null);
                    // Set default discount if client has one
                    if (client && client.descuento_fijo) {
                      setDiscountRate(client.descuento_fijo);
                    } else {
                      setDiscountRate(0); // Reset if no fixed discount
                    }
                  }}
                >
                  <option value="">Consumidor Final</option>
                  {clients?.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer" onClick={() => setIsCredit(!isCredit)}>
                <label className="text-xs font-bold text-slate-500 uppercase cursor-pointer">Credit Sale</label>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isCredit ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                  {isCredit && <span className="material-icons text-white text-xs">check</span>}
                </div>
              </div>
              <div className="w-1/3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Discount %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-800 dark:text-slate-200 focus:ring-0"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll max-h-[300px] lg:max-h-none">
          {cart.length === 0 ? (
            <div className="h-32 lg:h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
              <span className="material-icons text-5xl mb-2">shopping_bag</span>
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold truncate dark:text-slate-200">{item.name || `${item.marca} ${item.modelo}`}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center dark:text-white">-</button>
                      <span className="text-xs font-bold w-4 text-center dark:text-slate-300">{item.cantidad}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center dark:text-white">+</button>
                    </div>
                    <span className="text-xs font-bold dark:text-slate-200">RD$ {item.subtotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 lg:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>RD$ {subtotal.toLocaleString()}</span></div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600"><span>Discount ({discountRate}%)</span><span>- RD$ {discountAmount.toLocaleString()}</span></div>
            )}
            <div className="flex justify-between text-slate-500"><span>Tax (18%)</span><span>RD$ {itbis.toLocaleString()}</span></div>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-end">
            <span className="text-lg font-bold dark:text-slate-200">Total</span>
            <span className="text-xl font-bold text-primary">RD$ {total.toLocaleString()}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-primary hover:bg-primary-dark disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98]"
          >
            {t.checkout}
          </button>
        </div>
      </aside>

      {/* Invoice Modal for PDF Preview/Printing */}
      {showInvoiceModal && pendingSale && (
        <div id="invoice-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0">
          {/* Print Styles to hide background app */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #invoice-modal, #invoice-modal * {
                visibility: visible;
              }
              #invoice-modal {
                position: fixed;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                background: white;
                display: flex;
                align-items: flex-start;
                justify-content: center;
              }
              /* Hide scrollbars during print */
              ::-webkit-scrollbar {
                  display: none;
              }
              @page { margin: 0; }
            }
          `}</style>

          <div className="bg-white text-slate-900 w-full max-w-md shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none print:h-screen print:flex print:flex-col">
            <div className="p-6 print:p-8 flex-1">
              <div id="invoice-content" className="space-y-6">
                <div className="text-center border-b border-dashed border-slate-300 pb-4">
                  <h1 className="text-2xl font-bold uppercase tracking-wider">IM APP STORE</h1>
                  <p className="text-xs text-slate-500 mt-1">Santo Domingo, R.D.</p>
                  <p className="text-xs text-slate-500">Tel: (809) 555-5555</p>
                </div>

                <div className="flex justify-between text-xs">
                  <div>
                    <p><span className="font-bold">Fecha:</span> {new Date(pendingSale.fecha).toLocaleDateString()}</p>
                    <p><span className="font-bold">Hora:</span> {new Date(pendingSale.fecha).toLocaleTimeString()}</p>
                  </div>
                  <div className="text-right">
                    <p><span className="font-bold">Factura:</span> {pendingSale.id}</p>
                    <p><span className="font-bold">Tipo:</span> {pendingSale.es_credito ? 'CREDITO' : 'CONTADO'}</p>
                  </div>
                </div>

                <div className="text-xs border-b border-dashed border-slate-300 pb-2">
                  <p><span className="font-bold">Cliente:</span> {selectedClient?.nombre || 'Consumidor Final'}</p>
                  {selectedClient?.rnc_cedula && <p><span className="font-bold">RNC/Ced:</span> {selectedClient.rnc_cedula}</p>}
                </div>

                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-1">Desc</th>
                      <th className="text-center py-1">Cant</th>
                      <th className="text-right py-1">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {pendingSale.items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-1">{item.name || item.sku}</td>
                        <td className="text-center py-1">{item.cantidad}</td>
                        <td className="text-right py-1">{item.subtotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-xs">
                  <div className="flex justify-between"><span>Subtotal</span><span>{pendingSale.subtotal.toLocaleString()}</span></div>
                  {pendingSale.descuento_global && pendingSale.descuento_global > 0 && (
                    <div className="flex justify-between"><span>Descuento</span><span>-{pendingSale.descuento_global.toLocaleString()}</span></div>
                  )}
                  <div className="flex justify-between"><span>ITBIS (18%)</span><span>{pendingSale.itbis.toLocaleString()}</span></div>
                  <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-slate-200"><span>TOTAL</span><span>RD$ {pendingSale.total.toLocaleString()}</span></div>
                </div>

                <div className="text-center text-[10px] text-slate-400 pt-8 mt-auto">
                  <p>*** GRACIAS POR SU COMPRA ***</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex gap-3 print:hidden">
              <button onClick={() => setShowInvoiceModal(false)} className="flex-1 py-3 border border-slate-300 rounded-xl font-bold hover:bg-slate-100 transition-colors">Cancelar</button>
              <button onClick={printInvoice} className="flex-1 py-3 border border-slate-300 rounded-xl font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                <span className="material-icons text-sm">print</span> Imprimir
              </button>
              <button onClick={confirmSale} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosTerminalView;
