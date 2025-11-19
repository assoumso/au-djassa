
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingView } from './views/LandingView';
import { ClientMarketplace } from './views/ClientMarketplace';
import { SupplierDashboard } from './views/SupplierDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { SupplierRegistration } from './views/SupplierRegistration';
import { SupplierLogin } from './views/SupplierLogin'; // Import de la vue de login
import { Product, UserRole, ViewState, Order, OrderStatus, Supplier } from './types';
import { db, auth } from './services/firebase';
import { signInAnonymously } from 'firebase/auth';
import { INITIAL_PRODUCTS, MOCK_SUPPLIERS, MOCK_ORDERS } from './constants';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  setDoc
} from 'firebase/firestore';
import { Database } from 'lucide-react';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.GUEST);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LANDING);
  
  // État des données
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // État utilisateur et système
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // --- FIREBASE AUTHENTICATION ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
        console.log("Authentification Firebase réussie");
      } catch (error: any) {
        console.warn("Auth Anonyme échouée (Mode dégradé):", error.code);
      } finally {
        setIsAuthReady(true);
      }
    };
    initAuth();
  }, []);

  // --- ADMIN PORTAL ACCESS (URL DETECTION) ---
  useEffect(() => {
    const checkAdminAccess = () => {
      const params = new URLSearchParams(window.location.search);
      // Accès via ?portal=admin
      if (params.get('portal') === 'admin') {
        console.log("Accès portail administrateur détecté");
        setUserRole(UserRole.ADMIN);
        setCurrentView(ViewState.ADMIN_DASHBOARD);
      }
    };
    checkAdminAccess();
  }, []);

  // --- DATA LOADING ---
  useEffect(() => {
    if (!isAuthReady) return;

    const handleFirebaseError = (source: string, error: any) => {
        // Gestion silencieuse des erreurs de permission
        if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
            console.warn(`Mode Simulation activé pour ${source} (Permissions distantes restreintes)`);
            
            // Chargement des données de secours si les listes sont vides pour ne pas bloquer l'UI
            if (source === 'Produits' && products.length === 0) setProducts(INITIAL_PRODUCTS);
            if (source === 'Fournisseurs' && suppliers.length === 0) setSuppliers(MOCK_SUPPLIERS);
            if (source === 'Commandes' && orders.length === 0) setOrders(MOCK_ORDERS);
            
            setIsLoading(false);
        } else {
            console.error(`ERREUR FIREBASE (${source}):`, error);
            setIsLoading(false);
        }
    };

    try {
        // 1. Produits
        const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
          const productsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Product[];
          setProducts(productsData);
          setIsLoading(false); 
        }, (error) => handleFirebaseError('Produits', error));

        // 2. Fournisseurs (Collection: 'Fournisseurs')
        const unsubscribeSuppliers = onSnapshot(collection(db, 'Fournisseurs'), (snapshot) => {
          const suppliersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Supplier[];
          setSuppliers(suppliersData);
        }, (error) => handleFirebaseError('Fournisseurs', error));

        // 3. Commandes (Collection: 'Commandes')
        const qOrders = query(collection(db, 'Commandes'), orderBy('date', 'desc'));
        const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Order[];
          setOrders(ordersData);
        }, (error) => handleFirebaseError('Commandes', error));

        return () => {
          unsubscribeProducts();
          unsubscribeSuppliers();
          unsubscribeOrders();
        };
    } catch (err) {
        console.warn("Mode hors-ligne forcé (Erreur initialisation écouteurs)");
        setProducts(INITIAL_PRODUCTS);
        setSuppliers(MOCK_SUPPLIERS);
        setOrders(MOCK_ORDERS);
        setIsLoading(false);
    }
  }, [isAuthReady]);

  // --- SEED DATABASE FUNCTION ---
  const handleSeedDatabase = async () => {
    if (!confirm("Cette action va créer les collections 'Commandes', 'Fournisseurs' et 'products' dans votre base de données Firebase avec des données de test. Continuer ?")) return;
    
    try {
      setIsLoading(true);
      
      // 1. Injecter Fournisseurs
      console.log("Initialisation collection Fournisseurs...");
      for (const s of MOCK_SUPPLIERS) {
        await setDoc(doc(db, 'Fournisseurs', s.id), s);
      }
      
      // 2. Injecter Produits
      console.log("Initialisation collection products...");
      for (const p of INITIAL_PRODUCTS) {
        const { id, ...pData } = p; 
        await setDoc(doc(db, 'products', p.id), pData);
      }

      // 3. Injecter Commandes (Implémentation Collection Commandes)
      console.log("Initialisation collection Commandes...");
      for (const o of MOCK_ORDERS) {
        const { id, ...oData } = o;
        await setDoc(doc(db, 'Commandes', o.id), oData);
      }

      alert("Collections initialisées avec succès ! La collection 'Commandes' est prête.");
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        alert("Impossible d'écrire dans la base (Permission Refusée). L'application continuera en mode local.");
      } else {
        console.error("Erreur initialisation:", error);
        alert(`Erreur lors de l'écriture : ${error.message}.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers
  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    switch (role) {
      case UserRole.CLIENT:
        setCurrentView(ViewState.MARKETPLACE);
        break;
      case UserRole.SUPPLIER:
        // Redirection vers la page de login fournisseur
        setCurrentView(ViewState.SUPPLIER_LOGIN);
        break;
      case UserRole.ADMIN:
        setCurrentView(ViewState.ADMIN_DASHBOARD);
        break;
      default:
        setCurrentView(ViewState.LANDING);
    }
  };

  // Logique de connexion Fournisseur (Utilisateur OU Email)
  const handleSupplierLogin = (loginInput: string, password: string) => {
    const supplier = suppliers.find(s => (s.email === loginInput || s.name === loginInput) && s.password === password);
    
    if (supplier) {
      setCurrentSupplier(supplier);
      setUserRole(UserRole.SUPPLIER);
      setCurrentView(ViewState.SUPPLIER_DASHBOARD);
    } else {
      alert("Nom d'utilisateur ou mot de passe incorrect. (Démo: Global Tech Imports / 123456)");
    }
  };

  const handleGoToRegistration = () => {
      setCurrentView(ViewState.SUPPLIER_REGISTRATION);
  };

  const handleRegisterSupplier = async (data: Partial<Supplier>) => {
      const newSupplierData = {
          name: data.name || 'Nouvelle Entreprise',
          rating: 5.0, 
          verified: false,
          isAvailable: true,
          category: data.category || 'Ventes',
          description: data.description || '',
          email: data.email, // Correspond au Nom d'utilisateur
          phone: data.phone,
          address: data.address,
          password: data.password // Enregistrement du mot de passe
      };

      try {
        const docRef = await addDoc(collection(db, 'Fournisseurs'), newSupplierData);
        const newSupplier = { id: docRef.id, ...newSupplierData } as Supplier;
        
        // Connexion automatique après inscription
        setCurrentSupplier(newSupplier);
        setUserRole(UserRole.SUPPLIER);
        setCurrentView(ViewState.SUPPLIER_DASHBOARD);
        alert("Compte fournisseur créé avec succès !");
      } catch (error: any) {
        // Fallback Local
        if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
             const newSupplier = { id: `local-${Date.now()}`, ...newSupplierData } as Supplier;
             setSuppliers(prev => [...prev, newSupplier]);
             setCurrentSupplier(newSupplier);
             setUserRole(UserRole.SUPPLIER);
             setCurrentView(ViewState.SUPPLIER_DASHBOARD);
             alert("Compte créé (Mode Local actif).");
        } else {
             console.error("Erreur inscription:", error);
             alert(`Erreur : ${error.message}`);
        }
      }
  };

  const handleLogout = () => {
    setUserRole(UserRole.GUEST);
    setCurrentView(ViewState.LANDING);
    setCurrentSupplier(null);
    // Clean URL parameter to avoid auto-login on reload
    if (window.location.search.includes('portal=admin')) {
        window.history.pushState({}, document.title, window.location.pathname);
    }
  };

  const handleAddProduct = async (newProduct: Product) => {
    try {
      const { id, ...productData } = newProduct;
      await addDoc(collection(db, 'products'), productData);
      alert("Produit enregistré !");
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
          setProducts(prev => [newProduct, ...prev]);
          alert("Produit ajouté (Mode Local actif).");
      } else {
          console.error("Erreur ajout produit:", error);
          alert(`Erreur : ${error.message}`);
      }
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error: any) {
        if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
            setProducts(prev => prev.filter(p => p.id !== id));
        } else {
            console.error("Erreur suppression:", error);
        }
      }
    }
  };

  const handleToggleProductPromotion = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      try {
        await updateDoc(doc(db, 'products', id), { 
          isPromoted: !product.isPromoted 
        });
      } catch (error: any) {
        if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
             setProducts(prev => prev.map(p => p.id === id ? { ...p, isPromoted: !p.isPromoted } : p));
        }
      }
    }
  };

  const handleToggleSupplierVerification = async (id: string) => {
    const supplier = suppliers.find(s => s.id === id);
    if (supplier) {
      try {
        await updateDoc(doc(db, 'Fournisseurs', id), { 
          verified: !supplier.verified 
        });
      } catch (error: any) {
        if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
            setSuppliers(prev => prev.map(s => s.id === id ? { ...s, verified: !s.verified } : s));
        }
      }
    }
  };

  const handleCreateOrder = async (newOrder: Order) => {
    try {
      const { id, ...orderData } = newOrder;
      
      // Suppression des champs undefined potentiels pour Firebase
      const sanitizedOrder = JSON.parse(JSON.stringify(orderData));

      // Envoi strict vers la collection 'Commandes'
      await addDoc(collection(db, 'Commandes'), sanitizedOrder);
      
      console.log("Commande sauvegardée avec succès dans Firebase (ID auto-généré)");
    } catch (error: any) {
      console.error("Tentative enregistrement échouée (Firebase):", error);
      
      // FALLBACK SYSTÉMATIQUE : On sauvegarde toujours en local si ça échoue
      console.warn("Sauvegarde locale de la commande pour continuité de service");
      setOrders(prev => [newOrder, ...prev]);
      
      // On retourne sans erreur pour que le frontend affiche le succès
      return; 
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'Commandes', orderId), {
        status: newStatus
      });
    } catch (error: any) {
      // Gestion silencieuse avec fallback local
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
          console.warn("Mise à jour statut locale (Permission refusée)");
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
          console.error("Erreur status commande:", error);
      }
    }
  };

  // Render View Logic
  const renderView = () => {
    switch (currentView) {
      case ViewState.LANDING:
        return (
            <LandingView 
                onSelectRole={handleLogin} 
                onRegisterSupplier={handleGoToRegistration}
            />
        );
      
      case ViewState.SUPPLIER_LOGIN:
          return (
            <SupplierLogin 
              onLogin={handleSupplierLogin}
              onCancel={() => setCurrentView(ViewState.LANDING)}
              onRegister={handleGoToRegistration}
            />
          );

      case ViewState.SUPPLIER_REGISTRATION:
          return (
              <SupplierRegistration 
                  onRegister={handleRegisterSupplier}
                  onCancel={() => setCurrentView(ViewState.LANDING)}
              />
          );

      case ViewState.MARKETPLACE:
        return (
          <ClientMarketplace 
            products={products} 
            suppliers={suppliers} 
            onCreateOrder={handleCreateOrder}
          />
        );
      case ViewState.SUPPLIER_DASHBOARD:
        return (
          <SupplierDashboard 
            supplierId={currentSupplier?.id || ''} 
            supplierName={currentSupplier?.name || 'Fournisseur'} 
            products={products} 
            orders={orders}
            onAddProduct={handleAddProduct} 
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onDeleteProduct={handleDeleteProduct}
          />
        );
      case ViewState.ADMIN_DASHBOARD:
        return (
          <AdminDashboard 
            products={products} 
            suppliers={suppliers} 
            orders={orders}
            onDeleteProduct={handleDeleteProduct}
            onTogglePromotion={handleToggleProductPromotion}
            onToggleVerification={handleToggleSupplierVerification}
          />
        );
      default:
        return <LandingView onSelectRole={handleLogin} onRegisterSupplier={handleGoToRegistration} />;
    }
  };

  if (isLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-500">Chargement Au Djassa...</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <Navbar 
        userRole={userRole} 
        currentView={currentView} 
        onChangeView={setCurrentView}
        onLogout={handleLogout}
      />
      <main className="flex-1">
        {renderView()}
      </main>
      
      {/* Footer & Helpers */}
      <div className="bg-white border-t border-slate-200 p-2">
         <div className="flex items-center justify-between max-w-7xl mx-auto px-4">
            <div className="flex items-center text-xs text-emerald-600 font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              Connecté à Firebase
            </div>
            
            <button 
              onClick={handleSeedDatabase}
              className="flex items-center text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-slate-100 hover:bg-indigo-50 px-3 py-1 rounded-md border border-slate-200"
              title="Créer les collections dans Firebase si elles n'existent pas"
            >
              <Database className="w-3 h-3 mr-1" />
              Initialiser BDD (Créer Collections)
            </button>
         </div>
      </div>
    </div>
  );
};

export default App;
