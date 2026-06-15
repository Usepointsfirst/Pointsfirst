import './globals.css'

export const metadata = {
  title: 'PointsFirst — The Flight Search That Starts With Your Points',
  description:
    'Select your credit cards, enter your points, and find flights you can actually book. PointsFirst combines points across cards so you never leave value on the table.',
  openGraph: {
    title: 'PointsFirst — The Flight Search That Starts With Your Points',
    description:
      'Finally. A flight search built around your credit card points — not the other way around.',
    url: 'https://usepointsfirst.com',
    siteName: 'PointsFirst',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PointsFirst — Flight Search That Starts With Your Points',
    description: 'Select cards. Enter points. Find flights. Combine across cards for max value.',
  },
  metadataBase: new URL('https://usepointsfirst.com'),
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
