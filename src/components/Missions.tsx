"use client"

import React, { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserStore } from '@/store/user-store';
import { characterAdressess } from '@/lib/charater-address';
import { Character, CHARACTERS } from '@/lib/characters';
import { useWallet } from '@solana/wallet-adapter-react';
import { client } from '@/utils/constants/client';
import { PartialCharacter } from '@/app/lobby/page';
import { Map } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Missions() {
    const wallet = useWallet();
    const {user} = useUserStore();
     const [characterAbilities, setCharacterAbilities] = useState<Character[] | null>(null);

    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, "_");
    
      function getCharacterId(attributes: Record<string, string>) {
        return `${normalize(attributes.Village)}-${normalize(attributes.Chakra)}`;
      }
    
      const fetchCharacters = async () => {
        try {
          const treeAddresses = Array.from(
            new Set(characterAdressess.map((c) => c.treeAdress))
          );
    
          const { character } = await client.findCharacters({
            trees: treeAddresses,
            includeProof: true,
          });
    
          const matchedAbilities = (character as PartialCharacter[])
            .map((c) => {
              const id = getCharacterId(c.source?.params?.attributes ?? {});
              return CHARACTERS.find((char) => char.id === id);
            })
            .filter((c): c is Character => Boolean(c)); // Remove undefined values
    
          setCharacterAbilities(matchedAbilities);
        } catch (error) {
          toast.error(`Error fetching characters ${error}`);
        }
      };
    
      useEffect(() => {
        fetchCharacters();
      }, [wallet.connected]);
      
  return (
    <Sheet>
    <SheetTrigger className='w-50 bg-[#FFFFFF17] cursor-pointer rounded-lg flex justify-center gap-2 items-center py-2 px-5'><Map size={24} /> View Missions</SheetTrigger>
    <SheetContent side='right' className='!bg-[#4D4D4D] border-none'>
        <SheetHeader>
        <SheetTitle className='hidden'>Missions List</SheetTitle>
        <SheetDescription className='hidden'>
            missions list
        </SheetDescription>
        <div className='flex justify-between items-center'>
            {characterAbilities && (<div className='flex gap-5 items-center'>
                <img src={`/characters/${characterAbilities[0].id}.png`} className='size-25 border-3 border-black rounded-full' alt={characterAbilities[0].nickname} />
                <div>
                    <h1 className='font-bold text-[21px]'>{characterAbilities[0].nickname}</h1>
                    <p className='text-xs'><span className='font-bold'>Village:</span> {characterAbilities[0].village}</p>
                </div>
            </div>)}

            <div className='flex items-center gap-2.5'>
                <img src="/xp.png" alt="xp coin" />
                <span className='text-[#FFD95E]'>{user?.profiles?.[0]?.platformData?.xp ?? 0} XP</span>
            </div>
        </div>
        </SheetHeader>

        <Tabs defaultValue="active-rooms" className="">
        <TabsList className='ml-4'>
            <TabsTrigger className="cursor-pointer data-[state=active]:!bg-transparent rounded-none data-[state=active]:border-b-4 data-[state=active]:border-b-[#BFE528] p-2" value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger className="cursor-pointer data-[state=active]:!bg-transparent rounded-none data-[state=active]:border-b-4 data-[state=active]:border-b-[#BFE528] p-2" value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="ongoing">
            {/* <UserGameRooms /> */}
        </TabsContent>
        <TabsContent value="completed">
            {/* <PlayerStatistics /> */}
        </TabsContent>
    </Tabs>
    </SheetContent>
    </Sheet>
  )
}
