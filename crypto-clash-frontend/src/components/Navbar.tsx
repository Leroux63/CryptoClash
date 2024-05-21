// NavBar.tsx
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import BurgerMenu from './BurgerMenu';  // Assurez-vous que le chemin d'importation est correct

interface NavbarProps {
    isConnected: boolean;
    handleWalletConnection: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isConnected, handleWalletConnection }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-transparent text-black px-4 py-2 flex items-center justify-between w-full">
            {/* Logo et titre toujours visible, ajusté pour une meilleure ligne de base sur tous les écrans */}
            <div className="flex items-center space-x-4 flex-grow">
                <Link href="/" className="flex items-center">
                    <Image src="/cryptoclash.png" alt="Crypto Clash Logo" width={100} height={100}/>
                </Link>
                <h1 className="text-xl font-bold flex-grow hidden md:block">Crypto Clash</h1>
            </div>
            {/* Bouton de connexion et Burger menu */}
            <div className="flex items-center space-x-4">
                {/* Bouton de connexion visible sur tous les écrans sauf quand le menu burger est ouvert */}
                <div className={`${isOpen ? 'hidden' : 'flex'} items-center`}>
                    <button onClick={handleWalletConnection}
                            className={`px-4 py-2 rounded ${isConnected ? 'bg-red-700' : 'bg-amber-500'} hover:bg-amber-700`}>
                        {isConnected ? "Disconnect Wallet" : "Connect Wallet"}
                    </button>
                </div>

                {/* Zone du menu burger uniquement visible sur petits écrans */}
                <div className="md:hidden">
                    <BurgerMenu isOpen={isOpen} setIsOpen={setIsOpen}/>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
