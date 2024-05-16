import { Dispatch, SetStateAction } from 'react';
import styles from '../styles/BurgerMenu.module.css'; // Assurez-vous que le chemin d'accès est correct

interface BurgerMenuProps {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ isOpen, setIsOpen }) => {
    return (
        <label className={`${styles.menuButton}`} htmlFor="check">
            <input
                type="checkbox"
                id="check"
                className={styles.checkboxHidden}  // Appliquez la classe de votre module CSS
                checked={isOpen}
                onChange={() => setIsOpen(!isOpen)}
            />
            <span className={`${styles.top} ${isOpen ? 'transform rotate-45 translate-y-[290%]' : ''}`}></span>
            <span className={`${styles.mid} ${isOpen ? 'transform -translate-x-[20px] opacity-0' : ''}`}></span>
            <span
                className={`${styles.bot} ${isOpen ? 'transform -rotate-45 -translate-y-[270%] w-[40px]' : ''}`}></span>
        </label>
    );
};

export default BurgerMenu;
