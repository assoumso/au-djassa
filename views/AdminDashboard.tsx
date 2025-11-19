
import React, { useState } from 'react';
import { Product, Supplier, Order, OrderStatus } from '../types';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { 
  LayoutDashboard, Users, ShoppingBag, FileText, TrendingUp, CheckCircle, XCircle, AlertTriangle, Trash2, Megaphone, Search, ShieldCheck
} from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  suppliers: Supplier[];
  orders: Order[];
  onDeleteProduct: (id: string) => void;
  onTogglePromotion: (id: string) => void;
  onToggleVerification: (id: string) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

type AdminTab = 'overview' | 'users' | 'products' | 'transactions';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, 
  suppliers, 
  orders, 
  onDeleteProduct,
  onTogglePromotion,
  onToggleVerification
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // --- STATISTICS CALCULATION ---
  const totalRevenue = orders
    .filter(o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.PENDING)
    .reduce((sum, o) => sum + o.totalPrice, 0);
  
  const totalOrders = orders.length;
  
  const avgSatisfaction = (suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1);
  
  // Data for Charts
  const salesData = [
    { name: 'Lun', ventes: 120000 }, { name: 'Mar', ventes: 150000 },
    { name: 'Mer', ventes: 180000 }, { name: 'Jeu', ventes: 140000 },
    { name: 'Ven', ventes: 250000 }, { name: 'Sam', ventes: 300000 },
    { name: 'Dim', ventes: 200000 }
  ];

  const popularProductsData = products
    .map(p => ({
      name: p.name.substring(0, 15) + '...',
      sales: orders.filter(o => o.productId === p.id).reduce((sum, o) => sum + o.quantity, 0)
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">+12.5%</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{totalRevenue.toLocaleString()} FCFA</h3>
                <p className="text-sm text-slate-500">Ventes Totales (Confirmées)</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">+5.2%</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{totalOrders}</h3>
                <p className="text-sm text-slate-500">Commandes Totales</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{suppliers.length}</h3>
                <p className="text-sm text-slate-500">Fournisseurs Inscrits</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{avgSatisfaction}/5.0</h3>
                <p className="text-sm text-slate-500">Taux de Satisfaction</p>
              </div>
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Évolution des Ventes (7 jours)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                      <defs>
                        <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="ventes" stroke="#6366f1" fillOpacity={1} fill="url(#colorVentes)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Produits Populaires (Top 5)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={popularProductsData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} />
                      <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
             <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
               <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                 <input 
                    type="text" 
                    placeholder="Rechercher un fournisseur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                 />
               </div>
               <div className="text-sm text-slate-500">
                 {filteredSuppliers.length} fournisseurs trouvés
               </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                   <tr>
                     <th className="px-6 py-4">Fournisseur</th>
                     <th className="px-6 py-4">Catégorie</th>
                     <th className="px-6 py-4">Note</th>
                     <th className="px-6 py-4">Statut KYC</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {filteredSuppliers.map(supplier => (
                     <tr key={supplier.id} className="hover:bg-slate-50">
                       <td className="px-6 py-4 font-medium text-slate-900">{supplier.name}</td>
                       <td className="px-6 py-4">{supplier.category}</td>
                       <td className="px-6 py-4 flex items-center">
                         <span className="text-yellow-500 font-bold mr-1">{supplier.rating}</span>/5
                       </td>
                       <td className="px-6 py-4">
                         {supplier.verified ? (
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                             <ShieldCheck className="w-3 h-3 mr-1" />
                             Vérifié
                           </span>
                         ) : (
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                             <AlertTriangle className="w-3 h-3 mr-1" />
                             En attente
                           </span>
                         )}
                       </td>
                       <td className="px-6 py-4 text-right space-x-2">
                         <button 
                           onClick={() => onToggleVerification(supplier.id)}
                           className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                             supplier.verified 
                              ? 'border-red-200 text-red-600 hover:bg-red-50' 
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 bg-emerald-50/50'
                           }`}
                         >
                           {supplier.verified ? 'Révoquer' : 'Valider KYC'}
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-6">
             <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
               <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                 <input 
                    type="text" 
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                 />
               </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                   <tr>
                     <th className="px-6 py-4">Produit</th>
                     <th className="px-6 py-4">Vendeur</th>
                     <th className="px-6 py-4">Prix</th>
                     <th className="px-6 py-4 text-center">Publicité (Ads)</th>
                     <th className="px-6 py-4 text-right">Modération</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {filteredProducts.map(product => (
                     <tr key={product.id} className="hover:bg-slate-50">
                       <td className="px-6 py-4">
                         <div className="flex items-center">
                           <img src={product.imageUrl} className="w-8 h-8 rounded object-cover mr-3" alt="" />
                           <span className="font-medium text-slate-900">{product.name}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4 text-slate-500">{product.supplierName}</td>
                       <td className="px-6 py-4 font-medium">{product.price.toLocaleString()} FCFA</td>
                       <td className="px-6 py-4 text-center">
                         <button 
                            onClick={() => onTogglePromotion(product.id)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${product.isPromoted ? 'bg-indigo-600' : 'bg-slate-200'}`}
                         >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${product.isPromoted ? 'translate-x-5' : 'translate-x-0'}`} />
                         </button>
                         {product.isPromoted && <span className="ml-2 text-xs text-indigo-600 font-bold">Actif</span>}
                       </td>
                       <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => onDeleteProduct(product.id)}
                           className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                           title="Supprimer ce produit"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        );

      case 'transactions':
        return (
          <div className="space-y-6">
             <h3 className="text-lg font-bold text-slate-900">Chronologie des Transactions</h3>
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4">ID Commande</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Montant</th>
                        <th className="px-6 py-4">Paiement</th>
                        <th className="px-6 py-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.sort((a,b) => b.date - a.date).map(order => (
                        <tr key={order.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">#{order.id}</td>
                          <td className="px-6 py-4 text-slate-600">{new Date(order.date).toLocaleDateString()} {new Date(order.date).toLocaleTimeString()}</td>
                          <td className="px-6 py-4 font-medium text-slate-900">{order.customerName}</td>
                          <td className="px-6 py-4 text-slate-500">{order.customerContact || '-'}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{order.totalPrice.toLocaleString()} FCFA</td>
                          <td className="px-6 py-4">
                            {order.paymentDetails ? (
                              order.paymentDetails.method === 'CASH_ON_DELIVERY' ? (
                                <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-200">
                                  Espèces (Livraison)
                                </span>
                              ) : (
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                                  {order.paymentDetails.provider}
                                </span>
                              )
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === OrderStatus.DELIVERED ? 'bg-emerald-100 text-emerald-800' :
                              order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-800' :
                              'bg-indigo-100 text-indigo-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50">
       {/* Sidebar Admin */}
       <div className="w-64 bg-slate-900 text-white hidden md:block">
         <div className="p-6">
           <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
               <LayoutDashboard className="w-6 h-6 text-white" />
             </div>
             <div>
               <h2 className="font-bold">ADMIN</h2>
               <p className="text-xs text-slate-400">Panel de contrôle</p>
             </div>
           </div>

           <nav className="space-y-2">
             {[
               { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
               { id: 'users', label: 'Utilisateurs (Fournisseurs)', icon: Users },
               { id: 'products', label: 'Modération & Pubs', icon: Megaphone },
               { id: 'transactions', label: 'Transactions', icon: FileText },
             ].map(item => (
               <button
                 key={item.id}
                 onClick={() => setActiveTab(item.id as AdminTab)}
                 className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                   activeTab === item.id 
                     ? 'bg-indigo-600 text-white' 
                     : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                 }`}
               >
                 <item.icon className="w-5 h-5 mr-3" />
                 {item.label}
               </button>
             ))}
           </nav>
         </div>
         
         <div className="p-6 mt-auto border-t border-slate-800">
           <div className="bg-slate-800 rounded-xl p-4">
             <h4 className="text-sm font-bold mb-1">État du Système</h4>
             <div className="flex items-center text-xs text-emerald-400">
               <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
               Opérationnel
             </div>
           </div>
         </div>
       </div>

       {/* Main Content */}
       <div className="flex-1 p-8 overflow-y-auto">
         <div className="mb-8 flex justify-between items-center">
           <h1 className="text-2xl font-bold text-slate-900">
             {activeTab === 'overview' && 'Tableau de Bord Global'}
             {activeTab === 'users' && 'Gestion des Utilisateurs'}
             {activeTab === 'products' && 'Modération & Publicités'}
             {activeTab === 'transactions' && 'Historique des Transactions'}
           </h1>
           <div className="text-sm text-slate-500">
             Dernière mise à jour: {new Date().toLocaleTimeString()}
           </div>
         </div>
         
         {renderContent()}
       </div>
    </div>
  );
};
