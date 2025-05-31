
import { useState } from "react";
import { useAppState } from "@/contexts/AppStateContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const History = () => {
  const { state } = useAppState();
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  
  // Helper functions to format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Filter logs by selected group
  const filteredEnergyLogs = selectedGroup === "all" 
    ? state.energyLog
    : state.energyLog.filter(log => log.groupId === selectedGroup);
  
  const filteredRedeemedRewards = selectedGroup === "all"
    ? state.redeemedRewardsLog
    : state.redeemedRewardsLog.filter(log => log.groupId === selectedGroup);
  
  // Generate habit completion data
  const habitCompletionData = state.habitLog.map(log => {
    const habit = state.habits.find(h => h.id === log.habitId);
    const group = habit ? state.groups.find(g => g.id === habit.groupId) : undefined;
    
    return {
      ...log,
      habitName: habit?.name || "已删除的习惯",
      groupName: group?.name || "已删除的分组",
      groupId: habit?.groupId
    };
  });
  
  // Filter habit logs
  const filteredHabitLogs = selectedGroup === "all"
    ? habitCompletionData
    : habitCompletionData.filter(log => log.groupId === selectedGroup);
  
  // Group logs by date
  const groupLogsByDate = (logs: any[]) => {
    const grouped: Record<string, any[]> = {};
    
    logs.forEach(log => {
      const date = log.timestamp.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(log);
    });
    
    // Convert to array sorted by date (newest first)
    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
      .map(([date, logs]) => ({ date, logs }));
  };
  
  // Group logs
  const groupedHabitLogs = groupLogsByDate(filteredHabitLogs);
  const groupedEnergyLogs = groupLogsByDate(filteredEnergyLogs);
  const groupedRewardLogs = groupLogsByDate(filteredRedeemedRewards);
  
  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">历史记录</h1>
        
        <Select 
          value={selectedGroup} 
          onValueChange={setSelectedGroup}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择分组" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分组</SelectItem>
            {state.groups.map(group => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Tabs defaultValue="habits">
        <TabsList className="mb-6">
          <TabsTrigger value="habits">习惯完成</TabsTrigger>
          <TabsTrigger value="energy">能量流水</TabsTrigger>
          <TabsTrigger value="rewards">奖励兑换</TabsTrigger>
        </TabsList>
        
        <TabsContent value="habits">
          {filteredHabitLogs.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>尚无习惯完成记录</CardTitle>
              </CardHeader>
              <CardContent>
                <p>完成你的习惯后，记录将会显示在这里。</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {groupedHabitLogs.map(({ date, logs }) => (
                <div key={date} className="space-y-2">
                  <h2 className="text-lg font-medium">{formatDate(date)}</h2>
                  <Card>
                    <CardContent className="p-0">
                      <ul className="divide-y">
                        {logs.map((log, index) => (
                          <li key={`${log.habitId}-${log.timestamp}-${index}`} className="px-4 py-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">{log.habitName}</p>
                              <p className="text-sm text-muted-foreground">分组: {log.groupName}</p>
                            </div>
                            <div className="text-sm text-right">
                              <p>{new Date(log.timestamp).toLocaleTimeString()}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="energy">
          {filteredEnergyLogs.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>尚无能量流水记录</CardTitle>
              </CardHeader>
              <CardContent>
                <p>完成习惯或兑换奖励后，能量流水将会显示在这里。</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {groupedEnergyLogs.map(({ date, logs }) => (
                <div key={date} className="space-y-2">
                  <h2 className="text-lg font-medium">{formatDate(date)}</h2>
                  <Card>
                    <CardContent className="p-0">
                      <ul className="divide-y">
                        {logs.map((log, index) => {
                          const group = state.groups.find(g => g.id === log.groupId);
                          const isPositive = log.amount > 0;
                          
                          return (
                            <li key={`${log.timestamp}-${index}`} className="px-4 py-3 flex justify-between items-center">
                              <div>
                                <p className="font-medium">{log.reason}</p>
                                <p className="text-sm text-muted-foreground">
                                  分组: {group?.name || "已删除的分组"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`font-medium ${isPositive ? 'text-habit-green' : 'text-habit-red'}`}>
                                  {isPositive ? '+' : ''}{log.amount} 能量
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="rewards">
          {filteredRedeemedRewards.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>尚无奖励兑换记录</CardTitle>
              </CardHeader>
              <CardContent>
                <p>兑换奖励后，记录将会显示在这里。</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {groupedRewardLogs.map(({ date, logs }) => (
                <div key={date} className="space-y-2">
                  <h2 className="text-lg font-medium">{formatDate(date)}</h2>
                  <Card>
                    <CardContent className="p-0">
                      <ul className="divide-y">
                        {logs.map((log, index) => {
                          const group = state.groups.find(g => g.id === log.groupId);
                          
                          return (
                            <li key={`${log.rewardId}-${log.timestamp}-${index}`} className="px-4 py-3 flex justify-between items-center">
                              <div>
                                <p className="font-medium">{log.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  分组: {group?.name || "已删除的分组"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-habit-orange">
                                  消耗 {log.energyCost} 能量
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;
