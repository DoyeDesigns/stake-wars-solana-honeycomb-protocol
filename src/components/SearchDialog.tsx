import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import GameRoomSearch from "./GameRoomSearch";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useState } from "react";

export default function SearchDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="flex items-center justify-center gap-3 sm:rounded-[10px] px-3 border-none sm:border text-white/70 cursor-pointer border-[#FFFFFF78] h-10 bg-white/20 rounded-full">
        <img src="/search.png" alt="search" className="size-[18px]" />
        <span className="hidden sm:block">Search Game Room</span>
      </DialogTrigger>
      <DialogContent className="overflow-auto bg-[#111318]">
        <DialogTitle className="hidden">Search Game Room</DialogTitle>
        <GameRoomSearch setIsOpen={setIsOpen}/>
      </DialogContent>
    </Dialog>
    </div>
  );
}
