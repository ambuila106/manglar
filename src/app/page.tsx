"use client";

import '@/assets/index.css'
import {useEffect} from 'react';
import DeckGLGoogleMap from './components/DeckGLGoogleMap';
import TurfBezierMap from './components/TurfBezierMap';
import Image from 'next/image';


export default function Home() {
  useEffect(() => {
    console.log('El componente se ha montado');
  }, [])

  return (
    <main className='p-5'>
      <Image
        src='https://www.manglar.com/wp-content/uploads/2023/04/manglar-2023.svg'
        alt='manglar logo'
        width={400}
        height={500}
        className='manglar-logo mb-5'
      />

      <p className='presentation d-flex flex-col items-center mb-8 mt-4'>
        This is a demo of integrating <strong>deck.gl</strong> with <strong>Google Maps</strong> and using <strong>Turf.js</strong> to create Bezier curves between points.
        <br />
        This was focused on Mexico and specifically the Sinaloa region, highlighting agricultural areas.
      </p>

      <section className="text-xl font-semibold mb-4 d-flex flex-col items-center">
        <div className="deck-gl" style={{ marginBottom: '20px', width: '100%', height: '600px' }}>
          <h2 className='mb-4'>Deck.gl + Google Maps Integration</h2>
          <DeckGLGoogleMap />
        </div>
        
        <div className="turf" style={{ marginBottom: '20px', width: '90%', height: '600px' }}>
          <h2 className='mb-4'>Turf.js + Deck.gl with Bezier Curves</h2>
          <TurfBezierMap />
        </div>
      </section>

    </main>
  );
}
