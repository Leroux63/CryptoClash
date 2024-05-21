import { Fira_Code } from 'next/font/google';

const fira = Fira_Code({subsets:["latin"]});
export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
      <div className={fira.className}>{children}</div>
  );
}
