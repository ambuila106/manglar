"use client";

import '@/assets/index.css'
import {useState, useEffect} from 'react';


export default function Home() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log('El componente se ha montado');
    console.log('El valor de count es:', count);

  }, [])

  function addCount(){
    setCount(count + 1)
  }

  return (
    <main>
      <section className='main'>
        <h1 className='text-3xl font-bold title'>
          Manglar
        </h1>

        <iframe
          width="800"
          height="400"
          frameBorder="0"
          style={{ border: 0 }}
          referrerPolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBnbL1EnGF4I0lX_4GmKjOBlNYFmSR7aKk&q=Eiffel+Tower,Paris+France"
          allowFullScreen
        />


      </section>

    </main>
  );
}
}
