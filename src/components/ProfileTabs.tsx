import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlayerStatistics from "./PlayerStatistics";
import UserGameRooms from "./UserRooms";
import { Dispatch, SetStateAction } from "react";

interface GameRoomSearchProps {
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export default function ProfileTabs({setIsOpen} : GameRoomSearchProps) {
  return (
      <Tabs defaultValue="active-rooms" className="">
        <TabsList className="border border-[#A78ACE] h-[47px] rounded-[10px] w-full">
            <TabsTrigger className="cursor-pointer" value="active-rooms">Active Rooms</TabsTrigger>
            <TabsTrigger className="cursor-pointer" value="battle-history">Battle History</TabsTrigger>
        </TabsList>
        <TabsContent value="active-rooms">
            <UserGameRooms setIsOpen={setIsOpen}/>
        </TabsContent>
        <TabsContent value="battle-history">
            <PlayerStatistics />
        </TabsContent>
    </Tabs>
  )
}
