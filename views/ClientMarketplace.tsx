
import React, { useState, useMemo } from 'react';
import { Product, Supplier, Order, OrderStatus, PaymentDetails } from '../types';
import { Search, Filter, Tag, X, MessageSquare, Building2, Star, CheckCircle, LayoutGrid, Users, ShoppingBag, Smartphone, CreditCard, Banknote, MapPin, User, Phone, Bell, ArrowLeft, AlertCircle } from 'lucide-react';

interface ClientMarketplaceProps {
  products: Product[];
  suppliers: Supplier[];
  onCreateOrder: (order: Order) => Promise<void>;
}

type TabView = 'products' | 'suppliers';

export const ClientMarketplace: React.FC<ClientMarketplaceProps> = ({ products, suppliers, onCreateOrder }) => {
  // MODIFICATION : L'onglet par défaut est maintenant 'suppliers'
  const [activeTab, setActiveTab] = useState<TabView>('suppliers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tout');
  
  // MODIFICATION : Nouvel état pour stocker le fournisseur sélectionné
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<Supplier | null>(null);
  
  // Product Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Checkout/Payment Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment' | 'processing' | 'success'>('details');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Client Info State
  const [clientInfo, setClientInfo] = useState({
    name: '',
    location: '',
    contact: ''
  });

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'MOBILE_MONEY' | 'CASH_ON_DELIVERY'>('MOBILE_MONEY');
  const [paymentProvider, setPaymentProvider] = useState<'ORANGE' | 'MTN' | 'WAVE'>('ORANGE');

  const categories = ['Tout', ...Array.from(new Set(products.map(p => p.category)))];
  
  // --- CONSTANTES FINANCIÈRES ---
  const SHIPPING_FEES = 300;
  const SERVICE_FEES = 200;

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = product.name.toLowerCase().includes(searchLower) || 
                            product.description.toLowerCase().includes(searchLower) ||
                            product.supplierName.toLowerCase().includes(searchLower) ||
                            product.tags.some(tag => tag.toLowerCase().includes(searchLower));
      const matchesCategory = selectedCategory === 'Tout' || product.category === selectedCategory;
      
      // MODIFICATION : Filtre par fournisseur si un fournisseur est sélectionné
      const matchesSupplier = selectedSupplierFilter ? product.supplierId === selectedSupplierFilter.id : true;

      return matchesSearch && matchesCategory && matchesSupplier;
    });
  }, [products, searchTerm, selectedCategory, selectedSupplierFilter]);

  // Filter Suppliers (Only Available ones)
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      if (!supplier.isAvailable) return false;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = supplier.name.toLowerCase().includes(searchLower) ||
                            (supplier.category && supplier.category.toLowerCase().includes(searchLower));
      
      const matchesCategory = selectedCategory === 'Tout' || supplier.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [suppliers, searchTerm, selectedCategory]);

  // --- ACTIONS DE NAVIGATION ---

  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplierFilter(supplier);
    setActiveTab('products'); // Bascule vers la vue produits
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToSuppliers = () => {
    setSelectedSupplierFilter(null);
    setActiveTab('suppliers');
  };

  const handleTabChange = (tab: TabView) => {
    setActiveTab(tab);
    if (tab === 'suppliers') {
      setSelectedSupplierFilter(null); // Réinitialise le filtre si on clique sur l'onglet Fournisseurs
    }
  };

  // --- LOGIQUE COMMANDE ---

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setOrderQuantity(1);
    setErrorMessage(null);
  };

  const handleStartCheckout = () => {
    if (selectedProduct) {
      setIsCheckoutOpen(true);
      setCheckoutStep('details');
      setPaymentMethod('MOBILE_MONEY'); // Default
      setClientInfo({ name: '', location: '', contact: '' });
      setErrorMessage(null);
    }
  };

  const handleClientInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClientInfo(prev => ({ ...prev, [name]: value }));
    setErrorMessage(null);
  };

  const canProceedToPayment = () => {
    return clientInfo.name.trim() !== '' && clientInfo.location.trim() !== '' && clientInfo.contact.trim() !== '';
  };

  const handleProcessPayment = async () => {
    if (!selectedProduct) return;

    setCheckoutStep('processing');
    setErrorMessage(null);
    
    try {
      const productTotal = selectedProduct.price * orderQuantity;
      // Calcul du total incluant Livraison + Service
      const totalAmount = productTotal + SHIPPING_FEES + SERVICE_FEES;

      let finalPaymentDetails: PaymentDetails;

      if (paymentMethod === 'MOBILE_MONEY') {
          finalPaymentDetails = {
          method: 'MOBILE_MONEY',
          provider: paymentProvider,
          transactionId: `TXN-${Math.floor(Math.random() * 1000000)}`
          };
      } else {
          finalPaymentDetails = {
          method: 'CASH_ON_DELIVERY'
          };
      }

      // Préparation de l'objet commande
      const newOrder: Order = {
          id: `ord-${Date.now()}`,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          quantity: orderQuantity,
          totalPrice: totalAmount,
          shippingFees: SHIPPING_FEES,
          serviceFees: SERVICE_FEES, // Ajout des frais de service
          supplierId: selectedProduct.supplierId,
          customerName: clientInfo.name || 'Anonyme',
          customerContact: clientInfo.contact || 'Non spécifié',
          status: OrderStatus.PENDING,
          date: Date.now(),
          shippingAddress: clientInfo.location || 'Non spécifiée',
          paymentDetails: finalPaymentDetails
      };

      // Appel ASYNCHRONE réel vers Firebase
      await onCreateOrder(newOrder);

      setCheckoutStep('success');
      
      // Fermeture automatique après succès
      setTimeout(() => {
          setIsCheckoutOpen(false);
          handleCloseModal();
          setCheckoutStep('details');
      }, 6000); 

    } catch (err: any) {
      console.error("Erreur lors du traitement:", err);
      setErrorMessage(err.message || "Une erreur est survenue lors de l'enregistrement.");
      setCheckoutStep('payment'); 
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Place de Marché</h2>
        
        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-slate-200">
          <button
            onClick={() => handleTabChange('suppliers')}
            className={`pb-3 px-1 flex items-center font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'suppliers' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Fournisseurs
          </button>
          <button
            onClick={() => handleTabChange('products')}
            className={`pb-3 px-1 flex items-center font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'products' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Produits
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder={activeTab === 'products' ? "Rechercher un produit..." : "Rechercher un fournisseur..."}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            <Filter className="text-slate-400 w-5 h-5 mr-2 flex-shrink-0" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'products' ? (
        // PRODUCTS GRID
        <div>
          {/* En-tête fournisseur si filtré */}
          {selectedSupplierFilter && (
            <div className="mb-6 bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center">
                <div className="bg-white p-2 rounded-full shadow-sm mr-3">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-indigo-500 font-bold uppercase">Boutique de</p>
                  <h3 className="text-lg font-bold text-indigo-900">{selectedSupplierFilter.name}</h3>
                </div>
              </div>
              <button 
                onClick={handleBackToSuppliers}
                className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-white px-3 py-2 rounded-lg border border-indigo-100 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux fournisseurs
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="h-48 overflow-hidden relative cursor-pointer" onClick={() => setSelectedProduct(product)}>
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-slate-700 shadow-sm">
                    {product.category}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 
                      className="text-lg font-bold text-slate-900 line-clamp-1 cursor-pointer hover:text-indigo-600"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {product.name}
                    </h3>
                    <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-md whitespace-nowrap">{product.price.toLocaleString()} FCFA</span>
                  </div>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">{product.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
                        <Tag className="w-3 h-3 mr-1 opacity-50" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between mt-auto">
                    <div className="flex items-center text-sm text-slate-500">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                      {product.supplierName}
                    </div>
                    <button 
                      onClick={() => setSelectedProduct(product)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Voir détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-20">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <ShoppingBag className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 text-lg">Aucun produit trouvé {selectedSupplierFilter ? "pour ce fournisseur" : ""}.</p>
                {selectedSupplierFilter && (
                   <button onClick={handleBackToSuppliers} className="mt-4 text-indigo-600 font-medium hover:underline">
                     Voir les autres fournisseurs
                   </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        // SUPPLIERS GRID
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map(supplier => (
            <div 
               key={supplier.id} 
               onClick={() => handleSelectSupplier(supplier)}
               className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all cursor-pointer group hover:border-indigo-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                  <Building2 className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                {supplier.verified && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Vérifié
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{supplier.name}</h3>
              <p className="text-slate-500 text-sm mb-3">{supplier.category}</p>
              
              <div className="flex items-center mb-4 text-sm">
                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                <span className="font-medium text-slate-900 mr-1">{supplier.rating}</span>
                <span className="text-slate-400">/ 5.0</span>
              </div>
              
              {supplier.description && (
                <p className="text-slate-600 text-sm mb-6 line-clamp-2">
                  {supplier.description}
                </p>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                 <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                   • Disponible
                 </span>
                 <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
                   Voir les produits <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                 </button>
              </div>
            </div>
          ))}
          {filteredSuppliers.length === 0 && (
            <div className="col-span-full text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                 <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Aucun fournisseur trouvé</h3>
              <p className="text-slate-500">Essayez de modifier vos critères de recherche.</p>
            </div>
          )}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && !isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row overflow-hidden">
            <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-slate-100">
               <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="absolute inset-0 w-full h-full object-cover" />
            </div>
            
            <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="inline-block px-2 py-1 rounded bg-indigo-100 text-indigo-700 text-xs font-bold mb-2">{selectedProduct.category}</span>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedProduct.name}</h2>
                  <p className="text-slate-500 text-sm">Vendu par <span className="font-medium text-slate-900">{selectedProduct.supplierName}</span></p>
                </div>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="text-3xl font-bold text-indigo-600 mb-6">{selectedProduct.price.toLocaleString()} FCFA</div>
              
              <div className="prose prose-sm text-slate-600 mb-6">
                <p>{selectedProduct.description}</p>
              </div>

              <div className="mt-auto">
                {/* Ajout Sélecteur Quantité */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantité</label>
                  <div className="flex items-center justify-start space-x-3">
                    <button onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))} className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center hover:bg-slate-200 font-bold">-</button>
                    <input type="number" value={orderQuantity} readOnly className="w-16 h-10 text-center font-medium border border-slate-200 rounded-md outline-none" />
                    <button onClick={() => setOrderQuantity(orderQuantity + 1)} className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center hover:bg-slate-200 font-bold">+</button>
                    <span className="text-sm text-slate-500 font-medium ml-2">
                      Total: {(selectedProduct.price * orderQuantity).toLocaleString()} FCFA
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleStartCheckout}
                    className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Acheter
                  </button>
                  <button className="flex items-center justify-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-3 rounded-xl font-bold transition-all">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Discuter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout / Payment Modal */}
      {isCheckoutOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-indigo-600" />
                Validation de la commande
              </h3>
              {checkoutStep !== 'processing' && checkoutStep !== 'success' && (
                <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              
              {errorMessage && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start text-red-800">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">Erreur de commande</p>
                    <p className="text-sm mt-1">{errorMessage}</p>
                    <p className="text-xs mt-2">Vérifiez votre connexion internet et réessayez.</p>
                  </div>
                </div>
              )}

              {checkoutStep === 'details' && (
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <img src={selectedProduct.imageUrl} className="w-16 h-16 rounded-md object-cover" alt="" />
                    <div>
                       <h4 className="font-bold text-slate-900">{selectedProduct.name}</h4>
                       <p className="text-sm text-slate-500">Prix unitaire: {selectedProduct.price.toLocaleString()} FCFA</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Récapitulatif</label>
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3">
                       <span className="text-slate-600">Quantité: {orderQuantity}</span>
                       <span className="font-bold text-indigo-600">
                        {(selectedProduct.price * orderQuantity).toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>

                  {/* Informations Client (Ajoutées) */}
                  <div className="border-t border-slate-200 pt-4 space-y-4">
                     <h4 className="font-bold text-slate-900 flex items-center">
                       <User className="w-4 h-4 mr-2 text-indigo-600" />
                       Vos Informations
                     </h4>
                     
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Nom & Prénoms</label>
                       <input 
                         type="text" 
                         name="name"
                         value={clientInfo.name}
                         onChange={handleClientInfoChange}
                         placeholder="Ex: Kouassi Jean"
                         className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                       />
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Contact / Téléphone</label>
                       <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                             <Phone className="h-4 w-4 text-slate-400" />
                          </div>
                          <input 
                            type="tel" 
                            name="contact"
                            value={clientInfo.contact}
                            onChange={handleClientInfoChange}
                            placeholder="Ex: 07 07 00 00 00"
                            className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                       </div>
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Localisation de livraison</label>
                       <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                             <MapPin className="h-4 w-4 text-slate-400" />
                          </div>
                          <input 
                            type="text" 
                            name="location"
                            value={clientInfo.location}
                            onChange={handleClientInfoChange}
                            placeholder="Ex: Abidjan, Cocody, Riviera 2"
                            className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                       </div>
                     </div>
                  </div>

                  {/* Résumé des coûts AVEC FRAIS DE SERVICE */}
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-200 mt-4">
                     <div className="flex justify-between text-sm text-slate-600">
                       <span>Sous-total</span>
                       <span>{(selectedProduct.price * orderQuantity).toLocaleString()} FCFA</span>
                     </div>
                     <div className="flex justify-between text-sm text-slate-600">
                       <span>Frais de livraison</span>
                       <span>{SHIPPING_FEES.toLocaleString()} FCFA</span>
                     </div>
                     <div className="flex justify-between text-sm text-slate-600">
                       <span>Frais de service</span>
                       <span>{SERVICE_FEES.toLocaleString()} FCFA</span>
                     </div>
                     <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-lg">
                       <span>Total à payer</span>
                       <span>{((selectedProduct.price * orderQuantity) + SHIPPING_FEES + SERVICE_FEES).toLocaleString()} FCFA</span>
                     </div>
                  </div>

                  <button 
                    onClick={() => setCheckoutStep('payment')}
                    disabled={!canProceedToPayment()}
                    className={`w-full font-bold py-3 rounded-xl transition-colors ${
                      canProceedToPayment() 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Procéder au paiement
                  </button>
                </div>
              )}

              {checkoutStep === 'payment' && (
                <div className="space-y-6">
                   <div className="text-center mb-4">
                      <p className="text-sm text-slate-500">Montant total de la commande</p>
                      <p className="text-3xl font-bold text-slate-900">{((selectedProduct.price * orderQuantity) + SHIPPING_FEES + SERVICE_FEES).toLocaleString()} FCFA</p>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-3">Moyen de paiement</label>
                     <div className="grid grid-cols-2 gap-4 mb-6">
                       <button 
                         onClick={() => setPaymentMethod('MOBILE_MONEY')}
                         className={`p-4 rounded-xl border-2 text-left transition-all ${
                           paymentMethod === 'MOBILE_MONEY' 
                             ? 'border-indigo-600 bg-indigo-50' 
                             : 'border-slate-200 hover:bg-slate-50'
                         }`}
                       >
                         <Smartphone className={`w-6 h-6 mb-2 ${paymentMethod === 'MOBILE_MONEY' ? 'text-indigo-600' : 'text-slate-400'}`} />
                         <div className="font-bold text-sm text-slate-900">Mobile Money</div>
                         <div className="text-xs text-slate-500">Paiement immédiat</div>
                       </button>

                       <button 
                         onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                         className={`p-4 rounded-xl border-2 text-left transition-all ${
                           paymentMethod === 'CASH_ON_DELIVERY' 
                             ? 'border-emerald-600 bg-emerald-50' 
                             : 'border-slate-200 hover:bg-slate-50'
                         }`}
                       >
                         <Banknote className={`w-6 h-6 mb-2 ${paymentMethod === 'CASH_ON_DELIVERY' ? 'text-emerald-600' : 'text-slate-400'}`} />
                         <div className="font-bold text-sm text-slate-900">À la livraison</div>
                         <div className="text-xs text-slate-500">Paiement espèces</div>
                       </button>
                     </div>

                     {paymentMethod === 'MOBILE_MONEY' && (
                       <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                          <div>
                             <label className="block text-xs font-medium text-slate-500 mb-2">Choisir l'opérateur</label>
                             <div className="grid grid-cols-3 gap-3">
                               {[
                                 { id: 'ORANGE', name: 'Orange Money', color: 'border-orange-500 bg-orange-50 text-orange-700' },
                                 { id: 'MTN', name: 'MTN MoMo', color: 'border-yellow-400 bg-yellow-50 text-yellow-800' },
                                 { id: 'WAVE', name: 'Wave', color: 'border-blue-400 bg-blue-50 text-blue-700' }
                               ].map(provider => (
                                 <button
                                   key={provider.id}
                                   onClick={() => setPaymentProvider(provider.id as any)}
                                   className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all ${
                                     paymentProvider === provider.id ? provider.color : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                   }`}
                                 >
                                   {provider.name}
                                 </button>
                               ))}
                             </div>
                          </div>
                       </div>
                     )}

                     {paymentMethod === 'CASH_ON_DELIVERY' && (
                       <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-sm text-emerald-800 animate-in fade-in slide-in-from-top-2 flex items-start">
                         <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                         <p>
                           Vous paierez le montant exact en espèces directement au livreur lors de la réception de votre colis. Prévoyez l'appoint si possible.
                         </p>
                       </div>
                     )}
                   </div>

                   <div className="flex gap-3 mt-6">
                     <button 
                        onClick={() => setCheckoutStep('details')}
                        className="flex-1 bg-white border border-slate-300 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50"
                      >
                        Retour
                      </button>
                      <button 
                        onClick={handleProcessPayment}
                        className={`flex-[2] text-white font-bold py-3 rounded-xl transition-colors shadow-lg ${
                          paymentMethod === 'MOBILE_MONEY' 
                            ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' 
                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                        }`}
                      >
                        {paymentMethod === 'MOBILE_MONEY' ? 'Payer maintenant' : 'Confirmer la commande'}
                      </button>
                   </div>
                </div>
              )}

              {checkoutStep === 'processing' && (
                <div className="py-12 text-center">
                   <div className="relative w-20 h-20 mx-auto mb-6">
                     <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                     <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                   </div>
                   <h4 className="text-xl font-bold text-slate-900 mb-2">Traitement en cours...</h4>
                   <p className="text-slate-500">
                     {paymentMethod === 'MOBILE_MONEY' ? 'Validation du paiement mobile...' : 'Enregistrement de votre commande...'}
                   </p>
                </div>
              )}

              {checkoutStep === 'success' && (
                <div className="py-12 text-center animate-in zoom-in duration-300">
                   <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                     <CheckCircle className="w-10 h-10" />
                   </div>
                   <h4 className="text-xl font-bold text-slate-900 mb-2">Commande Confirmée !</h4>
                   
                   {/* Message d'information clair */}
                   <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mx-auto max-w-sm mb-4 mt-4">
                      <p className="text-indigo-900 font-bold mb-1 flex items-center justify-center">
                        <Bell className="w-4 h-4 mr-2" />
                        Prochaine étape :
                      </p>
                      <p className="text-indigo-700 text-sm">
                        Le fournisseur a bien reçu votre commande. Il vous contactera très prochainement sur votre numéro <span className="font-bold">{clientInfo.contact}</span> pour organiser la livraison.
                      </p>
                   </div>

                   <p className="text-slate-400 text-xs mt-6">
                     Redirection automatique...
                   </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};