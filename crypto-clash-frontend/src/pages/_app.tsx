import RootLayout from '@/component/layout'; // Vérifie le chemin si le dossier est 'component' et non 'components'
import { AppProps } from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <RootLayout>
            <Component {...pageProps} />
        </RootLayout>
    );
}

export default MyApp;
