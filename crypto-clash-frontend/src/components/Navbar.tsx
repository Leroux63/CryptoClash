// NavBar.tsx
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import BurgerMenu from './BurgerMenu';

interface NavbarProps {
    isConnected: boolean;
    handleWalletConnection: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isConnected, handleWalletConnection }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-transparent text-black px-4 py-2 flex items-center justify-between w-full">
            <div className="flex items-center space-x-4 flex-grow">
                <Link href="/" className="flex items-center relative">
                    <div className="absolute inset-0 bg-white opacity-20 rounded-full"></div>
                    <Image
                        src="/cryptoclash.png"
                        alt="Crypto Clash Logo"
                        width={100}
                        height={100}
                        className="relative transition-transform duration-300 ease-in-out transform hover:scale-110"
                    />
                </Link>

                <h1 className="text-4xl font-bold text-white relative hidden md:block flex-grow">
                    Crypto Clash
                    <span className="absolute inset-0 text-gray-700 transform translate-x-1 translate-y-1 blur-sm">Crypto Clash</span>
                </h1>
            </div>


            <div className="flex items-center space-x-4">
                <div className={`${isOpen ? 'hidden' : 'flex'} items-center`}>
                    <button onClick={handleWalletConnection}
                            className={`px-4 py-2 rounded ${isConnected ? 'bg-red-700' : 'bg-amber-500'} hover:bg-amber-700`}>
                        {isConnected ? "Disconnect Wallet" : "Connect Wallet"}
                    </button>
                </div>
                <div className="md:hidden">
                    <BurgerMenu isOpen={isOpen} setIsOpen={setIsOpen}/>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

