import RootLayout from '@/component/layout'; // Vérifie le chemin si le dossier est 'component' et non 'components'
import { AppProps } from "next/app";
import '../styles/globals.css';  // Assurez-vous que le chemin est correct.

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <RootLayout>
            <Component {...pageProps} />
        </RootLayout>
    );
}

export default MyApp;
