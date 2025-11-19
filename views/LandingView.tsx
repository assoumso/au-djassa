
import React from 'react';
import { UserRole } from '../types';
import { User, Briefcase, ArrowRight, UserPlus } from 'lucide-react';

interface LandingViewProps {
  onSelectRole: (role: UserRole) => void;
  onRegisterSupplier: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onSelectRole, onRegisterSupplier }) => {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-slate-50 px-4 relative overflow-hidden">
      {/* Decorative background elements for futuristic feel */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-100/50 blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-emerald-100/50 blur-3xl opacity-60 animate-pulse delay-1000"></div>
      </div>

      <div className="text-center mb-12 max-w-5xl relative z-10">
        <h1 className="text-4xl md:text-6xl font-black mb-4 uppercase tracking-tight leading-tight bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 text-transparent bg-clip-text drop-shadow-sm filter">
          AU DJASSA, COMMANDE ET FAIS-TOI LIVRER SANS BOUGER, EN TOUTE CONFIANCE.
        </h1>
      </div>

      <h2 className="text-3xl font-bold text-slate-800 mb-10 relative z-10 tracking-wider uppercase border-b-4 border-yellow-400 pb-2">
        JE SUIS
      </h2>

      {/* Main Actions Grid - 2 Columns now */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl relative z-10">
        {/* Client Card */}
        <div 
          onClick={() => onSelectRole(UserRole.CLIENT)}
          className="bg-white/80 backdrop-blur-lg p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-white/50 group flex flex-col items-center text-center transform hover:-translate-y-2 duration-300"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:from-indigo-600 group-hover:to-indigo-500 transition-all shadow-sm group-hover:shadow-indigo-200/50">
            <User className="w-10 h-10 text-indigo-600 group-hover:text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-slate-900 group-hover:text-indigo-600 transition-colors">Espace Acheteur</h3>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            Accédez à des milliers de produits vérifiés. Comparez les prix, négociez et payez en toute sécurité via Mobile Money.
          </p>
          <div className="flex items-center text-indigo-600 font-bold mt-auto bg-indigo-50 px-8 py-4 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
            Commencer mes achats <ArrowRight className="w-5 h-5 ml-2" />
          </div>
        </div>

        {/* Supplier Card */}
        <div 
          className="bg-white/80 backdrop-blur-lg p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-white/50 group flex flex-col items-center text-center transform hover:-translate-y-2 duration-300"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:from-emerald-600 group-hover:to-emerald-500 transition-all shadow-sm group-hover:shadow-emerald-200/50">
            <Briefcase className="w-10 h-10 text-emerald-600 group-hover:text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-slate-900 group-hover:text-emerald-600 transition-colors">Espace Fournisseur</h3>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            Développez votre activité. Publiez vos offres, gérez vos commandes et encaissez vos paiements instantanément.
          </p>
          
          <div className="flex gap-4 mt-auto w-full">
             <button 
               onClick={() => onSelectRole(UserRole.SUPPLIER)}
               className="flex-1 px-4 py-3 border-2 border-emerald-600 text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition-colors"
             >
               Connexion
             </button>
             <button 
               onClick={onRegisterSupplier}
               className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-200 transition-all flex items-center justify-center"
             >
               <UserPlus className="w-5 h-5 mr-2" />
               S'inscrire
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
