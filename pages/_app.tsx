import React from 'react';
import type { AppProps } from 'next/app'
import Head from 'next/head';
import '../styles.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Chess App</title>
        <meta name="description" content="Chess app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
