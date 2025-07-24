import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlayerStatistics from "./PlayerStatistics";
import UserGameRooms from "./UserRooms";

export default function ProfileTabs() {
  return (
      <Tabs defaultValue="active-rooms" className="">
        <TabsList className="border border-[#A78ACE] h-[47px] rounded-[10px] w-full">
            <TabsTrigger className="cursor-pointer" value="active-rooms">Active Rooms</TabsTrigger>
            <TabsTrigger className="cursor-pointer" value="battle-history">Battle History</TabsTrigger>
        </TabsList>
        <TabsContent value="active-rooms">
            <UserGameRooms />
        </TabsContent>
        <TabsContent value="battle-history">
            <PlayerStatistics />
        </TabsContent>
    </Tabs>
  )
}
