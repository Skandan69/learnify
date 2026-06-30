import './globals.css';

export const metadata = {
  title: 'Learnify — Make studying fun',
  description: 'Paste any content, pick a format, and get it repackaged in a more engaging way — without losing a single fact.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
