"use client"

import ConnectButton from '@/components/ConnectButton'
import GetstartedButton from '@/components/GetstartedButton'
import React from 'react'

export default function Home() {
  return (
    <div>
      <div className="flex flex-col items-center mt-5">
        <img src="/stake-wars-logo.png" alt="stake wars logo" className="size-[320px] hidden sm:block"/>
        <h1 className="font-bold text-2xl -mt-4 mb-1">Welcome to Stakewars</h1>
        <p className="font-light text-lg">Connect your wallet to access a whole new universe</p>
      </div>

      <div className='flex flex-col gap-4.5 justify-center items-center mt-10'>
        <ConnectButton width="w-[200px]" />
        <GetstartedButton />
      </div>
    </div>
  )
}
